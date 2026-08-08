import { criarFila, filaDosBancos } from "@/api/fila";

/**
 * Um observador de quantas tarefas estiveram em voo ao mesmo tempo.
 *
 * ⚠️ Regista o **máximo**, e não o valor no fim: no fim são sempre zero, e um
 * teste que só olhasse para lá passava com fila nenhuma.
 */
function observador() {
  let emVoo = 0;
  let maximo = 0;
  const libertar: (() => void)[] = [];

  return {
    get maximo() {
      return maximo;
    },
    /** Uma tarefa que só termina quando alguém a mandar terminar. */
    tarefa() {
      emVoo += 1;
      maximo = Math.max(maximo, emVoo);
      return new Promise<void>((resolver) => {
        libertar.push(() => {
          emVoo -= 1;
          resolver();
        });
      });
    },
    /** Deixa terminar as que já partiram, e cede o ciclo para as seguintes irem. */
    async libertarTodas() {
      while (libertar.length > 0) {
        libertar.shift()?.();
        await Promise.resolve();
        await Promise.resolve();
      }
    },
  };
}

describe("a fila do fan-out", () => {
  // ⚠️ **É o teste que a `criarFila` existe para poder falhar**, e afirma só a
  // fila: montada aqui, com tarefas daqui.
  //
  // ⚠️ **Dizia que a reversão era tirar a fila do `queryFn`, e isso era falso** —
  // medido a 2026-08-08: nessa montagem a suite inteira ficava verde, porque
  // nenhum teste importava o `useOfertasPorBanco`. Quem prende o fio entre a fila
  // e o pedido é o `fan-out.test.tsx`, e é lá que essa reversão falha.
  it("nunca deixa passar mais do que as vagas", async () => {
    const obs = observador();
    const comVaga = criarFila(3);

    const todas = Promise.all(Array.from({ length: 5 }, () => comVaga(() => obs.tarefa())));
    await Promise.resolve();
    await Promise.resolve();

    expect(obs.maximo).toBe(3);

    await obs.libertarTodas();
    await todas;
    expect(obs.maximo).toBe(3);
  });

  // ⚠️ **Sem isto, um banco em baixo consumia uma vaga para sempre** e a lista
  // deixava de encher: as duas que sobravam acabavam, e as restantes ficavam à
  // espera de uma que nunca voltava.
  it("liberta a vaga quando a tarefa rejeita", async () => {
    const comVaga = criarFila(1);
    const ordem: string[] = [];

    const primeira = comVaga(async () => {
      ordem.push("primeira");
      throw new Error("banco em baixo");
    });
    const segunda = comVaga(async () => {
      ordem.push("segunda");
    });

    await expect(primeira).rejects.toThrow("banco em baixo");
    await segunda;
    expect(ordem).toEqual(["primeira", "segunda"]);
  });

  // ⚠️ A ordem de partida é a de chegada, e não a inversa: os bancos entram pela
  // ordem que a API os serve. Uma pilha punha o último a ser pedido primeiro.
  it("deixa partir por ordem de chegada", async () => {
    const comVaga = criarFila(1);
    const ordem: number[] = [];

    const todas = Promise.all(
      [1, 2, 3].map((n) =>
        comVaga(async () => {
          ordem.push(n);
        }),
      ),
    );

    await todas;
    expect(ordem).toEqual([1, 2, 3]);
  });

  it("recusa uma fila sem vagas", () => {
    expect(() => criarFila(0)).toThrow(/menos de uma vaga/);
  });

  // ⚠️ O número é escolhido e não medido — ver o comentário na `filaDosBancos`.
  // O teste existe para que subi-lo seja uma decisão e não um descuido: com
  // cinco bancos, três é o que mantém o pior caso em ~11 s contra os ~8,4 s de
  // os disparar todos.
  it("tem três vagas para os bancos", async () => {
    const obs = observador();

    const todas = Promise.all(Array.from({ length: 5 }, () => filaDosBancos(() => obs.tarefa())));
    await Promise.resolve();
    await Promise.resolve();

    expect(obs.maximo).toBe(3);

    await obs.libertarTodas();
    await todas;
  });
});

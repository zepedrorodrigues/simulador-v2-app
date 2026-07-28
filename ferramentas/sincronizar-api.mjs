// Sincroniza o contrato com o backend e gera os tipos.
//
// ⚠️ **Duas coisas ficam commitadas: a CÓPIA do esquema e os tipos gerados dela.**
// A razão está na §2 do `docs/APP.md` do backend, e é a mesma para as duas: um
// ficheiro buscado em tempo de build faz a app mudar de comportamento sem
// ninguém lhe mexer, e faz o build depender de outro repositório estar por
// perto. Commitados, uma mudança de contrato aparece em dois diffs que alguém
// tem de aprovar — o do esquema, que se lê, e o dos tipos, que é consequência.
//
// Uso:
//   node ferramentas/sincronizar-api.mjs              copia e regenera
//   node ferramentas/sincronizar-api.mjs --verificar  não escreve; falha se diferir
//
// O segundo é o que o CI corre.

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, "..");

const COPIA = join(raiz, "contrato", "openapi.yaml");
const TIPOS = join(raiz, "api", "api.d.ts");

// ⚠️ O backend é um repositório IRMÃO, e o caminho é assumido e não configurado
// de propósito: quem o tiver noutro sítio vê a mensagem de erro dizer qual é a
// variável. Uma configuração que ninguém precisa de mudar é ruído.
const ORIGEM =
  process.env.SIMULADOR_V2 ?? resolve(raiz, "..", "simulador-v2", "api", "openapi.yaml");

const verificar = process.argv.includes("--verificar");

function principal() {
  const copiaAntiga = existsSync(COPIA) ? readFileSync(COPIA, "utf8") : null;

  let esquema;
  if (existsSync(ORIGEM)) {
    esquema = readFileSync(ORIGEM, "utf8");
  } else if (copiaAntiga !== null) {
    // ⚠️ Sem o repositório irmão por perto — no CI, por exemplo — regenera-se a
    // partir da cópia commitada. É precisamente o caso que justifica commitá-la:
    // sem ela, o CI não tinha do que gerar e teria de ir à rede buscar o
    // esquema, que é a dependência que a §2 proíbe.
    esquema = copiaAntiga;
  } else {
    falhar(
      `não encontrei o esquema em ${ORIGEM} nem uma cópia em ${COPIA}.\n` +
        `Se o backend está noutro sítio, aponta o SIMULADOR_V2 ao ficheiro openapi.yaml.`,
    );
  }

  if (copiaAntiga !== null && esquema !== copiaAntiga) {
    if (verificar) {
      falhar(
        "o contrato do backend mudou e a cópia deste repositório está velha.\n" +
          "Corre `npm run sincronizar-api`, LÊ o diff do contrato, e committa os dois ficheiros.",
      );
    }
    console.log("⚠️  o contrato mudou — lê o diff de contrato/openapi.yaml antes de committar");
  }

  const tiposAntigos = existsSync(TIPOS) ? readFileSync(TIPOS, "utf8") : null;

  // Escreve-se sempre para um sítio temporário e compara-se: no modo
  // `--verificar` o repositório não pode ficar mexido, senão o próprio passo de
  // verificação escondia a diferença que devia denunciar.
  const destino = verificar ? join(raiz, "node_modules", ".api-verificacao.d.ts") : TIPOS;
  mkdirSync(dirname(destino), { recursive: true });
  if (!verificar) {
    mkdirSync(dirname(COPIA), { recursive: true });
    writeFileSync(COPIA, esquema);
  }

  // ⚠️ Chama-se o gerador pelo **node com o caminho do bin**, e não por `npx`
  // com `shell: true`. Duas razões: numa shell os argumentos são concatenados e
  // não escapados — um caminho com aspas ou `&` passava a ser comando —, e o
  // `npx` iria buscar a versão que lhe apetecesse em vez da que está no
  // `package-lock.json`. O que o portão verifica tem de ser o que corre aqui.
  //
  // ⚠️ O caminho sai do `package.json` do gerador — do campo `bin` dele — e não
  // de uma string escrita aqui. Se ele mudar o nome do ficheiro numa versão
  // nova, isto continua a funcionar; uma string escrita à mão passava a apontar
  // para um ficheiro que já não existe, e só se descobria no dia da
  // actualização.
  const exigir = createRequire(import.meta.url);
  const manifesto = exigir.resolve("openapi-typescript/package.json");
  const bin = exigir("openapi-typescript/package.json").bin["openapi-typescript"];
  const gerador = join(dirname(manifesto), bin);
  execFileSync(process.execPath, [gerador, COPIA, "-o", destino], {
    stdio: ["ignore", "ignore", "inherit"],
  });

  const tiposNovos = readFileSync(destino, "utf8");
  if (verificar && tiposNovos !== tiposAntigos) {
    falhar(
      "os tipos gerados não batem com o contrato commitado.\n" +
        "Corre `npm run sincronizar-api` e committa o api/api.d.ts.",
    );
  }

  console.log(verificar ? "contrato e tipos em dia" : `tipos gerados em ${TIPOS}`);
}

function falhar(mensagem) {
  console.error(`sincronizar-api: ${mensagem}`);
  process.exit(1);
}

principal();

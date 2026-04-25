import { Client } from "@mysql/client";
import { NFeSimplificada } from "./interfaces.ts";
import { config } from "./configs.ts";

const database = "01trab";

// -------------------------------------------------------------------------
// 2. FUNÇÃO PRINCIPAL
// -------------------------------------------------------------------------

export async function processarNFeEConsultarDB(
  nfeContent: string
): Promise<NFeSimplificada | null> {
  let client: Client | null = null;

  try {
    // ------------------------------------
    // PARTE A: CARREGAR NFE SIMPLIFICADA
    // ------------------------------------
    //const jsonString = await Deno.readTextFile(nfeContent);
    const nfeSimplificada: NFeSimplificada = JSON.parse(nfeContent);

    const itensNFe = nfeSimplificada.nfeProc.NFe.infNFe.det;

    // Extrai todos os cEANs para a consulta
    const cEANs = itensNFe.map((item) => item.prod.cEAN);
    // ------------------------------------
    // PARTE B: CONSULTA OTIMIZADA NO DB
    // ------------------------------------
    ("");
    client = new Client();
    await client.connect(config(database));

    // Cria a cláusula IN para consultar todos os cEANs de uma só vez
    // NOTA: Concatenação direta é usada aqui por simplicidade,
    // mas em produção, use consultas parametrizadas para evitar SQL Injection.
    const inClause = cEANs.join(", ");
    
    const removerItensVazios = (lista: string): string[] => {
      return lista
        // 1. Separa a string em um array usando a vírgula como delimitador
        .split(',') 
        // 2. Remove espaços em branco do início e fim de cada item
        .map(item => item.trim())
        // 3. Filtra: Mantém apenas os itens que não são strings vazias
        // O operador '!!item' converte o valor para booleano (!!'' é false, !!'123' é true)
        .filter(item => !!item);
    }
    const removerItensVaziosArray = removerItensVazios(inClause);


    // Consulta:
    // Coluna 1 (codpro) é o valor que queremos mapear
    // Coluna 2 (codigo) é a chave de pesquisa (o cEAN)
    const query = `SELECT codpro, codigo FROM cadcod WHERE codigo IN (${removerItensVaziosArray.join(', ')});`;

    const dbResult = await client.query(query);

    // Cria um mapa para busca rápida: { codigo: codpro }
    // O resultado do query é geralmente um array.
    const codigosMap = new Map<number, string>();
    for (const row of dbResult) {
      const codigoNumerico = Number(row.codigo);
      // Assume-se que 'codigo' e 'codpro' são as chaves retornadas pelo driver
      codigosMap.set(codigoNumerico, row.codpro);
    }

    // ------------------------------------
    // PARTE C: MAPEAR E ATUALIZAR NF-E
    // ------------------------------------

    for (const item of itensNFe) {
      const cEAN = item.prod.cEAN;
      const codproEncontrado = codigosMap.get(cEAN);
      // Se o codpro foi encontrado, atribui-o. Caso contrário, atribui string vazia.
      item.prod.codIntLoja = codproEncontrado ?? "";
    }


    return nfeSimplificada;
  } catch (error) {
    console.error("❌ Ocorreu um erro durante a operação:", error);
    return null;
  } finally {
    if (client) {
      await client.close();
      console.log("🛑 Conexão encerrada.");
    }
  }
}

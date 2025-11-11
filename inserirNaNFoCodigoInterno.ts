import { Client } from "@mysql/client";
import { NFeSimplificada } from "./interfaces.ts";
import { config } from "./configs.ts";

const database = "01trab"


// -------------------------------------------------------------------------
// 2. FUNÇÃO PRINCIPAL
// -------------------------------------------------------------------------

async function processarNFeEConsultarDB(nfeFilePath: string): Promise<NFeSimplificada | null> {
  let client: Client | null = null;
  
  try {
    // ------------------------------------
    // PARTE A: CARREGAR NFE SIMPLIFICADA
    // ------------------------------------
    const jsonString = await Deno.readTextFile(nfeFilePath);
    const nfeSimplificada: NFeSimplificada = JSON.parse(jsonString);
    console.log(`✅ NF-e simplificada carregada de: ${nfeFilePath}`);

    const itensNFe = nfeSimplificada.nfeProc.NFe.infNFe.det;
    
    // Extrai todos os cEANs para a consulta
    const cEANs = itensNFe.map(item => item.prod.cEAN);
    
    // ------------------------------------
    // PARTE B: CONSULTA OTIMIZADA NO DB
    // ------------------------------------
    
    client = new Client();
    await client.connect(config(database));
    console.log(`✅ Conexão estabelecida com sucesso com o DB ${database}!`);

    // Cria a cláusula IN para consultar todos os cEANs de uma só vez
    // NOTA: Concatenação direta é usada aqui por simplicidade, 
    // mas em produção, use consultas parametrizadas para evitar SQL Injection.
    const inClause = cEANs.join(', ');
    
    // Consulta:
    // Coluna 1 (codpro) é o valor que queremos mapear
    // Coluna 2 (codigo) é a chave de pesquisa (o cEAN)
    const query = `SELECT codpro, codigo FROM cadcod WHERE codigo IN (${inClause});`;
    console.log(`🔎 Executando a consulta otimizada para ${cEANs.length} itens.`);
    
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
        item.prod.codIntLoja = codproEncontrado ?? '';
    }

    console.log(`\n🎉 Mapeamento concluído. ${codigosMap.size} códigos encontrados no DB.`);
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

// -------------------------------------------------------------------------
// 3. EXECUÇÃO
// -------------------------------------------------------------------------

export async function inserirNaNFoCodigoInterno(NFE_FILE_NAME: string): Promise<string | unknown> {
    const nfeAtualizada = await processarNFeEConsultarDB(NFE_FILE_NAME);

    if (nfeAtualizada) {
        const FINAL_FILE_NAME = "./nfe_final.json";
        await Deno.writeTextFile(FINAL_FILE_NAME, JSON.stringify(nfeAtualizada, null, 2));
        console.log(`\n💾 NF-e atualizada com 'codIntLoja' salva em: ${FINAL_FILE_NAME}`);
        return FINAL_FILE_NAME
    } else {
        console.log("\nProcessamento falhou, arquivo final não foi salvo.");
    }
}

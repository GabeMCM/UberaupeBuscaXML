import { Client } from "@mysql/client";
import { NFeFinal, NFeSimplificada } from "./interfaces.ts";
import { config } from "./configs.ts";

const database = "01trab"

// -------------------------------------------------------------------------
// 2. FUNÇÃO PRINCIPAL
// -------------------------------------------------------------------------

/**
 * Carrega a NF-e final, consulta a tabela 'cadmer' com base no codIntLoja 
 * e insere as informações detalhadas da mercadoria nos itens.
 */
export async function buscarDetalhesMercadoria(nfeContentComCod: NFeSimplificada): Promise<NFeFinal | null> {
  let client: Client | null = null;
  
  try {
    // ------------------------------------
    // PARTE A: CARREGAR NFE FINAL
    // ------------------------------------
    const nfeAtualizada: NFeFinal = nfeContentComCod;

    const itensNFe = nfeAtualizada.nfeProc.NFe.infNFe.det;
    
    // ⚠️ Filtra apenas os itens que possuem o codIntLoja (evita buscar strings vazias)
    const codigosBusca = itensNFe
        .map(item => item.prod.codIntLoja)
        .filter((cod): cod is string => !!cod); // Filtra strings vazias/undefined

    if (codigosBusca.length === 0) {
      console.log("⚠️ Nenhum 'codIntLoja' encontrado para buscar no DB.");
      return nfeAtualizada;
    }

    // ------------------------------------
    // PARTE B: CONSULTA OTIMIZADA NO NOVO DB
    // ------------------------------------
    
    client = new Client();
    await client.connect(config(database));
    console.log(`✅ Conexão estabelecida com sucesso com o DB: ${database}!`);

    // Prepara a lista de códigos para a cláusula IN
    const inClause = codigosBusca.map(c => `'${c}'`).join(', ');
    
    const query = `
      SELECT codmer, cod, nome, un, compl, local, local2 
      FROM cadmer 
      WHERE codmer IN (${inClause});
    `;
    console.log(`🔎 Executando consulta otimizada para ${codigosBusca.length} códigos na tabela 'cadmer'.`);
    
    const dbResult = await client.query(query);
    
    // Cria um mapa para busca rápida: { codmer: { cod, nome, un, ... } }
    const detalhesMap = new Map<string, Omit<typeof dbResult[0], 'codmer'>>();
    for (const row of dbResult) {
        // Armazena todos os detalhes, usando codmer como chave
        detalhesMap.set(row.codmer, row);
    }
    
    // ------------------------------------
    // PARTE C: MAPEAR E INSERIR DETALHES
    // ------------------------------------

    for (const item of itensNFe) {
        const codmer = item.prod.codIntLoja;

        if (codmer) {
            const detalhes = detalhesMap.get(codmer);

            if (detalhes) {
                // Insere os novos campos no objeto 'prod'
                Object.assign(item.prod, {
                    cod: detalhes.cod ?? '',
                    nome: detalhes.nome ?? '',
                    un: detalhes.un ?? '',
                    compl: detalhes.compl ?? '',
                    local: detalhes.local ?? '',
                    local2: detalhes.local2 ?? '',
                });
            } else {
                console.log(`   [!] Detalhes não encontrados para codIntLoja: ${codmer}`);
            }
        }
    }

    console.log(`\n🎉 Mapeamento de detalhes da mercadoria concluído.`);
    return nfeAtualizada;
    
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



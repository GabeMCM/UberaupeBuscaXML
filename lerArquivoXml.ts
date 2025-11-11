import { parse } from "@xml/parser";
import { 
    XmlNFeRaw, 
    XmlItemRaw,  
    ProdutoSimplificado, 
    NFeSimplificada 
} from "./interfaces.ts";

/** 
 * Mapeia o objeto XML parseado para a estrutura JSON simplificada desejada.
 * @param xmlObject Objeto JavaScript resultante da função parse() do XML, tipado como XmlNFeRaw.
 */
function mapearXmlParaJsonSimplificada(xmlObject: XmlNFeRaw | object): NFeSimplificada {
    
    // Type Guard para verificar se a estrutura que precisamos existe
    if (!('nfeProc' in xmlObject)) {
        throw new Error("Objeto de entrada XML não é um XmlNFeRaw válido.");
    }
    
    // Asserções para garantir que a estrutura existe antes de prosseguir
    const infNFe = (xmlObject.nfeProc.NFe.infNFe)!;
    const transp = (infNFe.transp)!; // Asserção no transp
    
    // Mapeamento dos Itens (det)
    const detalhes = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];

    // O item agora é tipado como XmlItemRaw
    const itensSimplificados: ProdutoSimplificado[] = detalhes.map((item: XmlItemRaw) => ({
      '@nItem': parseInt(item['@nItem']), 
      prod: {
        // Conversão explícita para string ou number, confiando no parser
        cProd: String(item.prod.cProd),
        cEAN: parseInt(String(item.prod.cEAN)),
        xProd: String(item.prod.xProd),
        uCom: String(item.prod.uCom),
        qCom: parseFloat(String(item.prod.qCom)),
        cEANTrib: parseInt(String(item.prod.cEANTrib)),
      }
    }));
    
    // Reconstrução do Objeto Final 
    const novoJson: NFeSimplificada = {
      nfeProc: {
        NFe: {
          infNFe: {
            '@Id': infNFe['@Id'],

            ide: {
              nNF: parseInt(String(infNFe.ide.nNF)),  
              dhEmi: String(infNFe.ide.dhEmi),  
            },
            // ... (restante do mapeamento, garantindo a conversão de tipo)
            emit: {
                CNPJ: parseInt(String(infNFe.emit.CNPJ)),  
                xNome: String(infNFe.emit.xNome),
                xFant: String(infNFe.emit.xFant),
            },
            dest: {
                CNPJ: parseInt(String(infNFe.dest.CNPJ)),  
                xNome: String(infNFe.dest.xNome),
            },
            det: itensSimplificados, 
            total: {
                ICMSTot: {
                    vNF: parseFloat(String(infNFe.total.ICMSTot.vNF)),  
                }
            },
            vol: {
                qVol: parseInt(String(transp.vol.qVol)),  
            }
          }
        }
      }
    };
    return novoJson;
}
// --- Funções de Leitura e Execução ---

const OUTPUT_FILE_PATH = "./nfe_simplificada.json";

export async function lerArquivoXml(XML_FILE_PATH: string): Promise<string | unknown> {
  try {
    const xmlString = await Deno.readTextFile(XML_FILE_PATH);
    console.log(`✅ Arquivo XML "${XML_FILE_PATH}" lido com sucesso.`);
    
    const xmlObject = parse(xmlString);
    console.log(typeof(xmlObject))
    const saidaFinal = mapearXmlParaJsonSimplificada(xmlObject);
    
    const jsonOutputString = JSON.stringify(saidaFinal, null, 2);

    await Deno.writeTextFile(OUTPUT_FILE_PATH, jsonOutputString);

    console.log(`\n🎉 Saída JSON final salva em: ${OUTPUT_FILE_PATH}`);
    return OUTPUT_FILE_PATH
   
  } catch (error) {
    console.error(`❌ Ocorreu um erro ao processar o XML:`, error);
  }
}

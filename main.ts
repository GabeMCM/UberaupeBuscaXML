import { lerArquivoXml } from "./lerArquivoXml.ts";
import { processarNFeEConsultarDB } from "./inserirNaNFoCodigoInterno.ts";
import { buscarDetalhesMercadoria } from "./inserirNaNFDetalhesDaMercadoria.ts";
import { gerarTabelaHTML } from "./gerarTabela.ts";
import { NFeFinal, NFeSimplificada } from "./interfaces.ts";

export async function processarXMLInterno(xmlContent: string): Promise<object> {
  try {
    const arquivo_xml = await lerArquivoXml(xmlContent);
    console.log("Arquivo XML lido e processado:", arquivo_xml);
    if (arquivo_xml === null) {
      throw new Error(
        "Erro na leitura/parse do XML. Verifique o console de Deno."
      );
    }
    const arquivo_xml_path = arquivo_xml.OUTPUT_FILE_PATH;
    console.log("Caminho do arquivo XML processado:", arquivo_xml_path);
    const arquivo_com_cod = await processarNFeEConsultarDB(
      arquivo_xml_path as string
    );
    console.log("Arquivo com códigos internos processado:", arquivo_com_cod);
    const resultado_completo = await buscarDetalhesMercadoria(
      arquivo_com_cod as NFeSimplificada
    );
    console.log(
      "Resultado completo com detalhes da mercadoria:",
      resultado_completo
    );
    const gerar_tabela = await gerarTabelaHTML(resultado_completo as NFeFinal);
    return {
      tabela: gerar_tabela,
      numNfe: arquivo_xml.numNfe,
    };
  } catch (error) {
    throw new Error(`Erro ao processar XML: ${error}`);
  }
}

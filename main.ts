import { lerArquivoXml } from "./lerArquivoXml.ts";
import { inserirNaNFoCodigoInterno } from "./inserirNaNFoCodigoInterno.ts";
import { inserirNaNFDetalhesDaMercadoria } from "./inserirNaNFDetalhesDaMercadoria.ts"

const XML_FILE_PATH = "35251004949853000125550010005416121486188965-nfe (1).xml"; 

try {
    const arquivo_xml = await lerArquivoXml(XML_FILE_PATH);
    const arquivo_com_cod = await inserirNaNFoCodigoInterno(arquivo_xml as string);
    const resultado_completo = await inserirNaNFDetalhesDaMercadoria(arquivo_com_cod as string);
    console.log(resultado_completo)
} catch (error) {
    throw new Error(`Erro: ${error}`);
}

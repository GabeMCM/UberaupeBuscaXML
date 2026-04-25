/**
 * interfaces.ts
 * Arquivo centralizado para todas as tipagens relacionadas à NF-e.
 */

// ----------------------------------------------------
// TIPOS BASE PARA PARSING DE XML
// ----------------------------------------------------

// Tipo para os nós folha que contêm valor no objeto parseado pelo XML (pode ser string, número, ou nulo/indefinido)
export type XmlNodeValue = string | number | null | undefined;

// ----------------------------------------------------
// 1. ESTRUTURAS DE ENTRADA (XML Bruto após Parse)
// ----------------------------------------------------

// Interface para a seção 'prod' de um item XML bruto
export interface XmlProdutoRaw {
    cProd: XmlNodeValue;
    cEAN: XmlNodeValue;
    xProd: XmlNodeValue;
    uCom: XmlNodeValue;
    qCom: XmlNodeValue;
    cEANTrib: XmlNodeValue;
    [key: string]: unknown; // Permite outras tags internas (NCM, CEST, etc.)
}

// Interface para um item de detalhe (det) do XML bruto
export interface XmlItemRaw {
    '@nItem': string;
    prod: XmlProdutoRaw;
    [key: string]: unknown; // Permite outras tags internas (imposto, etc.)
}

// Interface para a estrutura principal da NF-e BRUTA (resultado do parse)
export interface XmlNFeRaw {
    [key: string]: unknown; // Permite tags de cabeçalho como 'xml', 'protNFe', etc.
    nfeProc: {
        NFe: {
            infNFe: {
                '@Id': string;
                ide: { nNF: XmlNodeValue; dhEmi: XmlNodeValue; [key: string]: unknown; };
                emit: { CNPJ: XmlNodeValue; xNome: XmlNodeValue; xFant: XmlNodeValue; [key: string]: unknown; };
                dest: { CNPJ: XmlNodeValue; xNome: XmlNodeValue; [key: string]: unknown; };
                det: XmlItemRaw | XmlItemRaw[]; // Pode ser array ou objeto único
                total: { ICMSTot: { vNF: XmlNodeValue; [key: string]: unknown; }; [key: string]: unknown; };
                transp: { vol: { qVol: XmlNodeValue; [key: string]: unknown; }; [key: string]: unknown; };
                [key: string]: unknown; 
            };
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
}


// ----------------------------------------------------
// 2. ESTRUTURAS DE SAÍDA (JSON Simplificado e Processado)
// ----------------------------------------------------

// Interface Base: NF-e Simplificada (Após mapeamento inicial do XML)
export interface ProdutoSimplificado {
  '@nItem': number;
  prod: {
    cProd: string;
    cEAN: number;
    xProd: string;
    uCom: string;
    qCom: number;
    cEANTrib: number;
    codIntLoja?: string; // Campo adicionado após a 1ª consulta (cEAN -> codmer)
  };
}

export interface NFeSimplificada {
  nfeProc: {
    NFe: {
      infNFe: {
        '@Id': string;
        ide: { nNF: number; dhEmi: string; };
        emit: { CNPJ: number; xNome: string; xFant: string; };
        dest: { CNPJ: number; xNome: string; };
        det: ProdutoSimplificado[];
        total: { ICMSTot: { vNF: number; }; };
        vol: { qVol: number; };
      };
    };
  };
}


// Interface Final: NF-e Completa (Após a 2ª consulta para detalhes da mercadoria)
// Usa Intersection Type (&) para estender a interface ProdutoSimplificado
export interface ProdutoCompleto extends ProdutoSimplificado {
  prod: ProdutoSimplificado['prod'] & {
    cod?: string;
    nome?: string;
    un?: string;
    compl?: string;
    local?: string;
    local2?: string;
  };
}

export interface NFeFinal {
  nfeProc: {
    NFe: {
      infNFe: {
        '@Id': string;
        ide: { nNF: number; dhEmi: string; };
        emit: { CNPJ: number; xNome: string; xFant: string; };
        dest: { CNPJ: number; xNome: string; };
        det: ProdutoCompleto[]; // O array agora é do tipo completo
        total: { ICMSTot: { vNF: number; }; };
        vol: { qVol: number; };
      };
    };
  };
}

export interface NFeInfoRetorno {
    OUTPUT_FILE_PATH: string;
    numNfe: number; 
}
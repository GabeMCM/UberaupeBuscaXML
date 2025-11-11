// Assegure-se de importar o tipo correto para a estrutura final
import { NFeFinal, ProdutoCompleto } from "./interfaces.ts"; 

// Função auxiliar para garantir que o número tenha 2 casas decimais (para vNF)
const formatarNumero = (valor: number): string => valor.toFixed(2).replace('.', ',');

/**
 * Converte a lista de itens da NF-e (det) em uma tabela HTML estilizada.
 * @param nfe Objeto JSON completo da NF-e final.
 * @returns String contendo o HTML completo da página.
 */
function gerarTabelaHTML(nfe: NFeFinal): string {
    const itens = nfe.nfeProc.NFe.infNFe.det;
    const infoGeral = nfe.nfeProc.NFe.infNFe;
    
    // Obter o valor total da NF para o rodapé
    const valorTotalNF = infoGeral.total.ICMSTot.vNF;

    // A tabela agora tem 10 COLUNAS (contagem para o rodapé)
    const totalColunas = 10;
    const colspanTotal = totalColunas - 1; 

    // ------------------------------------
    // 1. Geração das Linhas de Detalhe (tbody)
    // ------------------------------------
    const linhasTabela = itens.map((item: ProdutoCompleto) => {
        const prod = item.prod;
        
        // Aplicação das classes nas TDs
        return `
            <tr>
                <td class="col-item">${item['@nItem']}</td>
                <td class="col-cod-forn">${prod.cProd}</td>
                <td class="col-desc">${prod.xProd}</td>
                <td class="col-un-nfe center">${prod.qCom}</td>
                <td class="col-un-nfe center">${prod.uCom ?? ''}</td>
                <td class="col-loja center">${prod.codIntLoja ?? ''}</td>
                <td class="col-nome">${prod.nome ?? ''}</td>
                <td class="col-un-db center">${prod.un ?? ''}</td>
                <td class="col-local center">${prod.local ?? ''}</td>
                <td class="col-local center">${prod.local2 ?? ''}</td>
            </tr>
        `;
    }).join('\n'); // Junta todas as linhas em uma string

    // ------------------------------------
    // 2. Montagem do HTML Completo
    // ------------------------------------
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detalhes da NF-e ${infoGeral.ide.nNF}</title>
    <style>
        /* ESTILOS PARA VISUALIZAÇÃO EM TELA (WEB) */
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f9; }
        h1 { color: #333; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
        .info-header { margin-bottom: 20px; padding: 10px; background-color: #e0f7fa; border-left: 5px solid #00bcd4; font-size: 0.9em; }
        
        /* REGRAS CRUCIAIS PARA LARGURA DA TABELA EM TELA */
        table { 
            width: 100%; 
            table-layout: fixed;
            border-collapse: collapse; 
            margin-top: 20px; 
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); 
            background-color: white; 
            word-break: break-all;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 10px 6px; 
            text-align: left; 
            font-size: 0.8em; 
            word-wrap: break-word;
            white-space: normal;
        }
        th { background-color: #007bff; color: white; position: sticky; top: 0; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .center { text-align: center; }
        .footer-total { font-weight: bold; background-color: #c8e6c9; }

        /* DEFINIÇÃO DE LARGURAS OTIMIZADA (10 COLUNAS) */
        .col-item { width: 4%; } 
        .col-cod-forn { width: 8%; }
        .col-desc { width: 22%; }
        .col-nome { width: 22%; }
        .col-un-nfe, .col-un-db { width: 5%; }
        
        /* FOCO VISUAL: SOMENTE NEGRITO */
        .col-loja { 
            width: 7%;
            font-weight: bold; 
        }

        .col-local {
            width: 8%;
            font-weight: bold;
            text-align: center;
        }


        /* ======================================================= */
        /* === ESTILOS PARA IMPRESSÃO (MEDIA PRINT) === */
        /* ======================================================= */
        
        @page {
            /* Define o tamanho da página e as margens para A4 */
            size: A4 portrait;
            margin: 0.8cm;
        }
        
        @media print {
            body {
                margin: 0;
                font-size: 8.5pt; 
                color: #000;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            /* Garante que o cabeçalho fique no topo e não seja dividido */
            h1, .info-header {
                margin: 0;
                padding-top: 0;
                position: static;
                page-break-after: avoid; 
                background-color: #fff;
                border-bottom: 1px solid #ddd;
            }

            table {
                margin-top: 5px;
                width: 100%;
                table-layout: fixed;
            }

            /* Força estilos de foco na impressão (SOMENTE NEGRITO) */
            .col-local, .col-loja {
                font-weight: bold !important;
            }

            tbody tr {
                page-break-inside: avoid;
            }

            th {
                background-color: #007bff !important;
                color: white !important;
            }
        }
    </style>
</head>
<body>

    <h1>📋 Detalhes dos Produtos da NF-e ${infoGeral.ide.nNF}</h1>
    
    <div class="info-header">
        <strong>Chave de Acesso (ID):</strong> ${infoGeral['@Id']}<br>
        <strong>Emitente:</strong> ${infoGeral.emit.xNome} (${infoGeral.emit.CNPJ})<br>
        <strong>Destinatário:</strong> ${infoGeral.dest.xNome} (${infoGeral.dest.CNPJ})<br>
        <strong>Data de Emissão:</strong> ${new Date(infoGeral.ide.dhEmi).toLocaleString()}
    </div>

    <table>
        <thead>
            <tr>
                <th class="col-item">Item</th>
                <th class="col-cod-forn">Cód. Forn.</th>
                <th class="col-desc">Descrição</th>
                <th class="col-un-nfe center">Qtd</th>
                <th class="col-un-nfe center">Un NFE.</th>
                <th class="col-loja">Cód. Loja</th>
                <th class="col-nome">Nome Mercadoria</th>
                <th class="col-un-db center">Un. DB</th>
                <th class="col-local">Local 1</th>
                <th class="col-local">Local 2</th>
            </tr>
        </thead>
        <tbody>
            ${linhasTabela}
        </tbody>
        <tfoot>
            <tr class="footer-total">
                <td colspan="${colspanTotal}">VALOR TOTAL DA NOTA FISCAL:</td>
                <td colspan="1">R$ ${formatarNumero(valorTotalNF)}</td>
            </tr>
        </tfoot>
    </table>

</body>
</html>
    `;
}

// -------------------------------------------------------------------------
// 3. EXEMPLO DE USO (Integração com Deno)
// -------------------------------------------------------------------------

const NFE_INPUT_FILE = "./nfe_com_detalhes.json"; 
const HTML_OUTPUT_FILE = "./nfe_detalhes.html"; 

async function gerarVisualizacaoHTML() {
    try {
        const jsonString = await Deno.readTextFile(NFE_INPUT_FILE);
        const nfeFinal: NFeFinal = JSON.parse(jsonString);

        console.log(`✅ NF-e carregada para visualização.`);

        const htmlContent = gerarTabelaHTML(nfeFinal);

        await Deno.writeTextFile(HTML_OUTPUT_FILE, htmlContent);

        console.log(`\n🎉 Tabela HTML gerada com sucesso.`);
        console.log(`📁 Abra o arquivo "${HTML_OUTPUT_FILE}" no seu navegador e use Ctrl+P ou Cmd+P para imprimir.`);

    } catch (error) {
        console.error(`❌ Ocorreu um erro ao gerar o HTML:`, error);
        console.log(`Verifique se o arquivo "${NFE_INPUT_FILE}" existe e se a permissão --allow-read/--allow-write está ativa.`);
    }
}

gerarVisualizacaoHTML();
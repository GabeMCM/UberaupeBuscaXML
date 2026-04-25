import { processarXMLInterno } from "./main.ts"; // Importa seu motor

const PORT = 8000;
const APP_URL = `http://localhost:${PORT}/`;

// --- CONTEÚDO HTML/JS DA SPA (Frontend) ---
const FRONTEND_HTML = /*html*/`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Processador Deno SPA</title>
    <style>
        body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; padding: 40px; }
        .container { background-color: #f4f4f4; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); width: 400px; text-align: center;}
        input[type="file"], button { margin: 10px 0; padding: 10px; border-radius: 5px; border: 1px solid #ccc; width: 90%; }
        button { background-color: #007bff; color: white; border: none; cursor: pointer; transition: background-color 0.3s; }
        button:hover { background-color: #0056b3; }
        #status { margin-top: 20px; color: #555; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Processamento de XML 📝</h2>
        <form id="uploadForm">
            <input type="file" id="xmlFile" name="xmlFile" accept=".xml" required>
            <button type="submit" id="gerarBtn" disabled>Gerar Tabela HTML</button>
        </form>
        <div id="status">Aguardando arquivo...</div>
    </div>

    <script>
        const fileInput = document.getElementById('xmlFile');
        const gerarBtn = document.getElementById('gerarBtn');
        const statusDiv = document.getElementById('status');
        const form = document.getElementById('uploadForm');

        fileInput.addEventListener('change', () => {
            gerarBtn.disabled = fileInput.files.length === 0;
            const text = 'Arquivo selecionado: ' + fileInput.files[0].name;
            statusDiv.textContent = fileInput.files.length > 0 ? text : 'Aguardando arquivo...';
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            if (!fileInput.files.length) return;

            statusDiv.textContent = 'Lendo e processando (via HTTP POST)...';
            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = async (e) => {
                const xmlContent = e.target.result;
                
                try {
                    // Envia o conteúdo XML para a rota de API do servidor
                    const response = await fetch('/process', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ xmlContent: xmlContent })
                    });

                    // 🚨 Trata erro HTTP 
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || "Erro do servidor: " + response.status);
                    }

                    // Recebe o objeto {tabela: string, numNfe: string}
                    const htmlContent = await response.json(); 
                    
                    statusDiv.textContent = 'Processamento concluído. Iniciando download...';
                    
                    // Lógica de Download
                    const blob = new Blob([htmlContent.tabela], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = htmlContent.numNfe + '.html'; // Usa o numNfe para o nome do arquivo
                    
                    document.body.appendChild(a);
                    a.click(); 
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    statusDiv.textContent = 'Download concluído! 🎉';

                } catch (error) {
                    statusDiv.textContent = 'Erro no Processamento: ' + error.message;
                    console.error("Erro completo:", error);
                }
            };

            reader.readAsText(file); // Inicia a leitura do arquivo
        });
    </script>
</body>
</html>
`;
// --- FIM DO CONTEÚDO HTML/JS ---


async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // 1. Servir o Frontend SPA
    if (url.pathname === "/") {
        return new Response(FRONTEND_HTML, { headers: { "Content-Type": "text/html" } });
    }

    // 2. Rota de Processamento da API
    if (req.method === "POST" && url.pathname === "/process") {
        try {
            const body = await req.json();
            const xmlContent = body.xmlContent;
            
            if (!xmlContent) {
                 return new Response(JSON.stringify({ error: "Conteúdo XML não fornecido." }), {
                    status: 400, headers: { "Content-Type": "application/json" }
                });
            }

            // 🚨 EXECUTA SUA FUNÇÃO ORIGINAL
            const resultado = await processarXMLInterno(xmlContent);

            // Retorna o objeto {tabela, numNfe} em JSON
            return new Response(JSON.stringify(resultado), {
                status: 200, headers: { "Content-Type": "application/json" }
            });

        } catch (error) {
            console.error("Erro no processamento:", error);
            return new Response(JSON.stringify({ error: `Falha no processamento interno: ${error}` }), {
                status: 500, headers: { "Content-Type": "application/json" }
            });
        }
    }

    // 3. Rota 404
    return new Response("Não Encontrado", { status: 404 });
}

Deno.serve({ port: PORT }, handler);
console.log(`Servidor HTTP rodando em ${APP_URL}`); 
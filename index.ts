// main.ts
import { Webview } from "webview";

const APP_URL = "http://localhost:8000/"; // Deve corresponder à porta do servidor

// 5. Inicialização da Webview
const webview = new Webview(true); // Ativando DEBUG

webview.title = "Deno Desktop App (HTTP)"; 

// A Webview navega para a URL do servidor local!
webview.navigate(APP_URL); 

webview.run(); 

// Nota: Para fechar o programa completamente, você deve parar o processo do servidor
// (server.ts) separadamente, ou configurar um mecanismo de encerramento.
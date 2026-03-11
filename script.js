// Configurações
const MODEL_ID = "cognitivecomputations/dolphin-3.0-llama-3.1-8b";

// Elementos do DOM
const sidebar = document.getElementById('sidebar');
const chatMessages = document.getElementById('chat-messages');
const welcomeMessage = document.getElementById('welcome-message');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const apiKeyInput = document.getElementById('api-key');
const systemPromptInput = document.getElementById('system-prompt');
const suggestButtons = document.querySelectorAll('.suggest-btn');

// Histórico de conversa
let conversationHistory = [];

// Carregar configurações salvas ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    const savedKey = localStorage.getItem('openrouter_api_key');
    const savedSystem = localStorage.getItem('ai_system_prompt');
    
    if (savedKey) apiKeyInput.value = savedKey;
    if (savedSystem) systemPromptInput.value = savedSystem;
});

// Salvar configurações quando alteradas
apiKeyInput.addEventListener('input', () => localStorage.setItem('openrouter_api_key', apiKeyInput.value.trim()));
systemPromptInput.addEventListener('input', () => localStorage.setItem('ai_system_prompt', systemPromptInput.value.trim()));

// Função para abrir/fechar a Sidebar
function toggleSidebar() {
    sidebar.classList.toggle('active');
    
    // Cria ou remove overlay
    if (sidebar.classList.contains('active')) {
        const overlay = document.createElement('div');
        overlay.classList.add('overlay');
        overlay.id = 'overlay';
        overlay.onclick = toggleSidebar;
        document.body.appendChild(overlay);
        overlay.classList.add('active');
    } else {
        document.getElementById('overlay').remove();
    }
}

// Função para adicionar bolhas de chat
function addMessage(text, type, icon = 'fas fa-brain') {
    // Esconde a mensagem de boas-vindas se houver uma mensagem
    welcomeMessage.style.display = 'none';
    chatMessages.style.display = 'flex';

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${type}-message`);

    if (type === 'ai') {
        messageDiv.innerHTML = `
            <i class="${icon} avatar"></i>
            <div class="message-content">
                <p>${text.replace(/\n/g, '<br>')}</p>
            </div>
        `;
    } else if (type === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${text.replace(/\n/g, '<br>')}</p>
            </div>
        `;
    } else {
        // Mensagem de sistema
        messageDiv.classList.remove('message');
        messageDiv.classList.add('system-message');
        messageDiv.innerText = text;
    }

    chatMessages.appendChild(messageDiv);
    // Scroll automático para baixo
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Função de envio de mensagem
async function sendMessage() {
    const text = userInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const systemPrompt = systemPromptInput.value.trim();

    if (!text) return;

    if (!apiKey) {
        // Abre as configurações se não tiver API Key
        toggleSidebar();
        alert("Por favor, cole sua OpenRouter API Key nas configurações.");
        return;
    }

    // Adiciona mensagem do usuário
    addMessage(text, 'user');
    conversationHistory.push({ role: "user", content: text });
    userInput.value = '';
    userInput.style.height = 'auto'; // Reseta altura do textarea
    sendBtn.disabled = true;

    // Adiciona bolha de "pensando"
    const thinkingMessage = document.createElement('div');
    thinkingMessage.classList.add('system-message');
    thinkingMessage.id = 'thinking';
    thinkingMessage.innerText = "...";
    chatMessages.appendChild(thinkingMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Corpo da requisição para a API
    const messagesBody = [
        { role: "system", content: systemPrompt },
        ...conversationHistory
    ];

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": MODEL_ID,
                "messages": messagesBody,
                "temperature": 0.7
            })
        });

        const data = await response.json();
        
        // Remove mensagem de pensando
        document.getElementById('thinking').remove();

        if (data.choices && data.choices[0]) {
            const aiResponse = data.choices[0].message.content;
            addMessage(aiResponse, 'ai');
            conversationHistory.push({ role: "assistant", content: aiResponse });
        } else if (data.error) {
            addMessage(`Erro da API: ${data.error.message}`, 'system');
            console.error(data.error);
        } else {
            addMessage("Erro desconhecido na resposta.", 'system');
        }

    } catch (error) {
        document.getElementById('thinking').remove();
        addMessage(`Erro de Conexão: ${error.message}`, 'system');
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Botões de Sugestão Rápida (idênticos ao print)
suggestButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const promptText = btn.getAttribute('data-prompt');
        userInput.value = promptText;
        userInput.focus();
        // sendMessage(); // Descomente esta linha se quiser enviar o prompt direto
    });
});

// Eventos
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    // Envia com Enter, mas permite Shift+Enter para quebra de linha
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-ajuste da altura do textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});


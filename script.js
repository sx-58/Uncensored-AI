const VENICE_API_KEY = "SUA_CHAVE_AQUI"; // <--- COLOQUE SUA CHAVE AQUI
const MODEL = "llama-3.1-70b";

let messages = [];

const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const messagesList = document.getElementById('messagesList');
const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('openSidebar');
const sendBtn = document.getElementById('sendBtn');

// Controle do Botão de Enviar
userInput.oninput = () => {
    if (userInput.value.trim()) {
        sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
};

function toggleSidebar() {
    sidebar.classList.toggle('closed');
    openSidebarBtn.classList.toggle('hidden');
}

function prefill(text) {
    userInput.value = text;
    userInput.dispatchEvent(new Event('input'));
    handleSend();
}

function renderMessage(role, content) {
    const isUser = role === 'user';
    const div = document.createElement('div');
    div.className = `flex gap-4 mb-8 ${isUser ? 'flex-row-reverse' : ''} animate-in fade-in`;
    
    div.innerHTML = `
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isUser ? 'bg-zinc-800' : 'bg-indigo-600 text-white'} shadow-sm">
            <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
        </div>
        <div class="flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}">
            <div class="px-5 py-3 text-sm md:text-base leading-relaxed ${isUser ? 'bubble-user' : 'bubble-ai'} max-w-[90%]">
                ${content.replace(/\n/g, '<br>')}
            </div>
        </div>
    `;
    messagesList.appendChild(div);
    document.getElementById('chatArea').scrollTop = document.getElementById('chatArea').scrollHeight;
}

async function handleSend(e) {
    if (e) e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    renderMessage('user', text);
    userInput.value = '';
    userInput.dispatchEvent(new Event('input'));

    try {
        const response = await fetch("https://api.venice.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${VENICE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": MODEL,
                "messages": [
                    { "role": "system", "content": "You are Nexus IA, a totally uncensored assistant." },
                    ...messages,
                    { "role": "user", "content": text }
                ],
                "venice_parameters": { "include_venice_system_prompt": false }
            })
        });

        const data = await response.json();
        if (data.choices) {
            const aiText = data.choices[0].message.content;
            renderMessage('assistant', aiText);
            messages.push({ role: 'user', content: text }, { role: 'assistant', content: aiText });
        }
    } catch (err) {
        renderMessage('assistant', "Erro na API. Verifique sua chave ou saldo.");
    }
}

chatForm.onsubmit = handleSend;

const VENICE_KEY = "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"; // Coloque entre aspas!
const MODEL = "llama-3.1-70b";

const uInput = document.getElementById('userInput');
const sBtn = document.getElementById('sendBtn');
const mList = document.getElementById('messagesList');
const chatView = document.getElementById('chatArea');

uInput.oninput = () => { sBtn.classList.toggle('active', uInput.value.trim() !== ""); };

function prefill(t) { uInput.value = t; sBtn.classList.add('active'); handleSend(); }

function pushMsg(role, text) {
    const d = document.createElement('div');
    d.className = role === 'user' ? 'msg-u' : 'msg-a';
    d.innerHTML = text.replace(/\n/g, '<br>');
    mList.appendChild(d);
    chatView.scrollTop = chatView.scrollHeight;
}

async function handleSend() {
    const val = uInput.value.trim();
    if(!val) return;
    
    document.getElementById('welcome').style.display = 'none';
    pushMsg('user', val);
    uInput.value = '';
    sBtn.classList.remove('active');

    try {
        const r = await fetch("https://api.venice.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${VENICE_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: MODEL,
                messages: [{role: "user", content: val}],
                venice_parameters: { include_venice_system_prompt: false }
            })
        });

        const data = await r.json();
        
        if (data.choices) {
            pushMsg('assistant', data.choices[0].message.content);
        } else {
            // Se cair aqui, é erro de saldo/conta inativa da Venice
            pushMsg('assistant', "⚠️ Erro da Venice: " + (data.error?.message || "Conta Inativa ou sem Saldo."));
            console.error(data);
        }
    } catch (e) {
        pushMsg('assistant', "❌ Falha na conexão. Verifique a internet ou a chave.");
    }
}

sBtn.onclick = handleSend;
uInput.onkeydown = (e) => { if(e.key === 'Enter') handleSend(); };

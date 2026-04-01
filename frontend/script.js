document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const apiModal = document.getElementById('api-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const modalError = document.getElementById('modal-error');
    
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const logoutBtn = document.getElementById('logout-btn');

    let apiKey = '';
    let messageHistory = [];

    // Initialize Check
    const storedKey = sessionStorage.getItem('deepseekApiKey');
    if (storedKey) {
        apiKey = storedKey;
        showChat();
    }

    // Modal Events
    saveKeyBtn.addEventListener('click', handleLogin);
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    function handleLogin() {
        const key = apiKeyInput.value.trim();
        if (!key) {
            modalError.classList.remove('hidden');
            return;
        }
        modalError.classList.add('hidden');
        apiKey = key;
        sessionStorage.setItem('deepseekApiKey', key);
        showChat();
    }

    function showChat() {
        apiModal.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        messageInput.focus();
    }

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('deepseekApiKey');
        apiKey = '';
        apiKeyInput.value = '';
        chatContainer.classList.add('hidden');
        apiModal.classList.remove('hidden');
        
        // Reset chat completely
        chatMessages.innerHTML = `
            <div class="message bot">
                <div class="message-content">
                    ¡Sesión reiniciada! ¿En qué puedo ayudarte hoy?
                </div>
            </div>
        `;
        messageHistory = [];
    });

    // Chat Logic
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // Add User Message to UI
        addMessageToUI('user', text);
        messageInput.value = '';
        messageInput.focus();

        // Check Api Key
        if (!apiKey) {
            addMessageToUI('bot', 'Error: No se encontró la API Key.');
            return;
        }

        // Add Loading Indicator
        const loadingId = 'loading-' + Date.now();
        addLoadingIndicator(loadingId);

        try {
            // URL base, cámbiala por la de tu backend en Render cuando esté listo
            const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === ''
                ? 'http://localhost:3000'
                : 'https://AQUI-IRA-TU-URL-DE-RENDER.onrender.com'; // TODO: Actualizar cuando Render te dé la URL

            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    apiKey: apiKey,
                    history: messageHistory
                })
            });

            removeLoadingIndicator(loadingId);

            const data = await response.json();

            if (!response.ok) {
                // Return an error to the user interface
                addMessageToUI('bot', `Error: ${data.error || 'Ocurrió un error inesperado'}`);
                return;
            }

            // Push to history
            messageHistory.push({ role: 'user', content: text });
            messageHistory.push({ role: 'assistant', content: data.reply });
            
            // Keep history limited to last 10 messages to avoid sending too much context
            if (messageHistory.length > 20) {
                messageHistory = messageHistory.slice(messageHistory.length - 20);
            }

            addMessageToUI('bot', data.reply);

        } catch (error) {
            removeLoadingIndicator(loadingId);
            console.error(error);
            addMessageToUI('bot', 'Error: No se pudo conectar con el servidor.');
        }
    }

    function addMessageToUI(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        
        // Formateo muy básico (cambiar saltos de línea por <br>)
        contentDiv.innerHTML = text.replace(/\n/g, '<br>');
        
        msgDiv.appendChild(contentDiv);
        chatMessages.appendChild(msgDiv);
        
        scrollToBottom();
    }

    function addLoadingIndicator(id) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'bot');
        msgDiv.id = id;
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        contentDiv.appendChild(typingIndicator);
        msgDiv.appendChild(contentDiv);
        chatMessages.appendChild(msgDiv);
        
        scrollToBottom();
    }

    function removeLoadingIndicator(id) {
        const elem = document.getElementById(id);
        if (elem) elem.remove();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

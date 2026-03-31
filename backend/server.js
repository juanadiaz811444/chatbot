const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    const { message, apiKey, history = [] } = req.body;

    if (!message || !apiKey) {
        return res.status(400).json({ error: 'Mensaje y API Key son requeridos.' });
    }

    try {
        // Preparar los mensajes: historia anterior + nuevo mensaje del usuario
        const messages = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        messages.push({ role: 'user', content: message });

        // Petición a la DeepSeek API
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("DeepSeek API Error:", data);
            return res.status(response.status).json({ 
                error: data.error?.message || 'Error al comunicarse con DeepSeek'
            });
        }

        const botReply = data.choices[0].message.content;
        res.json({ reply: botReply });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: 'Error del servidor al procesar la solicitud.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

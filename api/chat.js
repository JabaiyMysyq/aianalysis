export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { messages } = req.body;

        const groqMessages = [
            {
                role: 'system',
                content: 'Ты — опытный консультант по качеству данных. Отвечай ТОЛЬКО на русском языке. Специализируешься на: очистке данных, дедупликации, валидации, метриках качества (полнота, точность, согласованность), Data Governance, ETL. Отвечай кратко и структурировано — не более 5 пунктов.'
            },
            ...messages
        ];

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: groqMessages,
                max_tokens: 1000
            })
        });

        const data = await groqRes.json();

        if (!groqRes.ok) {
            return res.status(500).json({ content: [{ type: 'text', text: 'Ошибка: ' + (data.error?.message || JSON.stringify(data)) }] });
        }

        const text = data.choices?.[0]?.message?.content || 'Не удалось получить ответ.';
        res.status(200).json({ content: [{ type: 'text', text }] });

    } catch (err) {
        res.status(500).json({ content: [{ type: 'text', text: 'Ошибка сервера: ' + err.message }] });
    }
}

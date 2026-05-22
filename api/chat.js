export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { messages } = req.body;

        const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=...`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: 'Ты — опытный консультант по качеству данных. Отвечай ТОЛЬКО на русском языке. Специализируешься на: очистке данных, дедупликации, валидации, метриках качества (полнота, точность, согласованность), Data Governance, ETL. Отвечай кратко и структурировано — не более 5 пунктов.' }]
                    },
                    contents
                })
            }
        );

        const data = await geminiRes.json();
        
        if (!geminiRes.ok) {
            return res.status(500).json({ content: [{ type: 'text', text: 'Ошибка Gemini API: ' + JSON.stringify(data) }] });
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Не удалось получить ответ.';
        res.status(200).json({ content: [{ type: 'text', text }] });

    } catch (err) {
        res.status(500).json({ content: [{ type: 'text', text: 'Ошибка сервера: ' + err.message }] });
    }
}

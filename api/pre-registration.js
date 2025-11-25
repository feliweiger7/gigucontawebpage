const https = require('https');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const TARGET_URL = 'https://api.giguconta.app/gigu/pre-registration';
        const AUTH_USERNAME = process.env.API_USERNAME || '5c207662-4dce-4700-b002-0a75459b6c37';
        const AUTH_PASSWORD = process.env.API_PASSWORD || '2d9e07ac-57cf-4643-a20c-969f428656e5';

        const auth = Buffer.from(`${AUTH_USERNAME}:${AUTH_PASSWORD}`).toString('base64');
        const body = JSON.stringify(req.body);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
                'Content-Length': body.length
            }
        };

        const proxyReq = https.request(TARGET_URL, options, (proxyRes) => {
            let data = '';

            proxyRes.on('data', chunk => {
                data += chunk;
            });

            proxyRes.on('end', () => {
                res.status(proxyRes.statusCode).json(JSON.parse(data || '{}'));
            });
        });

        proxyReq.on('error', (error) => {
            console.error('Erro no proxy:', error);
            res.status(500).json({ error: error.message });
        });

        proxyReq.write(body);
        proxyReq.end();

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: error.message });
    }
};

const http = require('http');
const https = require('https');

const PORT = 3001;
const TARGET_URL = 'https://api.giguconta.app/gigu/pre-registration';
const AUTH_USERNAME = '5c207662-4dce-4700-b002-0a75459b6c37';
const AUTH_PASSWORD = '2d9e07ac-57cf-4643-a20c-969f428656e5';

const server = http.createServer((req, res) => {
    // Adiciona headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/pre-registration') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const auth = Buffer.from(`${AUTH_USERNAME}:${AUTH_PASSWORD}`).toString('base64');

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`,
                    'Content-Length': body.length
                }
            };

            const proxyReq = https.request(TARGET_URL, options, (proxyRes) => {
                res.writeHead(proxyRes.statusCode, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });

                proxyRes.pipe(res);
            });

            proxyReq.on('error', (error) => {
                console.error('Erro no proxy:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            });

            proxyReq.write(body);
            proxyReq.end();
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`Proxy server rodando em http://localhost:${PORT}`);
    console.log(`Use endpoint: http://localhost:${PORT}/api/pre-registration`);
});

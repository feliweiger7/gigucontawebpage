# Cadastro de Telefone - Gigu Conta

Sistema de cadastro de telefones para pre-registro na plataforma Gigu Conta.

## Funcionalidades

- Validacao de telefone brasileiro
- Mascara automatica de entrada
- Envio para API Gigu
- Design responsivo

## Deploy

Este projeto esta configurado para deploy no Vercel com um proxy server para contornar restricoes de CORS.

## Configuracao

Crie um arquivo `config.js` com suas credenciais:

```javascript
const CONFIG = {
    API_ENDPOINT: 'http://localhost:3001/api/pre-registration',
    AUTH_USERNAME: 'seu-username',
    AUTH_PASSWORD: 'seu-password'
};
```

## Desenvolvimento Local

1. Inicie o proxy: `node proxy-server.js`
2. Inicie o servidor web: `npx http-server -p 8000`
3. Acesse: `http://localhost:8000`

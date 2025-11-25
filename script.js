// Usa configurações do config.js
const AUTH_HEADER = 'Basic ' + btoa(CONFIG.AUTH_USERNAME + ':' + CONFIG.AUTH_PASSWORD);

// Elementos do DOM
const phoneForm = document.getElementById('phoneForm');
const phoneInput = document.getElementById('phone');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');

// Formata o número de telefone enquanto digita
phoneInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito

    if (value.length > 11) {
        value = value.slice(0, 11);
    }

    // Formata: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (value.length > 0) {
        if (value.length <= 2) {
            value = `(${value}`;
        } else if (value.length <= 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (value.length <= 10) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
        } else {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        }
    }

    e.target.value = value;
});

// Valida número de telefone brasileiro
function validateBrazilianPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');

    // Deve ter 10 ou 11 dígitos (com DDD)
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        return { valid: false, message: 'O número deve ter 10 ou 11 dígitos (DDD + número)' };
    }

    // Valida DDD (11-99)
    const ddd = parseInt(cleanPhone.slice(0, 2));
    if (ddd < 11 || ddd > 99) {
        return { valid: false, message: 'DDD inválido' };
    }

    // Se tem 11 dígitos, o 9º dígito deve ser 9 (celular)
    if (cleanPhone.length === 11 && cleanPhone[2] !== '9') {
        return { valid: false, message: 'Celular deve começar com 9' };
    }

    return { valid: true, cleanPhone };
}

// Mostra mensagem na tela
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
}

// Limpa mensagem
function clearMessage() {
    messageDiv.textContent = '';
    messageDiv.className = 'message';
}

// Envia o formulário
phoneForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearMessage();

    const phoneValue = phoneInput.value;
    const validation = validateBrazilianPhone(phoneValue);

    if (!validation.valid) {
        showMessage(validation.message, 'error');
        return;
    }

    // Prepara os dados para envio no formato da API Gigu
    const payload = {
        cpfs: [],
        phones: [validation.cleanPhone]
    };

    // Desabilita o botão durante o envio
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    showMessage('Enviando dados...', 'loading');

    try {
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTH_HEADER
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        showMessage('Telefone cadastrado com sucesso!', 'success');
        phoneInput.value = '';

        console.log('Resposta do servidor:', data);

    } catch (error) {
        console.error('Erro ao enviar:', error);
        showMessage(`Erro ao enviar: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar';
    }
});

// Log do payload para debug (remova em produção)
console.log('Webpage de cadastro de telefone carregada');
console.log('Endpoint configurado:', CONFIG.API_ENDPOINT);

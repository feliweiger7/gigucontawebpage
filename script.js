// Elementos do DOM - Telefone único
const phoneForm = document.getElementById('phoneForm');
const phoneInput = document.getElementById('phone');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');

// Elementos do DOM - CSV
const csvForm = document.getElementById('csvForm');
const csvFileInput = document.getElementById('csvFile');
const csvSubmitBtn = document.getElementById('csvSubmitBtn');
const csvPreview = document.getElementById('csvPreview');
const fileNameSpan = document.getElementById('fileName');
const progressContainer = document.getElementById('csvProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Elementos do DOM - Tabs
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Armazena os telefones válidos do CSV
let validPhones = [];

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
                'Content-Type': 'application/json'
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

// =====================
// FUNCIONALIDADE DE TABS
// =====================
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active de todas as tabs
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        // Adiciona active na tab clicada
        tab.classList.add('active');
        const tabId = tab.dataset.tab + 'Tab';
        document.getElementById(tabId).classList.add('active');

        // Limpa mensagens ao trocar de tab
        clearMessage();
    });
});

// =====================
// FUNCIONALIDADE DE CSV
// =====================

// Quando seleciona um arquivo
csvFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    fileNameSpan.textContent = file.name;

    const reader = new FileReader();
    reader.onload = function(event) {
        const content = event.target.result;
        processCSV(content);
    };
    reader.readAsText(file);
});

// Limite de preview para não travar o navegador
const PREVIEW_LIMIT = 100;

// Processa o conteúdo do CSV
function processCSV(content) {
    // Divide por linhas e remove linhas vazias
    const lines = content.split(/[\r\n]+/).filter(line => line.trim());

    validPhones = [];
    let invalidCount = 0;
    let previewItems = [];

    lines.forEach((line, index) => {
        // Remove aspas, espaços e caracteres especiais
        let phone = line.trim().replace(/['"]/g, '');

        // Pula cabeçalhos comuns
        if (index === 0 && /^(telefone|phone|celular|numero|number)/i.test(phone)) {
            return;
        }

        // Remove apenas os dígitos
        const cleanPhone = phone.replace(/\D/g, '');

        // Valida o telefone
        const validation = validateBrazilianPhone(cleanPhone);

        if (validation.valid) {
            validPhones.push(validation.cleanPhone);
            // Só adiciona ao preview se ainda não atingiu o limite
            if (previewItems.length < PREVIEW_LIMIT) {
                previewItems.push(`<div class="csv-preview-item valid">✓ ${formatPhoneDisplay(validation.cleanPhone)}</div>`);
            }
        } else {
            invalidCount++;
            // Só adiciona ao preview se ainda não atingiu o limite
            if (previewItems.length < PREVIEW_LIMIT) {
                previewItems.push(`<div class="csv-preview-item invalid">✗ ${phone} (${validation.message})</div>`);
            }
        }
    });

    // Monta o HTML do preview
    let previewHTML = `<div class="csv-preview-header">`;
    previewHTML += `${validPhones.length.toLocaleString()} válidos`;
    if (invalidCount > 0) {
        previewHTML += ` | ${invalidCount.toLocaleString()} inválidos`;
    }
    previewHTML += `</div><div class="csv-preview-list">`;
    previewHTML += previewItems.join('');

    // Indica se há mais números além do preview
    const totalProcessed = validPhones.length + invalidCount;
    if (totalProcessed > PREVIEW_LIMIT) {
        previewHTML += `<div class="csv-preview-item" style="color: #666; font-style: italic;">... e mais ${(totalProcessed - PREVIEW_LIMIT).toLocaleString()} números</div>`;
    }

    previewHTML += '</div>';

    // Mostra preview
    csvPreview.innerHTML = previewHTML;
    csvPreview.classList.add('active');

    // Atualiza botão
    if (validPhones.length > 0) {
        csvSubmitBtn.textContent = `Enviar ${validPhones.length.toLocaleString()} telefone(s)`;
        csvSubmitBtn.disabled = false;
    } else {
        csvSubmitBtn.textContent = 'Nenhum telefone válido';
        csvSubmitBtn.disabled = true;
    }
}

// Formata telefone para exibição
function formatPhoneDisplay(phone) {
    if (phone.length === 11) {
        return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    } else if (phone.length === 10) {
        return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
    }
    return phone;
}

// Configuração de lotes
const BATCH_SIZE = 100; // Números por lote

// Divide array em lotes
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// Envia um lote de telefones
async function sendBatch(phones) {
    const payload = {
        cpfs: [],
        phones: phones
    };

    const response = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }

    return await response.json();
}

// Armazena telefones que falharam
let failedPhones = [];

// Envia o CSV em lotes
csvForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearMessage();

    if (validPhones.length === 0) {
        showMessage('Nenhum telefone válido para enviar', 'error');
        return;
    }

    // Desabilita o botão
    csvSubmitBtn.disabled = true;
    csvSubmitBtn.textContent = 'Enviando...';

    // Mostra barra de progresso
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = `0/${validPhones.length.toLocaleString()}`;

    let successCount = 0;
    let processedCount = 0;
    failedPhones = [];

    // Divide em lotes
    const batches = chunkArray(validPhones, BATCH_SIZE);
    const totalBatches = batches.length;

    showMessage(`Enviando ${validPhones.length.toLocaleString()} telefones em ${totalBatches.toLocaleString()} lote(s)...`, 'loading');

    // Processa cada lote
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        try {
            await sendBatch(batch);
            successCount += batch.length;
        } catch (error) {
            console.error(`Erro no lote ${i + 1}:`, error);
            // Adiciona os telefones que falharam à lista
            failedPhones.push(...batch.map(phone => ({
                phone: phone,
                batch: i + 1,
                error: error.message
            })));
        }

        // Atualiza progresso
        processedCount += batch.length;
        const percent = Math.round((processedCount / validPhones.length) * 100);
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${processedCount.toLocaleString()}/${validPhones.length.toLocaleString()} (Lote ${i + 1}/${totalBatches})`;

        // Pequena pausa entre lotes para não sobrecarregar a API
        if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    // Mostra resultado final
    const errorCount = failedPhones.length;

    if (errorCount === 0) {
        showMessage(`${successCount.toLocaleString()} telefone(s) cadastrado(s) com sucesso!`, 'success');
        // Limpa o formulário após 3 segundos se sucesso total
        setTimeout(() => {
            resetCsvForm();
        }, 3000);
    } else if (successCount === 0) {
        showMessage(`Erro ao enviar todos os telefones. Clique em "Baixar Falhas" para ver detalhes.`, 'error');
        showDownloadButton();
    } else {
        showMessage(`${successCount.toLocaleString()} sucesso(s), ${errorCount.toLocaleString()} falha(s). Clique em "Baixar Falhas" para ver detalhes.`, 'error');
        showDownloadButton();
    }

    // Restaura botão
    csvSubmitBtn.disabled = false;
    csvSubmitBtn.textContent = 'Enviar Todos';
});

// Reseta o formulário CSV
function resetCsvForm() {
    csvFileInput.value = '';
    fileNameSpan.textContent = '';
    csvPreview.classList.remove('active');
    csvPreview.innerHTML = '';
    progressContainer.style.display = 'none';
    validPhones = [];
    failedPhones = [];
    csvSubmitBtn.textContent = 'Enviar Todos';
    hideDownloadButton();
}

// Mostra botão de download das falhas
function showDownloadButton() {
    let downloadBtn = document.getElementById('downloadFailedBtn');

    if (!downloadBtn) {
        downloadBtn = document.createElement('button');
        downloadBtn.id = 'downloadFailedBtn';
        downloadBtn.type = 'button';
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = `Baixar Falhas (${failedPhones.length.toLocaleString()})`;
        downloadBtn.onclick = downloadFailedPhones;
        progressContainer.parentNode.insertBefore(downloadBtn, progressContainer.nextSibling);
    } else {
        downloadBtn.textContent = `Baixar Falhas (${failedPhones.length.toLocaleString()})`;
        downloadBtn.style.display = 'block';
    }
}

// Esconde botão de download
function hideDownloadButton() {
    const downloadBtn = document.getElementById('downloadFailedBtn');
    if (downloadBtn) {
        downloadBtn.style.display = 'none';
    }
}

// Baixa JSON com telefones que falharam
function downloadFailedPhones() {
    const report = {
        timestamp: new Date().toISOString(),
        totalAttempted: validPhones.length,
        totalFailed: failedPhones.length,
        totalSuccess: validPhones.length - failedPhones.length,
        failedPhones: failedPhones
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telefones-falha-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Log do payload para debug (remova em produção)
console.log('Webpage de cadastro de telefone carregada');
console.log('Endpoint configurado:', CONFIG.API_ENDPOINT);

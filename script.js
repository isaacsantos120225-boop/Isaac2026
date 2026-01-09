import confetti from 'canvas-confetti';

// State & Constants
const ADMIN_PASS = "220915";
const WA_PHONE = "552193152764";

let audioContext;
let bgMusic;
let clickSound;
let confirmSound;
let isMuted = false;

const state = {
    confirmed: JSON.parse(localStorage.getItem('isaac_confirmed') || '[]'),
    declined: JSON.parse(localStorage.getItem('isaac_declined') || '[]'),
};

// --- DOM Elements ---
const introScreen = document.getElementById('intro-screen');
const mainContent = document.getElementById('main-content');
const startBtn = document.getElementById('start-btn');
const muteBtn = document.getElementById('mute-btn');
const adminTrigger = document.getElementById('admin-trigger');

const modalGifts = document.getElementById('modal-gifts');
const modalConfirm = document.getElementById('modal-confirm');
const modalDecline = document.getElementById('modal-decline');
const adminPanel = document.getElementById('admin-panel');
const successFeedback = document.getElementById('success-feedback');

const formConfirm = document.getElementById('form-confirm');
const confirmQtyInput = document.getElementById('confirm-qty');
const guestDetailsContainer = document.getElementById('guest-details-container');

// --- Audio Logic ---
async function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const loadSound = async (url) => {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
    };

    bgMusic = await loadSound('rei-leao.mp3');
    clickSound = await loadSound('click.mp3');
    confirmSound = await loadSound('confirm.mp3');

    playBgMusic();
}

let bgMusicSource;
function playBgMusic() {
    if (bgMusicSource) bgMusicSource.stop();
    bgMusicSource = audioContext.createBufferSource();
    bgMusicSource.buffer = bgMusic;
    bgMusicSource.loop = true;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.value = isMuted ? 0 : 0.4;
    
    bgMusicSource.connect(gainNode);
    gainNode.connect(audioContext.destination);
    bgMusicSource.start(0);
}

function playSFX(buffer) {
    if (isMuted || !buffer) return;
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

// --- Interaction Logic ---

// Start Experience
startBtn.addEventListener('click', async () => {
    introScreen.classList.add('hidden');
    mainContent.classList.remove('hidden');
    await initAudio();
});

// Mute Toggle
muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
    if (bgMusicSource) {
        // Simple way to "mute" is to stop/restart or use gain node
        // For simplicity here, we restart/stop for this context
        if (isMuted) {
            audioContext.suspend();
        } else {
            audioContext.resume();
        }
    }
});

// Navigation & Modals
document.getElementById('btn-map').addEventListener('click', () => {
    playSFX(clickSound);
    window.open('https://www.google.com/maps/search/?api=1&query=R.+Gonçalves+Gato,+29+-+Centro,+Belford+Roxo+-+RJ,+26130-230', '_blank');
});

document.getElementById('btn-gifts').addEventListener('click', () => {
    playSFX(clickSound);
    modalGifts.classList.remove('hidden');
});

document.getElementById('btn-confirm').addEventListener('click', () => {
    playSFX(clickSound);
    modalConfirm.classList.remove('hidden');
});

document.getElementById('btn-decline').addEventListener('click', () => {
    playSFX(clickSound);
    modalDecline.classList.remove('hidden');
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').classList.add('hidden');
    });
});

// Confirm Presence Form Logic
confirmQtyInput.addEventListener('input', () => {
    const qty = parseInt(confirmQtyInput.value) || 0;
    guestDetailsContainer.innerHTML = '';
    
    // Starting from 1 because the primary person is index 0
    for (let i = 0; i < qty; i++) {
        const div = document.createElement('div');
        div.className = 'guest-input-group';
        div.innerHTML = `
            <label>Convidado ${i + 1}</label>
            <input type="text" name="guest-name-${i}" placeholder="Nome Completo" required>
            <input type="number" name="guest-age-${i}" placeholder="Idade (opcional)">
        `;
        guestDetailsContainer.appendChild(div);
    }
});

formConfirm.addEventListener('submit', (e) => {
    e.preventDefault();
    const mainName = document.getElementById('confirm-name').value;
    const qty = parseInt(confirmQtyInput.value);
    const guests = [];

    for (let i = 0; i < qty; i++) {
        guests.push({
            name: formConfirm.querySelector(`[name="guest-name-${i}"]`).value,
            age: formConfirm.querySelector(`[name="guest-age-${i}"]`).value
        });
    }

    const entry = { id: Date.now(), mainName, qty, guests, date: new Date().toLocaleString() };
    state.confirmed.push(entry);
    saveState();
    
    playSFX(confirmSound);
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

    const feedbackText = `Que alegria receber a sua confirmação! 🥰<br><br>
    Estamos muito felizes em saber que você estará conosco nesse dia tão especial.<br>
    O Isaac (e todos nós) já estamos cheios de expectativa e carinho, contando os dias para celebrar ao lado de pessoas tão queridas.<br><br>
    Nos encontramos no dia 28 de Fevereiro de 2026 a partir das 19:00.<br><br>
    Sua presença tornará nossa festa ainda mais inesquecível!<br>
    Com muito carinho,<br> Isaac e família`;
    
    document.getElementById('feedback-text').innerHTML = feedbackText;
    modalConfirm.classList.add('hidden');
    successFeedback.classList.remove('hidden');

    // Send to WA
    let waMsg = `*Confirmação de Presença - Isaac 1 Ano*%0A%0A`;
    waMsg += `Nome: ${mainName}%0A`;
    waMsg += `Total de pessoas: ${qty}%0A%0A`;
    guests.forEach((g, idx) => {
        waMsg += `${idx+1}. ${g.name}${g.age ? ' ('+g.age+' anos)' : ''}%0A`;
    });
    
    window.open(`https://wa.me/${WA_PHONE}?text=${waMsg}`, '_blank');
});

// Decline Form Logic
document.getElementById('form-decline').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('decline-name').value;
    const entry = { id: Date.now(), name, date: new Date().toLocaleString() };
    state.declined.push(entry);
    saveState();

    playSFX(clickSound);
    modalDecline.classList.add('hidden');
    
    document.getElementById('feedback-text').innerHTML = `Poxa, que pena que não poderá vir! 🦁<br><br>Agradecemos o carinho e a lembrança. Isaac e família mandam um grande beijo!`;
    successFeedback.classList.remove('hidden');

    const waMsg = `*Aviso de Ausência - Isaac 1 Ano*%0A%0A${name} não poderá comparecer.`;
    window.open(`https://wa.me/${WA_PHONE}?text=${waMsg}`, '_blank');
});

// --- Admin Logic ---
adminTrigger.addEventListener('click', () => {
    adminPanel.classList.remove('hidden');
    document.getElementById('admin-login').classList.remove('hidden');
    document.getElementById('admin-content').classList.add('hidden');
    document.getElementById('admin-pass').value = '';
});

document.getElementById('btn-login').addEventListener('click', () => {
    const pass = document.getElementById('admin-pass').value;
    if (pass === ADMIN_PASS) {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        renderAdminLists();
        // User requested bg music plays in admin too (it's already playing but ensured)
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
    } else {
        alert('Senha incorreta!');
    }
});

function renderAdminLists() {
    const confTbody = document.querySelector('#table-confirmed tbody');
    const declTbody = document.querySelector('#table-declined tbody');
    
    confTbody.innerHTML = '';
    declTbody.innerHTML = '';

    let totalConfirmed = 0;
    state.confirmed.forEach(item => {
        totalConfirmed += item.qty;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.mainName}</td>
            <td>${item.qty}</td>
            <td>${item.guests.map(g => g.name).join(', ')}</td>
            <td><button class="btn-del" onclick="deleteEntry('confirmed', ${item.id})">Remover</button></td>
        `;
        confTbody.appendChild(row);
    });

    state.declined.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td><button class="btn-del" onclick="deleteEntry('declined', ${item.id})">Remover</button></td>
        `;
        declTbody.appendChild(row);
    });

    document.getElementById('count-confirmed').textContent = totalConfirmed;
    document.getElementById('count-declined').textContent = state.declined.length;
}

window.deleteEntry = (list, id) => {
    if (confirm('Deseja excluir este registro?')) {
        state[list] = state[list].filter(i => i.id !== id);
        saveState();
        renderAdminLists();
    }
};

function saveState() {
    localStorage.setItem('isaac_confirmed', JSON.stringify(state.confirmed));
    localStorage.setItem('isaac_declined', JSON.stringify(state.declined));
}

// Admin Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

document.getElementById('btn-print').addEventListener('click', () => {
    window.print();
});

document.getElementById('btn-export-wa').addEventListener('click', () => {
    let msg = `*RELATÓRIO DE CONVIDADOS - ISAAC 1 ANO*%0A%0A`;
    msg += `*CONFIRMADOS (${document.getElementById('count-confirmed').textContent}):*%0A`;
    state.confirmed.forEach(item => {
        msg += `- ${item.mainName} (${item.qty} pers.): ${item.guests.map(g => g.name).join(', ')}%0A`;
    });
    msg += `%0A*AUSENTES:*%0A`;
    state.declined.forEach(item => {
        msg += `- ${item.name}%0A`;
    });
    
    window.open(`https://wa.me/${WA_PHONE}?text=${msg}`, '_blank');
});
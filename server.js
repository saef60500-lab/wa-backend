const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(express.json());

// كائن لتخزين الجلسات المختلفة
const sessions = {}; 

const chromiumPath = puppeteer.executablePath();

// دالة لإنشاء عميل جديد بناءً على الـ ID
function createSession(clientId) {
    if (sessions[clientId]) return sessions[clientId];

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: clientId, // هذا السطر هو السر! يجعل لكل مستخدم مجلد خاص
            dataPath: './.wwebjs_auth'
        }),
        puppeteer: {
            executablePath: chromiumPath,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    sessions[clientId] = { client, qr: null, ready: false };

    client.on('qr', (qr) => {
        sessions[clientId].qr = qr;
        console.log(`QR for ${clientId} received`);
    });

    client.on('ready', () => {
        sessions[clientId].ready = true;
        sessions[clientId].qr = null;
        console.log(`Client ${clientId} is ready`);
    });

    client.on('disconnected', () => {
        sessions[clientId].ready = false;
        delete sessions[clientId]; // مسح الجلسة عند الخروج
    });

    client.initialize();
    return sessions[clientId];
}

// تعديل الـ Endpoints لاستقبال الـ id
app.get('/status', (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    
    const session = sessions[id] || createSession(id);
    res.json({
        ready: session.ready,
        hasQR: session.qr !== null
    });
});

app.get('/qr', (req, res) => {
    const { id } = req.query;
    if (!id) return res.send('ID missing');
    
    const session = sessions[id];
    if (session && session.qr) {
        const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(session.qr);
        res.send(`<html><body><img src="${qrUrl}"/></body></html>`);
    } else {
        res.send('QR not ready or already connected');
    }
});

app.post('/send-message', async (req, res) => {
    const { id, phone, message } = req.body; // ننتظر id من الواجهة
    const session = sessions[id];

    if (!session || !session.ready) {
        return res.json({ success: false, error: 'Session not ready' });
    }

    try {
        const chatId = phone.replace(/[^0-9]/g, '') + '@c.us';
        await session.client.sendMessage(chatId, message);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Server running on port ' + PORT));

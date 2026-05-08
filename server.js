const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

let currentQR = null;
let isClientReady = false;

// الحصول على مسار Chromium من puppeteer تلقائياً
const chromiumPath = puppeteer.executablePath();
console.log('Chromium path:', chromiumPath);

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        executablePath: chromiumPath,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    currentQR = qr;
    qrcode.generate(qr, { small: true });
    console.log('QR Code received');
});

client.on('ready', () => {
    isClientReady = true;
    currentQR = null;
    console.log('Client is ready');
});

client.on('authenticated', () => {
    console.log('Authentication successful');
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('Client disconnected:', reason);
    isClientReady = false;
});

client.on('error', (error) => {
    console.error('Client error:', error);
});

console.log('Initializing WhatsApp client');
client.initialize().catch(err => {
    console.error('Failed to initialize:', err);
});

const path = require('path');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/qr', (req, res) => {
    if (isClientReady) {
        res.send('<html><body><h1>Already Connected</h1><a href="/">Back</a></body></html>');
    } else if (currentQR) {
        const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(currentQR);
        res.send('<html><body><h1>Scan QR Code</h1><img src="' + qrUrl + '"/><p><a href="/qr">Refresh</a></p></body></html>');
    } else {
        res.send('<html><body><h1>Loading</h1><p>QR not ready</p><p><a href="/qr">Refresh</a></p></body></html>');
    }
});

app.get('/status', (req, res) => {
    res.json({
        ready: isClientReady,
        hasQR: currentQR !== null
    });
});

app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;
    if (!isClientReady) {
        return res.json({ success: false, error: 'Client not ready' });
    }
    try {
        const chatId = phone.replace(/[^0-9]/g, '') + '@c.us';
        await client.sendMessage(chatId, message);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});
app.post('/logout', async (req, res) => {
    try {
        await client.logout();
        isClientReady = false;
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// متغير لحفظ الـ QR Code
let currentQR = null;
let isClientReady = false;

// إعدادات العميل مع المسارات المحسنة للسيرفر
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
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

// توليد الـ QR Code
client.on('qr', (qr) => {
    currentQR = qr;
    qrcode.generate(qr, { small: true });
    console.log('✅ QR Code received! Visit /qr to see it');
});

// عند نجاح الاتصال
client.on('ready', () => {
    isClientReady = true;
    currentQR = null;
    console.log('✅ WhatsApp Client is ready!');
});

// عند المصادقة
client.on('authenticated', () => {
    console.log('✅ Authentication successful!');
});

// عند فشل المصادقة
client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
});

// عند قطع الاتصال
client.on('disconnected', (reason) => {
    console.log('⚠️ Client was disconnected:', reason);
    isClientReady = false;
});

// معالجة الأخطاء
client.on('error', (error) => {
    console.error('❌ Client error:', error);
});

// تشغيل العميل
console.log('🚀 Initializing WhatsApp client...');
client.initialize().catch(err => {
    console.error('❌ Failed to initialize client:', err);
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.send(
        <html>
            <body style="font-family: Arial; padding: 20px;">
                <h1>WhatsApp Bot Status</h1>
                <p>Status: ${isClientReady ? '✅ Connected' : '⏳ Connecting...'}</p>
                <p><a href="/qr">View QR Code</a></p>
                <p><a href="/status">Check Status</a></p>
            </body>
        </html>
    );
});

// عرض الـ QR Code
app.get('/qr', (req, res) => {
    if (isClientReady) {
        res.send(
            <html>
                <body style="font-family: Arial; padding: 20px; text-align: center;">
                    <h1>✅ Already Connected!</h1>
                    <p>Your WhatsApp is already authenticated.</p>
                    <a href="/">Go Back</a>
                </body>
            </html>
        );
    } else if (currentQR) {
        const qrImageUrl = https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(currentQR)};
        res.send(
            <html>
                <body style="font-family: Arial; padding: 20px; text-align: center;">
                    <h1>Scan QR Code</h1>
                    <p>Scan this code with WhatsApp</p>
                    <img src="${qrImageUrl}" alt="QR Code" />
                    <p><a href="/qr">Refresh</a> | <a href="/">Go Back</a></p>
                </body>
            </html>
        );
    } else {
        res.send(
            <html>
                <body style="font-family: Arial; padding: 20px; text-align: center;">
                    <h1>⏳ Loading...</h1>
                    <p>QR Code not ready yet. Please wait...</p>
                    <p><a href="/qr">Refresh</a> | <a href="/">Go Back</a></p>
                    <script>setTimeout(() => location.reload(), 3000);</script>
                </body>
            </html>
        );
    }
});

// حالة البوت
app.get('/status', (req, res) => {
    res.json({
        ready: isClientReady,
        hasQR: currentQR !== null,
        timestamp: new Date().toISOString()
    });
});
// إعداد منفذ السيرفر
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(🚀 Server running on port ${PORT});
    console.log(📱 Visit your-app-url/qr to scan QR code);
});

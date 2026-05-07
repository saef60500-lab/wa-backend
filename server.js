const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// إعدادات العميل مع المسارات المحسنة للسيرفر
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        // المسار الجديد اللي راح نجربه مع المكتبات
      executablePath: '/usr/bin/chromium',
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-extensions'
        ]
    }
});

// توليد الـ QR Code في السجلات
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR RECEIVED', qr);
});

// عند نجاح الاتصال
client.on('ready', () => {
    console.log('Client is ready!');
});

// تشغيل العميل
client.initialize();

// إعداد منفذ السيرفر
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// إضافة راوت بسيط للتأكد من عمل السيرفر
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is Running!');
});

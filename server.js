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
     executablePath: require('puppeteer').executablePath(),
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process'
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

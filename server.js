const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code ready for scan...');
});

client.on('ready', () => {
    console.log('✅ Server is Ready and WhatsApp Connected!');
});

// استلام الطلب من الواجهة
app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;
    
    console.log('📩 Received phone:', phone);
    console.log('📝 Received message:', message);

    try {
        const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
        await client.sendMessage(formattedPhone, message);
        console.log('🚀 Message sent successfully!');
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.json({ success: false, error: error.message });
    }
});

client.initialize();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
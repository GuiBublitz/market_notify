const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const WHATSAPP_GROUP_ID = process.env.WHATSAPP_GROUP_ID;

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "Notifier" }),
    puppeteer: {
        executablePath: process.env.CHROME_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('ready', () => {
    console.log('Whatsapp connected!');
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.notify = async (message) => {
    let whatsappState = await client.getState();

    if (whatsappState != "CONNECTED") {
        console.log('WHATSAPP ERROR| STATE: ', whatsappState);
        return false;
    };

    client.sendMessage(WHATSAPP_GROUP_ID, message);    
}

client.initialize();

module.exports = {
    whatsappClient: client,
} 
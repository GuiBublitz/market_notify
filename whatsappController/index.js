const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const WHATSAPPGROUPS = {
    "TESOURO_DIRETO": process.env.WHATSAPP_GROUP_ID_TESOURODIRETO,
    "BITCOIN": process.env.WHATSAPP_GROUP_ID_BITCOIN,
};

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "Notifier" }),
    puppeteer: {
        executablePath: process.env.CHROME_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.notify = async (group, message) => {
    let whatsappState = await client.getState();

    if (whatsappState != "CONNECTED") {
        console.log('WHATSAPP ERROR| STATE: ', whatsappState);
        return false;
    };
    try {
        client.sendMessage(WHATSAPPGROUPS[group], message);    
    } catch (error) {
        console.error(`Error sending message to ${group}:`, error.message);
    }
}

client.initialize();

module.exports = {
    whatsappClient: client,
} 
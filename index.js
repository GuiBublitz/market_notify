require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const { scrapeTesouro, obterDadosTesouro, formatarMensagemTesouro } = require('./scrapeTesouro.js');
const qrcode = require('qrcode-terminal');

const GROUP_TESOURO_DIRETO_ID = "120363366937157164@g.us";

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "Notifier" }),
    puppeteer: {
        executablePath: process.env.CHROME_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('ready', () => {
    console.log('Bot Conectado!');

    setInterval(()=>{
        client.sendPresenceAvailable();
        client.sendSeen(GROUP_TESOURO_DIRETO_ID);

        scrapeTesouro()
            .then(async (data)=> {
                let whatsState = await client.getState();
                console.log("Whatsapp state: ", whatsState);
                console.log("Dados tesouro alterados: ", data);

                if (whatsState != "CONNECTED") return;
                if (!data || data.length == 0) return;

                client.sendMessage(GROUP_TESOURO_DIRETO_ID,
                    "*Existem novos valores no Tesouro direto, confira:* \n\n" +
                    formatarMensagemTesouro(data)
                );
            })
            .catch(console.error);
    }, 60000 * 5)
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('message_create', async message => {
    let mensagemTesouro;

    switch(message.body.toUpperCase().trim()) {
        case "!COMANDOS":
            client.sendMessage(message.from, 
                "Comandos: \n" +
                "- !TESOURO\n" +
                "- !IPCA\n" +
                "- !SELIC\n" +
                "- !PREFIXADO\n" +
                "- !RENDA+\n" +
                "- !EDUCA+\n"
            );
            break;
        case "!TESOURO":
            mensagemTesouro = await obterDadosTesouro();
            client.sendMessage(message.from, mensagemTesouro);
            break;
        case "!IPCA":
            mensagemTesouro = await obterDadosTesouro('IPCA');
            client.sendMessage(message.from, mensagemTesouro);
            break;
        case "!SELIC":
            mensagemTesouro = await obterDadosTesouro('SELIC');
            client.sendMessage(message.from, mensagemTesouro);
            break;
        case "!PREFIXADO":
            mensagemTesouro = await obterDadosTesouro('PREFIXADO');
            client.sendMessage(message.from, mensagemTesouro);
            break;
        case "!RENDA+":
            mensagemTesouro = await obterDadosTesouro('RENDA+');
            client.sendMessage(message.from, mensagemTesouro);
            break;
        case "!EDUCA+":
            mensagemTesouro = await obterDadosTesouro('EDUCA+');
            client.sendMessage(message.from, mensagemTesouro);
            break;
    }
});

client.initialize();
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const { scrapeTesouro, obterDadosTesouro, formatarMensagemTesouro } = require('./scrapeTesouro.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "Notifier" }),
    puppeteer: {
        executablePath: process.env.CHROME_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 60000, 
    }
});

client.on('ready', () => {
    console.log('Bot Conectado!');

    setInterval(()=>{
        scrapeTesouro()
            .then(async (data)=> {
                console.log(data);
                console.log("Dados extraídos do tesouro direto!");

                if (!data || data.length == 0) return;

                client.sendMessage("120363366937157164@g.us",
                    "*Existem novos valores no Tesouro direto, confira:* \n\n" +
                    formatarMensagemTesouro(data)
                );
            })
            .catch(console.error);
    }, 1800000)
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
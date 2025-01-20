require('dotenv').config();

const { whatsappClient } = require('./whatsappController');
const Notify = require('./Notify');

const routines = require('./routines');
const notify  = new Notify(whatsappClient);

setInterval(async () => {
    let whatsappState = await whatsappClient.getState();
    if (whatsappState != "CONNECTED") return false;

    notify.runRoutine(routines.TESOURO_DIRETO);
    notify.runRoutine(routines.BITCOIN);
}, 60000);
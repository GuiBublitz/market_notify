require('dotenv').config();

const { whatsappClient } = require('./whatsappController');
const Notify = require('./Notify');

const routines = require('./routines');
const notify  = new Notify(whatsappClient);

setInterval(async () => {
    let whatsappState = await whatsappClient.getState();
    if (whatsappState != "CONNECTED") return false;

    Object.keys(routines).forEach(routine => {
        notify.runRoutine(routine);
    });
    
}, 10000);
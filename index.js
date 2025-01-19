require('dotenv').config();

const { whatsappClient } = require('./whatsappController');
const Notify = require('./Notify');

const routines = require('./routines');
const notify  = new Notify(whatsappClient);

setInterval(() => {
    notify.runRoutine(routines.TESOURO_DIRETO);
    notify.runRoutine(routines.BITCOIN);
}, 5000);
require('dotenv').config();

const { whatsappClient } = require('./whatsappController');
const Notify = require('./Notify');

const routines = require('./routines');
const notify  = new Notify(whatsappClient);

const intervalTime = process.env.NODE_ENV === 'production' ? 60000 * 3 : 10000;
console.log('Routines Interval Time: ', intervalTime);

setInterval(async () => {
    let whatsappState = await whatsappClient.getState();
    if (whatsappState != "CONNECTED") return false;

    Object.keys(routines).forEach(routine => {
        notify.runRoutine(routine);
    });
    
}, intervalTime);
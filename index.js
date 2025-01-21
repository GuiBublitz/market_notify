require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { whatsappClient } = require('./whatsappController');
const Notify = require('./Notify');

const routines = require('./routines');
const notify  = new Notify(whatsappClient);

const intervalTime = process.env.NODE_ENV === 'production' ? 60000 * 3 : 30000;
console.log('Routines Interval Time: ', intervalTime);

const databasePath = path.resolve(__dirname, 'scraper/projects/database');
if (!fs.existsSync(databasePath)) {
    fs.mkdirSync(databasePath, { recursive: true });
    console.log('Created "database" folder');
}

setInterval(async () => {
    let whatsappState = await whatsappClient.getState();
    if (whatsappState != "CONNECTED") return false;

    Object.keys(routines).forEach(routine => {
        notify.runRoutine(routine);
    });
    
}, intervalTime);
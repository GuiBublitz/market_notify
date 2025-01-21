require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { whatsappClient } = require('./whatsappController');
const Notify = require('./Notify');

const routines = require('./routines');
const notify  = new Notify(whatsappClient);

const intervalTime = process.env.NODE_ENV === 'production' ? 60000 * 3 : 30000;
console.log('ROUTINES INTERVAL TIME: ', intervalTime);

const databasePath = path.resolve(__dirname, 'scraper/projects/database');
if (!fs.existsSync(databasePath)) {
    fs.mkdirSync(databasePath, { recursive: true });
}

let isRunning = false;

async function runRoutines() {
    if (isRunning) {
        console.log('Previous routines still running, skipping this interval...');
        return;
    }

    isRunning = true;

    let whatsappState = await whatsappClient.getState();
    if (whatsappState !== "CONNECTED") {
        isRunning = false;
        return;
    }

    for (const routine of Object.keys(routines)) {
        try {
            await notify.runRoutine(routine);
        } catch (err) {
            console.error(`Error running routine ${routine}:`, err);
        }
    }

    isRunning = false;

    setTimeout(runRoutines, intervalTime);
}

whatsappClient.on('ready', () => {
    console.log('WHATSAPP CONNECTED!');
    console.log('STARTING ROUTINES!');
    runRoutines();
});
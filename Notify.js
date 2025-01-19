const scraper = require('./scraper');

class Notify {

    constructor(whatsappClient) {
        this.whatsappClient = whatsappClient;
    }

    async runRoutine(routine) {
        let scraperData = scraper[routine]();
                
        if (!scraperData) {
            console.log(routine, 'No data found');
            return;
        }

        this.whatsappClient.notify(scraperData);
    }

}

module.exports = Notify;
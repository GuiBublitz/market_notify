const scraper = require('./scraper');

class Notify {

    constructor(whatsappClient) {
        this.whatsappClient = whatsappClient;
    }

    async runRoutine(routine) {
        const now = new Date();
        const timestamp = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        
        let scraperData = await scraper[routine]();
                    
        if (!scraperData) {
            console.log(`[${timestamp}] ${routine} - No data found`);
            return;
        }
    
        this.whatsappClient.notify(routine, scraperData);
    }
    
}

module.exports = Notify;
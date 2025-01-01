const puppeteer = require('puppeteer');
const fs = require('fs');

const URL = 'https://www.tesourodireto.com.br/titulos/precos-e-taxas.htm';
const DATA_FILE = './tesouro_data.json';

function loadOldData() {
    if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
    return null;
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function compareData(oldData, newData) {
    if (!oldData) return newData;
    return newData.filter(newItem => {
        const oldItem = oldData.find(item => item.titulo === newItem.titulo);
        return !oldItem || JSON.stringify(oldItem) !== JSON.stringify(newItem);
    });
}

async function scrapeTesouro() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    });
    const page = await browser.newPage();

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    await page.goto(URL, { waitUntil: 'networkidle2' });

    await page.waitForSelector('.td-invest-table__card tr > td:nth-of-type(1) > span', { timeout: 10000 });

    const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('.td-invest-table__card tr'));
        return rows.map(row => {
            const cells = row.querySelectorAll('td');
            return {
                titulo: cells[0]?.querySelector('span')?.innerText.trim() || '',
                rentabilidade: cells[1]?.innerText.trim() || '',
                investimentoMinimo: cells[2]?.innerText.trim() || '',
                precoUnitario: cells[3]?.innerText.trim() || '',
                vencimento: cells[4]?.innerText.trim() || '',
            };
        }).filter(item => item.titulo);
    });

    await browser.close();

    const oldData = loadOldData();
    const changes = compareData(oldData, data);

    if (changes.length > 0) {
        console.log('Alterações detectadas:', changes);
        saveData(data);
    } else if (!oldData) {
        console.log('Dados iniciais capturados:');
        console.table(data);
        saveData(data);
    } else {
        console.log('Nenhuma alteração detectada.');
    }
}

scrapeTesouro().catch(console.error);

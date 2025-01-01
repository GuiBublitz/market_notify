const puppeteer = require('puppeteer');
const fs = require('fs');

const URL = 'https://www.tesourodireto.com.br/titulos/precos-e-taxas.htm';
const DATA_FILE = './tesouro_data.json';
const CHANGES_FILE = './tesouro_changes.json';

function loadOldData() {
    if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
    return null;
}

function saveData(data, filePath) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function compareData(oldData, newData) {
    if (!oldData) return newData;

    return newData
        .map(newItem => {
            const oldItem = oldData.find(item => item.titulo === newItem.titulo);

            if (!oldItem || JSON.stringify(oldItem) === JSON.stringify(newItem)) {
                return null;
            }

            const updatedItem = {
                titulo: newItem.titulo,
                rentabilidade: newItem.rentabilidade,
                investimentoMinimo: newItem.investimentoMinimo,
                precoUnitario: newItem.precoUnitario,
                vencimento: newItem.vencimento
            };

            if (oldItem.rentabilidade !== newItem.rentabilidade) {
                updatedItem["rentabilidade anterior"] = oldItem.rentabilidade;
                updatedItem["nova rentabilidade"] = newItem.rentabilidade;
            }

            return updatedItem;
        })
        .filter(item => item !== null);
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

    saveData(data, DATA_FILE);

    return changes;
}

const formatarMensagemTesouro = (dados, tipo = null) => {
    let mensagem = tipo 
        ? `Aqui estão os títulos do Tesouro (${tipo}):\n\n`
        : `Aqui estão os títulos do Tesouro:\n\n`;

    const dadosFiltrados = tipo 
        ? dados.filter(titulo => titulo.titulo.toLowerCase().includes(tipo.toLowerCase()))
        : dados;

    if (dadosFiltrados.length === 0) {
        mensagem += tipo
            ? `Não há títulos do tipo "${tipo}" disponíveis ou alterados.\n`
            : `Não há títulos alterados disponíveis no momento.\n`;
    } else {
        dadosFiltrados.forEach(titulo => {
            mensagem += `*${titulo.titulo.replace(/\t/g, '').trim()}*\n`;

            if (titulo["rentabilidade anterior"] && titulo["nova rentabilidade"]) {
                mensagem += `- Rentabilidade Anterior: ${titulo["rentabilidade anterior"]}\n`;
                mensagem += `- Nova Rentabilidade: ${titulo["nova rentabilidade"]}\n`;
            } else {
                mensagem += `- Rentabilidade: ${titulo.rentabilidade}\n`;
            }

            mensagem += `- Investimento Mínimo: ${titulo.investimentoMinimo}\n`;
            mensagem += `- Preço Unitário: ${titulo.precoUnitario}\n`;
            mensagem += `- Vencimento: ${titulo.vencimento}\n`;
            mensagem += '\n';
        });
    }

    return mensagem;
};

const obterDadosTesouro = async (tipo = null) => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return "Nenhuma alteração foi detectada nos dados do Tesouro até o momento.";
        }

        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        if (data.length === 0) {
            return "Nenhuma alteração foi detectada nos dados do Tesouro.";
        }

        return formatarMensagemTesouro(data, tipo);
    } catch (error) {
        console.error("Erro ao processar os dados do Tesouro:", error);
        return "Houve um erro ao obter os dados do Tesouro.";
    }
};

module.exports = { scrapeTesouro, obterDadosTesouro, formatarMensagemTesouro };
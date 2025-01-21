const path = require('path');
const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();

module.exports = async function () {
    const URL = 'https://www.tesourodireto.com.br/titulos/precos-e-taxas.htm';
    
    const db = new sqlite3.Database(path.resolve(__dirname, 'database', 'tesouro_direto.db'), (err) => {
        if (err) {
            console.error('Erro ao conectar ao banco de dados:', err.message);
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS titulos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT UNIQUE,
            rentabilidade TEXT,
            investimentoMinimo TEXT,
            precoUnitario TEXT,
            vencimento TEXT
        )
    `);

    let message = "";

    try {
        let browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.goto(URL, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.td-invest-table__card tr', { timeout: 20000 });

        const data = await page.evaluate(() => {
            const container = document.querySelector('table');
            const rows = Array.from(container.querySelectorAll('.td-invest-table__card tr'));

            return rows.map(row => {
                const cells = row.querySelectorAll('td');
                return {
                    titulo: cells[0]?.querySelector('span')?.innerText.trim().replace(/\s+/g, ' ') || '',
                    rentabilidade: cells[1]?.innerText.trim() || '',
                    investimentoMinimo: cells[2]?.innerText.trim() || '',
                    precoUnitario: cells[3]?.innerText.trim() || '',
                    vencimento: cells[4]?.innerText.trim() || '',
                };
            }).filter(item => item.titulo
                && (
                    item.titulo.toUpperCase().includes('IPCA')
                    || item.titulo.toUpperCase().includes('TESOURO PREFIXADO')
                )
            );
        });

        for (const item of data) {
            db.get(`SELECT rentabilidade FROM titulos WHERE titulo = ?`, [item.titulo], (err, row) => {
                if (err) {
                    console.error('Erro ao consultar banco:', err.message);
                    return;
                }

                if (row) {
                    const oldRentabilidade = parseRentabilidade(row.rentabilidade);
                    const newRentabilidade = parseRentabilidade(item.rentabilidade);

                    if (oldRentabilidade < newRentabilidade) {
                        message += "*"
                            + item.titulo 
                            + "*\n"
                            + "- " 
                            + row.rentabilidade 
                            + " -> *"
                            + item.rentabilidade 
                            + "*\n\n";

                        db.run(`
                            UPDATE titulos 
                            SET rentabilidade = ?, investimentoMinimo = ?, precoUnitario = ?, vencimento = ?
                            WHERE titulo = ?
                        `, [item.rentabilidade, item.investimentoMinimo, item.precoUnitario, item.vencimento, item.titulo], (err) => {
                            if (err) {
                                console.error('Erro ao atualizar título:', err.message);
                            }
                        });
                    }
                } else {
                    db.run(`
                        INSERT INTO titulos (titulo, rentabilidade, investimentoMinimo, precoUnitario, vencimento)
                        VALUES (?, ?, ?, ?, ?)
                    `, [item.titulo, item.rentabilidade, item.investimentoMinimo, item.precoUnitario, item.vencimento], (err) => {
                        if (err) {
                            console.error('Erro ao inserir título:', err.message);
                        }
                    });
                }
            });
        }

        await browser.close();
    } catch (error) {
        console.error('Erro ao fazer scraping:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Erro ao fechar o banco de dados:', err.message);
            }
        });

        return message || false;
    }
};

function parseRentabilidade(value) {
    const cleanValue = value.replace(/[^\d.-]/g, '');
    return parseFloat(cleanValue);
}
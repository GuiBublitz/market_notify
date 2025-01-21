const path = require('path');
const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();

module.exports = async function () {
    const URL = 'https://br.tradingview.com/symbols/BTCUSD/';
    const BASE_PRICE = 10000;
    const RESET_MARGIN = 5000; 
    const TOLERANCE = 1000;

    const db = new sqlite3.Database(path.resolve(__dirname, 'database', 'bitcoin_prices.db'), (err) => {
        if (err) {
            console.error('Erro ao conectar ao banco de dados:', err);
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS state (
        key TEXT PRIMARY KEY,
        value REAL
    )`);

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.goto(URL, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.lastContainer-JWoJqCpY > span', { timeout: 20000 });

        const priceText = await page.evaluate(() => {
            return document.querySelector('.lastContainer-JWoJqCpY > span').innerText;
        });

        const price = parseFloat(priceText.replace(',', '').replace('$', ''));

        const isNearBase = (price, base, tolerance) => {
            return Math.abs(price % base) <= tolerance || Math.abs(price % base - base) <= tolerance;
        };

        let lastNotifiedPrice = null;
        let resetFlag = false;
        await new Promise((resolve, reject) => {
            db.all(`SELECT key, value FROM state WHERE key IN ('last_notified_price', 'reset_flag')`, (err, rows) => {
                if (err) {
                    console.error('Erro ao buscar estado:', err);
                    reject(err);
                } else {
                    rows.forEach((row) => {
                        if (row.key === 'last_notified_price') lastNotifiedPrice = parseFloat(row.value);
                        if (row.key === 'reset_flag') resetFlag = row.value === 'true';
                    });
                    resolve();
                }
            });
        });

        if (isNearBase(price, BASE_PRICE, TOLERANCE)) {
            if (
                resetFlag ||
                lastNotifiedPrice === null
            ) {
                console.log('Returning valid price:', price);

                db.run(
                    `INSERT INTO state (key, value) VALUES 
                        ('last_notified_price', ?),
                        ('reset_flag', 'false')
                     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
                    [price],
                    (err) => {
                        if (err) {
                            console.error('Erro ao atualizar estado:', err);
                        }
                    }
                );

                await browser.close();
                return "ALERTA DE PREÇO | BITCOIN \n\n" + 
                    "   $ *" + price + "*";
            }
        }

        if (lastNotifiedPrice !== null && Math.abs(price - lastNotifiedPrice) >= RESET_MARGIN) {

            db.run(
                `INSERT INTO state (key, value) VALUES 
                    ('reset_flag', 'true') 
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
                (err) => {
                    if (err) {
                        console.error('Erro ao atualizar flag de reset:', err);
                    }
                }
            );
        }

    } catch (error) {
        console.error('Erro ao fazer scraping:', error);
    } finally {

        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Erro ao fechar o navegador:', closeError);
            }
        }

        db.close((err) => {
            if (err) {
                console.error('Erro ao fechar o banco de dados:', err);
            }
        });
    }

    return false;
};
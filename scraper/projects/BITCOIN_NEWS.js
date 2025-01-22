const path = require('path');
const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();

module.exports = async function () {
    const URL = 'https://br.tradingview.com/symbols/BTCUSD/news/?exchange=BITSTAMP';

    const db = new sqlite3.Database(path.resolve(__dirname, 'database', 'bitcoin_news.db'), (err) => {
        if (err) {
            console.error('Erro ao conectar ao banco de dados:', err.message);
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT UNIQUE,
        link TEXT
    )`);

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        await page.goto(URL, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.list-iTt_Zp4a article', { timeout: 20000 });

        const data = await page.evaluate(() => {
            return {
                title: document.querySelector('.list-iTt_Zp4a article > div div:nth-of-type(2)').innerText,
                link: document.querySelector('.list-iTt_Zp4a > a').href,
            };
        });

        const newsExists = await new Promise((resolve) => {
            db.get(
                `SELECT id FROM news WHERE title = ?`,
                [data.title],
                (err, row) => {
                    if (err) {
                        console.error('Erro ao verificar a notícia no banco de dados:', err.message);
                        resolve(false);
                    }
                    resolve(!!row);
                }
            );
        });

        if (!newsExists) {
            db.run(
                `INSERT INTO news (title, link) VALUES (?, ?)`,
                [data.title, data.link],
                (err) => {
                    if (err) {
                        console.error('Erro ao salvar a notícia no banco de dados:', err.message);
                    }
                }
            );

            return (
                "NEWS - " + data.title +
                "\n\n" + data.link
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
                console.error('Erro ao fechar o banco de dados:', err.message);
            }
        });
    }

    return false;
};

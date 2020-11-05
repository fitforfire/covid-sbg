const puppeteer = require('puppeteer');
const HtmlTableToJson = require('html-table-to-json');
const fs = require('fs');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat')
const districts = require('./districts');
dayjs.extend(customParseFormat)

const dateFormat = "MM.DD.YYYY HH:mm:ss";

async function getDistrictData(browser, name, url) {
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitForSelector('.ueber')
    await page.waitForSelector('p')
    let tableHTML = await page.evaluate(() => document.querySelector('.ueber').parentElement.parentElement.innerHTML);
    const time = await page.evaluate(() => document.querySelector('p').innerText.split(": ")[1]);

    // fix table headers...
    tableHTML = tableHTML.replace("<th>" + name + "</th>", "<th>" + name + "</th></tr><tr><td>" + name + "</td>");

    // fix table for stadt salzburg...
    tableHTML = tableHTML.replace("<th>Stadt Salzburg - Nicht zugeordnet</th>", "<td>Stadt Salzburg - Nicht zugeordnet</td>");

    const data = HtmlTableToJson.parse("<table>" + tableHTML + "</table>");
    return {
        results: data.results,
        time: dayjs(time, dateFormat).toISOString()
    };
}

(async () => {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
    const data = {};
    let updateTime;
    await Promise.all(Object.keys(districts).map(async name => {
        const url = districts[name];
        const {results: raw, time} = await getDistrictData(browser, name, url);
        data[name] = {};
        raw[0].forEach(e => {
            data[name][e[name]] = {
                'gesamt' : e['Infizierte Gesamt'],
                'genesen': e['Genesen'],
                'verstorben': e['Verstorben'],
                'aktiv': e['Aktiv infizierte Personen']
            };
        })
        updateTime = time;
        return raw;
    }));
    await browser.close()
    const now = Date.now()
    const output = JSON.stringify({
        meta: {
            timestamp: {
                update: updateTime,
                crawl: now
            }
        },
        data: data
    }, null, 2);

    await fs.writeFileSync('data/' + updateTime + '.json', output);
    await fs.writeFileSync('data/log/' + now + "_" + updateTime + '.json', output);
})();
const puppeteer = require('puppeteer');

const sites = [
    { url: 'https://jamre.ae/', file: 'public/portfolio-1.jpg' }
];

async function run() {
    console.log('Starting puppeteer...');
    const browser = await puppeteer.launch();
    
    for (const site of sites) {
        console.log(`Capturing ${site.url}...`);
        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1200, height: 900 });
            await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000));
            await page.screenshot({ path: site.file, type: 'jpeg', quality: 80 });
            await page.close();
        } catch (err) {
            console.error(`Failed to capture ${site.url}:`, err);
        }
    }
    
    await browser.close();
    console.log('Done capturing screenshots!');
}

run();

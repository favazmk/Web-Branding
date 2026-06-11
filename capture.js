const puppeteer = require('puppeteer');
const fs = require('fs');

const sites = [
    { url: 'https://jamrealestate.ae', file: 'public/portfolio-1.jpg' },
    { url: 'https://voguevenue.ae', file: 'public/portfolio-2.jpg' },
    { url: 'https://finefeichidxb.com', file: 'public/portfolio-3.jpg' },
    { url: 'https://realkarak.com', file: 'public/portfolio-4.jpg' },
    { url: 'https://rashicafenew.hashirnisam.com/', file: 'public/portfolio-5.jpg' },
    { url: 'https://esglobal.hashirnisam.com/', file: 'public/portfolio-6.jpg' },
    { url: 'https://www.cedarcosmetics.com/', file: 'public/portfolio-7.jpg' },
    { url: 'https://voguevenue.ae/', file: 'public/portfolio-8.jpg' },
    { url: 'https://shopbrod.com/', file: 'public/portfolio-9.jpg' }
];

async function run() {
    console.log('Starting puppeteer...');
    const browser = await puppeteer.launch();
    
    for (const site of sites) {
        console.log(`Capturing ${site.url}...`);
        try {
            const page = await browser.newPage();
            // Set 4:3 aspect ratio viewport for portfolio cards
            await page.setViewport({ width: 1200, height: 900 });
            await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
            // Wait an extra second for animations
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

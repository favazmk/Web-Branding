const puppeteer = require('puppeteer');

const url = 'https://www.instagram.com/kenz__trading';
const file = 'public/ig-1.jpg';

async function run() {
    console.log('Starting puppeteer for Instagram...');
    // We might need to spoof the user agent
    const browser = await puppeteer.launch({
        headless: "new"
    });
    
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1200, height: 900 });
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait a bit for images to load
        await new Promise(r => setTimeout(r, 5000));
        
        // Try to close the login popup if it exists
        try {
            // Instagram login popup close button selector varies, sometimes just pressing Escape works
            await page.keyboard.press('Escape');
            await new Promise(r => setTimeout(r, 1000));
        } catch(e) {}

        await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
        console.log('Saved screenshot to', file);
    } catch (err) {
        console.error(`Failed to capture ${url}:`, err);
    }
    
    await browser.close();
}

run();

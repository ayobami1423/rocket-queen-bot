const { chromium } = require('playwright');
const TelegramBot = require('node-telegram-bot-api');

// CONFIGURATION
const TELEGRAM_TOKEN = "8849422019:AAHG71iXLC7J4VjEbhNWWFDS8okbRe4kReQ";
const CHANNEL_ID = "@aviatorts12";
const TARGET_URL = "https://deryui.vercel.app/rocketqueen.html";

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
let lastCheckedHistory = "";

async function sendSignal(historyArray) {
    const message = `🚨 **ROCKET QUEEN SIGNAL TRIGGERED** 🚨\n\n` +
                    `📉 System Alert: 4 consecutive rounds hit under 2.00x!\n` +
                    `📊 Board History Log: [${historyArray.join(', ')}]\n\n` +
                    `🚀 Recommendation: High probability green trend incoming. Prepare your bet!\n` +
                    `🎯 Target Cashout: 1.50x - 2.00x`;
    try {
        await bot.sendMessage(CHANNEL_ID, message, { parse_mode: 'Markdown' });
        console.log("[+] Signal successfully posted to Telegram!");
    } catch (error) {
        console.error("[-] Telegram push error:", error.message);
    }
}

async function monitorGame() {
    console.log("[*] Launching cloud-based headless browser...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    while (true) {
        try {
            // Open the Vercel page natively inside the cloud server
            await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
            
            // Wait an extra 3 seconds for the numbers to fully finish rendering
            await page.waitForTimeout(3000);

            // Extract all text inside divs, spans, or paragraphs
            const textContent = await page.evaluate(() => document.body.innerText);
            
            // Parse strings out into clean multiplier floats
            const words = textContent.split(/\s+/);
            let multipliers = [];

            for (let word of words) {
                let clean = word.replace(/[xX-]/g, '').trim();
                let val = parseFloat(clean);
                if (!isNaN(val) && val >= 1.00 && val <= 500.00 && val !== 1.0) {
                    multipliers.push(val);
                }
            }

            // Cut down to the top 4 latest rounds
            multipliers = multipliers.slice(0, 4);
            const historyString = multipliers.join(',');

            if (multipliers.length === 4 && historyString !== lastCheckedHistory) {
                lastCheckedHistory = historyString;
                console.log(`[ Live Scraping ] Current top layout: [${historyString}]`);

                // Check condition: Are all 4 numbers under 2.00x?
                if (multipliers.every(x => x < 2.00)) {
                    console.log("[🚨 ALERT ] Criteria matched! Blasting channel...");
                    await sendSignal(multipliers);
                }
            }
        } catch (e) {
            console.log("[-] Retrying link loop due to connection timeout...");
        }
        
        // Wait 8 seconds before scanning the webpage layout again
        await page.waitForTimeout(8000);
    }
}

// FIX: Matching the exact function name casing
monitorGame();

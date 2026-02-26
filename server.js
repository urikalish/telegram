import 'dotenv/config';
import { Telegraf } from 'telegraf';
import * as cheerio from 'cheerio';

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN) throw new Error('Missing essential environment variable: BOT_TOKEN');
if (!CHAT_ID) throw new Error('Missing essential environment variable: CHAT_ID');

const bot = new Telegraf(BOT_TOKEN);

const AVAILABLE_COMMANDS = `/help - lists all available commands.
/time - lists current time on bot server.
/avdija - lists Deni Avdija's status.`;

async function postMessage(message) {
    try {
        await bot.telegram.sendMessage(CHAT_ID, message);
        console.log('Message sent successfully!');
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

bot.command('help', (ctx) => {
    ctx.reply(AVAILABLE_COMMANDS);
});

bot.command('time', (ctx) => {
    const now = new Date();
    const options = {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    };
    const timeStr = new Intl.DateTimeFormat('en-GB', options).format(now);
    ctx.reply(`Current time on bot server: ${timeStr}`);
});

bot.command('avdija', async (ctx) => {
    console.log(`Fetching Avdija's status...`);
    let status = '';
    try {
        const url = `https://www.espn.com/nba/player/_/id/4683021/deni-avdija`;
        const response = await fetch(url);
        if (response.ok) {
            const html = await response.text();
            const $ = cheerio.load(html);
            status = $('.TextStatus').first().text().trim();
        } else {
            console.error(response.statusText);
        }
    } catch (error) {
        console.error(error);
    }
    const result = status ? `Avdija's status: ${status}` : `Unable to get Avdija's status`;
    console.log(result);
    ctx.reply(result);
});

async function init() {
    console.log(`Bot initializing...`);
    try {
        await postMessage(AVAILABLE_COMMANDS);
        await bot.launch();
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
        console.log(`Bot initialization done.`);
    } catch(error) {
        console.error(error);
    }
}

init().catch(console.error);
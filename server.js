import 'dotenv/config';
import { Telegraf } from 'telegraf';
import * as cheerio from 'cheerio';

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN) throw new Error('Missing essential environment variable: BOT_TOKEN');
if (!CHAT_ID) throw new Error('Missing essential environment variable: CHAT_ID');

const ROOT_COMMANDS = `/help - lists all available commands.
/time - lists current time on bot server.
/deni - watch Deni Avdija's status.`;

const bot = new Telegraf(BOT_TOKEN);

let deniStatusWatchTimerId = 0;
let lastReportedDeniStatus = '';

async function postMessage(message) {
    try {
        await bot.telegram.sendMessage(CHAT_ID, message);
        console.log(`Message sent successfully`);
    } catch (error) {
        console.error(`Error sending message:`, error);
    }
}

bot.command('help', (ctx) => {
    console.log(`Running help command`);
    const result = ROOT_COMMANDS;
    console.log(result);
    ctx.reply(result);
});

bot.command('time', (ctx) => {
    console.log(`Running time command`);
    const now = new Date();
    const options = {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    };
    const timeStr = new Intl.DateTimeFormat('en-GB', options).format(now);
    const result = `Current time on bot server: ${timeStr}`;
    console.log(result);
    ctx.reply(result);
});

async function fetchDeniStatus() {
    console.log(`Fetching Deni Avdija's status...`);
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
    const result = status ? `Deni's status: ${status}` : `Unable to get Deni's status`;
    console.log(result);
    return result;
}

async function watchDeniStatus(ctx) {
    const result = await fetchDeniStatus();
    if (result !== lastReportedDeniStatus) {
        ctx.reply(result);
        lastReportedDeniStatus = result;
    }
    deniStatusWatchTimerId = setTimeout(() => {
        watchDeniStatus(ctx).catch(console.error);
    }, 5 * 60 * 1000);
}

bot.command('status', async (ctx) => {
    console.log(`Running status command`);
    const result = await fetchDeniStatus();
    ctx.reply(result);
});

bot.command('start', async (ctx) => {
    console.log(`Running start command`);
    ctx.reply(`start watching Deni's status...`);
    lastReportedDeniStatus = '';
    clearTimeout(deniStatusWatchTimerId);
    watchDeniStatus(ctx).catch(console.error);
});

bot.command('stop', async (ctx) => {
    console.log(`Running stop command`);
    ctx.reply(`stop watching Deni's status.`);
    lastReportedDeniStatus = '';
    clearTimeout(deniStatusWatchTimerId);
});

bot.command('deni', async (ctx) => {
    const AVDIJA_COMMANDS =
`/status - reports Deni Avdija's status.
/start - start watching Deni Avdija's status.
/stop - stop watching Deni Avdija's status.`;
    ctx.reply(AVDIJA_COMMANDS);
});

async function init() {
    console.log(`Bot initializing...`);
    try {
        await postMessage(ROOT_COMMANDS);
        await bot.launch();
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
        console.log(`Bot initialization done.`);
    } catch(error) {
        console.error(error);
    }
}

init().catch(console.error);

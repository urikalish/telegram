import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { TimeService } from './serices/time.js';
import { NbaService } from './serices/nba.js';

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('Missing essential environment variable: BOT_TOKEN');
const CHAT_ID = process.env.CHAT_ID;
if (!CHAT_ID) throw new Error('Missing essential environment variable: CHAT_ID');

console.log(`Bot initializing...`);
const bot = new Telegraf(BOT_TOKEN);
const services = [
    new TimeService(bot),
    new NbaService(bot)
];
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
services.forEach(s => {
    s.init();
})
bot.command('help', (ctx) => {
    console.log(`Running help command`);
    let result = '';
    services.forEach(s => {
        result += s.getCommandList() + '\n';
    })
    console.log(result);
    ctx.reply(result);
});
await bot.telegram.sendMessage(CHAT_ID, `/help - List all bot commands.`);
console.log(`Bot initialized`);
bot.launch().catch(console.error);

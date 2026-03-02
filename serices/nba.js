import 'dotenv/config';
import * as cheerio from 'cheerio';

export class NbaService {
    deniStatusWatchTimerId = 0;
    lastReportedDeniStatus = '';
    bot = null;

    constructor(bot) {
        this.bot = bot;
    }

    init() {
        this.bot.command('nba', async (ctx) => {
            this.handleNbaCommands(ctx).catch(console.error);
        });
        this.bot.command('next_game', async (ctx) => {
            this.handleNextGame(ctx).catch(console.error);
        });
        this.bot.command('deni_status', async (ctx) => {
            this.handleDeniStatus(ctx).catch(console.error);
        });
        this.bot.command('deni_start', async (ctx) => {
            this.handleDeniStart(ctx).catch(console.error);
        });
        this.bot.command('deni_stop', async (ctx) => {
            this.handleDeniStop(ctx).catch(console.error);
        });
    }

    getCommandList() {
        return `/nba - List NBA commands.`;
    }

    async handleNbaCommands(ctx) {
        const AVDIJA_COMMANDS =
`/next_game - Blazers next game/
/deni_status - reports Deni Avdija's status.
/deni_start - start watching Deni Avdija's status.
/deni_stop - stop watching Deni Avdija's status.`;
        ctx.reply(AVDIJA_COMMANDS);
    }

    async fetchNextGame() {
        console.log(`Fetching Next game...`);
        let timeStr = '';
        try {
            const url = `https://www.espn.com/nba/team/schedule/_/name/por/portland-trail-blazers`;
            const response = await fetch(url);
            if (response.ok) {
                const html = await response.text();
                const $ = cheerio.load(html);
                timeStr = $('tr.Table__TR:has(> td > a.Schedule__ticket)').first().text().trim();
            } else {
                console.error(response.statusText);
            }
        } catch (error) {
            console.error(error);
        }
        const result = timeStr ? `Next game: ${timeStr}` : `Unable to get next game time`;
        console.log(result);
        return result;
    }

    async handleNextGame(ctx) {
        console.log(`Running next game command`);
        const result = await this.fetchNextGame();
        ctx.reply(result);
    }

    async fetchDeniStatus() {
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

    async handleDeniStatus(ctx) {
        console.log(`Running Deni status command`);
        const result = await this.fetchDeniStatus();
        ctx.reply(result);
    }

    async watchDeniStatus(ctx) {
        const result = await this.fetchDeniStatus();
        if (result !== this.lastReportedDeniStatus) {
            ctx.reply(result);
            this.lastReportedDeniStatus = result;
        }
        this.deniStatusWatchTimerId = setTimeout(() => {
            this.watchDeniStatus(ctx).catch(console.error);
        }, 5 * 60 * 1000);
    }

    async handleDeniStart(ctx) {
        console.log(`Running Deni start command`);
        ctx.reply(`Start watching Deni's status...`);
        this.lastReportedDeniStatus = '';
        clearTimeout(this.deniStatusWatchTimerId);
        this.watchDeniStatus(ctx).catch(console.error);
    };

    async handleDeniStop(ctx){
        console.log(`Running Deni stop command`);
        ctx.reply(`Stop watching Deni's status.`);
        this.lastReportedDeniStatus = '';
        clearTimeout(this.deniStatusWatchTimerId);
    }
}

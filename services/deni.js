export class DeniService {
    deniStatusWatchTimerId = 0;
    lastReportedDeniStatus = '';
    bot = null;

    constructor(bot) {
        this.bot = bot;
    }

    init() {
        this.bot.command('deni_status', (ctx) => this.handleDeniStatus(ctx));
        this.bot.command('deni_watch', (ctx) => this.handleDeniWatch(ctx));
        this.bot.command('deni_unwatch', (ctx) => this.handleDeniUnwatch(ctx));
    }

    getCommandList() {
        return `/deni_status - reports Deni Avdija's status.
/deni_watch - start watching Deni Avdija's status.
/deni_unwatch - stop watching Deni Avdija's status.`;
    }

    async fetchDeniStatus() {
        let result = '';
        console.log(`Fetching Deni Avdija's status...`);
        const DENI_PLAYER_ID = 4683021;
        try {
            const url = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${DENI_PLAYER_ID}`;
            const response = await fetch(url);
            if (response.ok) {
                const json = await response.json();
                const injuries = json.athlete?.injuries;
                if (injuries && injuries.length > 0) {
                    const status = injuries[0]?.details?.fantasyStatus?.description;
                    if (status) {
                        result = status;
                    }
                } else {
                    result = `Deni's status: OK`;
                }
            } else {
                console.error("Error fetching Deni status:", response.error);
            }
        } catch (error) {
            console.error("Error fetching Deni status:", error);
        }
        result = result || `Unable to get Deni's precise status details`;
        console.log(result);
        return result;
    }

    async handleDeniStatus(ctx) {
        console.log(`Running Deni status command`);
        const result = await this.fetchDeniStatus();
        ctx.reply(result);
    }

    async watchDeniStatus(chatId) {
        const result = await this.fetchDeniStatus();
        if (result !== this.lastReportedDeniStatus) {
            this.lastReportedDeniStatus = result;
            await this.bot.telegram.sendMessage(chatId, result);
        }
        this.deniStatusWatchTimerId = setTimeout(() => {
            this.watchDeniStatus(chatId).catch(console.error);
        }, 5 * 60 * 1000);
    }

    async handleDeniWatch(ctx) {
        console.log(`Running Deni watch command`);
        const chatId = ctx.chat.id;
        if (this.deniStatusWatchTimerId) {
            return ctx.reply(`Already watching Deni's status`);
        }
        const msg = `Started watching Deni's status...`;
        console.log(msg);
        ctx.reply(msg);
        this.lastReportedDeniStatus = '';
        this.watchDeniStatus(chatId).catch(console.error);
    };

    async handleDeniUnwatch(ctx) {
        console.log(`Running Deni unwatch command`);
        let msg;
        if (this.deniStatusWatchTimerId) {
            clearTimeout(this.deniStatusWatchTimerId);
            this.deniStatusWatchTimerId = 0;
            this.lastReportedDeniStatus = '';
            msg = `Stopped watching Deni's status`;
        } else {
            msg = `I wasn't watching Deni's status`;
        }
        console.log(msg);
        ctx.reply(msg);
    }

}

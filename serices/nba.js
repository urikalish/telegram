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
`/next_game - Blazers' next game.
/deni_status - reports Deni Avdija's status.
/deni_start - start watching Deni Avdija's status.
/deni_stop - stop watching Deni Avdija's status.`;
        ctx.reply(AVDIJA_COMMANDS);
    }

    async fetchNextGame() {
        console.log(`Fetching Next game...`);
        let gameInfo = '';
        const url = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/por/schedule';

        try {
            const response = await fetch(url);
            const data = await response.json();
            const upcomingGames = data.events.filter(event =>
                event.competitions[0].status.type.completed === false
            );
            const nextGame = upcomingGames[0];
            if (nextGame) {
                const utcDate = new Date(nextGame.date);
                const options = {
                    timeZone: "Asia/Jerusalem",
                    weekday: "long",    // "Thursday"
                    day: "2-digit",      // "05"
                    month: "2-digit",    // "03"
                    year: "2-digit",     // "26"
                    hour: "2-digit",     // "03"
                    minute: "2-digit",   // "00"
                    hour12: false        // 24-hour format
                };
                const israelTime = utcDate.toLocaleString("en-GB", options);
                gameInfo = `${nextGame.name}\n${israelTime}`;
            }
        } catch (error) {
            console.error("Error fetching schedule:", error);
        }
        const result = gameInfo ? `Next game:\n${gameInfo}` : `Unable to get next game`;
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
        const DENI_PLAYER_ID = 4683021;
        let status = '';
        try {
            const url = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${DENI_PLAYER_ID}`;
            const response = await fetch(url);
            if (response.ok) {
                const json = await response.json();
                if (json.athlete.injuries) {
                    status = json.athlete.injuries[0].details.fantasyStatus.description;
                } else {
                    status = 'OK';
                }
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

export class BlazersService {
    bot = null;

    constructor(bot) {
        this.bot = bot;
    }

    init() {
        this.bot.command('blazers_next_game', (ctx) => this.handleBlazersNextGame(ctx));
    }

    getCommandList() {
        return `/blazers_next_game - Blazers' next game time.`;
    }

    async fetchNextGame() {
        console.log(`Fetching Next game...`);
        let gameInfo = '';
        const url = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/por/schedule';

        try {
            const response = await fetch(url);
            const data = await response.json();
            const upcomingGames = data.events?.filter(event =>
                event?.competitions?.[0]?.status?.type?.completed === false
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

    async handleBlazersNextGame(ctx) {
        console.log(`Running next game command`);
        const result = await this.fetchNextGame();
        ctx.reply(result);
    }

}

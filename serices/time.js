export class TimeService {
    bot = null;

    constructor(bot) {
        this.bot = bot;
    }

    init() {
        this.bot.command('time', async (ctx) => {
            this.handleTime(ctx).catch(console.error);
        });
    }

    getCommandList() {
        return `/time - Show current bot time.`;
    }

    async handleTime(ctx) {
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
    }
}

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
        const timeStr = new Intl.DateTimeFormat('en-GB', options).format(new Date());
        const result = `Current time on bot server: ${timeStr}`;
        console.log(result);
        ctx.reply(result);
    }
}

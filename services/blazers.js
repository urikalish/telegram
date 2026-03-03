export class BlazersService {
    deniStatusWatchTimerId = 0;
    lastReportedDeniStatus = '';
    bot = null;

    constructor(bot) {
        this.bot = bot;
    }

    logAndReply(ctx, msg) {
        console.log(msg);
        ctx.reply(msg);
    }

    init() {
        this.bot.command('blazers_next_game', (ctx) => this.handleBlazersNextGame(ctx));
        this.bot.command('deni_status', (ctx) => this.handleDeniStatus(ctx));
        this.bot.command('deni_watch', (ctx) => this.handleWatchDeni(ctx));
        this.bot.command('deni_unwatch', (ctx) => this.handleUnwatchDeni(ctx));
    }

    getCommandList() {
        return `/blazers_next_game - Blazers' next game info.
/deni_status - Deni's injury status.
/deni_watch - start watching Deni's status.
/deni_unwatch - stop watching Deni's status.`;
    }

    getTimeRemaining(futureDate) {
        const now = new Date();
        const differenceMs = futureDate - now;
        if (differenceMs <= 0) {
            return { days: 0, hours: 0, minutes: 0 };
        }
        const days = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((differenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((differenceMs % (1000 * 60 * 60)) / (1000 * 60));
        return { days, hours, minutes };
    }

    getIsraelTimeStr(utcDate) {
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
        return utcDate.toLocaleString('en-GB', options);
    }

    async fetchNextGameInfo() {
        const result = {
            name: '',
            israelTimeStr: '',
            utcDateTime: null,
            leftDays: 0,
            leftHours: 0,
            leftMinutes: 0,
        };
        const url = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/por/schedule';
        try {
            const response = await fetch(url);
            const data = await response.json();
            const upcomingGames = data.events?.filter(event =>
                event?.competitions?.[0]?.status?.type?.completed === false
            );
            const nextGame = upcomingGames[0];
            if (nextGame) {
                result.name = nextGame.name;
                result.utcDateTime = new Date(nextGame.date);
                result.israelTimeStr = this.getIsraelTimeStr(result.utcDateTime);
                const timeRemaining = this.getTimeRemaining(result.utcDateTime);
                result.leftDays = timeRemaining.days;
                result.leftHours = timeRemaining.hours;
                result.leftMinutes = timeRemaining.minutes;
            }
        } catch (error) {
            console.error("Error fetching schedule:", error);
        }
        console.log(`Next game info: ${JSON.stringify(result, null, 2)}`);
        return result;
    }

    async handleBlazersNextGame(ctx) {
        let msg;
        const nextGameInfo = await this.fetchNextGameInfo();
        if (nextGameInfo.name && nextGameInfo.utcDateTime) {
            let timeLeftStr = '';
            if (nextGameInfo.leftDays > 0) {
                timeLeftStr = `${nextGameInfo.leftDays} day(s) and ${nextGameInfo.leftHours} hour(s)`;
            } else if (nextGameInfo.leftHours > 0) {
                timeLeftStr = `${nextGameInfo.leftHours} hour(s) and ${nextGameInfo.leftMinutes} minute(s)`;
            } else if (nextGameInfo.leftMinutes > 0) {
                timeLeftStr = `${nextGameInfo.leftMinutes} minute(s)`;
            }
            msg = `Blazers' next game:\n${nextGameInfo.name}\n${nextGameInfo.israelTimeStr}${timeLeftStr ? '\nin ' + timeLeftStr : ''}`;
        } else {
            msg =  `Unable to get next game info`;
        }
        this.logAndReply(ctx, msg);
    }

    async fetchDeniStatus() {
        let result = '';
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
                    result = `OK`;
                }
            } else {
                console.error("Error fetching Deni status:", response.error);
            }
        } catch (error) {
            console.error("Error fetching Deni status:", error);
        }
        console.log(`Deni's status: ${result}`);
        return result;
    }

    async handleDeniStatus(ctx) {
        const msg = await this.fetchDeniStatus() || `Unable to get Deni's status`;
        this.logAndReply(ctx, msg);
    }

    async watchDeniStatus(chatId) {
        const status = await this.fetchDeniStatus();
        if (status !== this.lastReportedDeniStatus) {
            this.lastReportedDeniStatus = status;
            await this.bot.telegram.sendMessage(chatId, status || `Unable to get Deni's status`);
        }
        const nextGameInfo = await this.fetchNextGameInfo();
        let refreshFreqMins = 60;
        if (nextGameInfo.leftMinutes < 90) {
            refreshFreqMins = 1;
        } else if (nextGameInfo.leftMinutes < 180) {
            refreshFreqMins = 5;
        }
        this.deniStatusWatchTimerId = setTimeout(() => {
            this.watchDeniStatus(chatId).catch(console.error);
        }, refreshFreqMins * 60 * 1000);
    }

    async handleWatchDeni(ctx) {
        const chatId = ctx.chat.id;
        if (this.deniStatusWatchTimerId) {
            return ctx.reply(`Already watching Deni's status`);
        }
        const msg = `Started watching Deni's status...`;
        this.logAndReply(ctx, msg);
        this.lastReportedDeniStatus = '';
        this.watchDeniStatus(chatId).catch(console.error);
    };

    async handleUnwatchDeni(ctx) {
        let msg;
        if (this.deniStatusWatchTimerId) {
            clearTimeout(this.deniStatusWatchTimerId);
            this.deniStatusWatchTimerId = 0;
            this.lastReportedDeniStatus = '';
            msg = `Stopped watching Deni's status`;
        } else {
            msg = `I wasn't watching Deni's status`;
        }
        this.logAndReply(ctx, msg);
    }

}

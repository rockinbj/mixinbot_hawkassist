const path = require("path");
const shell = require("shelljs");
const ahr = require("./ahr999");
const db = require("./dbFunctions");
const mixin = require("./mixinFunctions");


async function getCurrentCost(costs) {
    costs = JSON.parse(costs);

    let cost = 0.0;
    let interval = 0;
    ahr999 = await ahr.getAhr999();
    costMonthlyLow = costs[0];
    costMonthlyNormal = costs[1];
    costMonthlyHigh = costs[2];

    intervalLow = 15;  //minutes
    intervalNormal = 30;
    intervalHigh = 60;

    if (ahr999 <= 0.46) {
        cost  = (costMonthlyLow / 30 / 24 / 60 * intervalLow).toFixed(4);
        interval = intervalLow;
    } 
    else if (ahr999 > 0.46 && ahr999 <= 1.2) {
        cost = (costMonthlyNormal / 30 / 24 / 60 * intervalNormal).toFixed(4);
        interval = intervalNormal;
    }
    else {
        cost = (costMonthlyHigh / 30 / 24 / 60 * intervalHigh).toFixed(4);
        interval = intervalHigh;
    }

    return {cost, interval};
}


function buildBuySchedule(userId, tokenSymbol, {cost, interval}) {
    // return new Promise(res=>{
    //     const cmd = `*/${interval} * * * * cd /home/rockhawk/Code/mixin/hawkassist; node buy.js ${userId} ${tokenSymbol} ${cost} >> buy.log &`;
    //     res(cmd);
    // })
    const cmd = `*/${interval} * * * * root cd ${path.resolve()}; node src/buy.js ${userId} ${tokenSymbol} ${cost} >> log/buy.log &`;
    return cmd;
}


async function sendAhr999xAlarm() {
    const ahr999x = await ahr.getAhr999x();
    if (ahr999x <= 0.46) {
        const users = await db.getAllUsers();
        users.forEach(user => {
            mixin.client.sendTextMsg(user.userId, `⚠️BTC价格可能已经处于顶部，Ahr999x: ${ahr999x}`)
        });
    }
}


async function main() {
    let schedules = [];
    let userInvests = await db.getAllInvests();
    for (const invest of userInvests) {
        let {cost, interval}  = await getCurrentCost(invest.amounts);
        interval = 10;  //for test
        const cmd = buildBuySchedule(invest.userId, invest.tokenSymbol, {cost, interval});
        schedules.push(cmd);
    }

    const cronFile = "/etc/cron.d/hawkassist_buy";
    shell.exec(`echo "" > ${cronFile}`);
    
    schedules.forEach(schedule => {
        shell.exec(`echo "${schedule}" >> ${cronFile}`);
    });

    // shell.exec("crontab buy.cron");
    // shell.exec("crontab -l");

    sendAhr999xAlarm();
}


main();

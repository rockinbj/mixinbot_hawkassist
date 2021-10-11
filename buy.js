const shell = require("shelljs");
const {getAhr999, getAhr999x} = require("./ahr999");


let buyAmount = 0.001;
let interval = 5;  // minute
let usdtCny = 6.5;


async function main() {
    let ahr999 = await getAhr999();
    console.log(Date());
    console.log(`ahr999: ${ahr999}`);
    if (ahr999 <= 0.46) {
        buyAmount = (13.88/usdtCny).toFixed(4);
        interval = 15;
        
    } 
    else if (ahr999 > 0.46 && ahr999 <= 1.2) {
        buyAmount = (13.88/usdtCny).toFixed(4);
        interval = 30;
    }
    else {
        buyAmount = (6.49/usdtCny).toFixed(4);
        interval = 60;
    }

    cmd = `*/${interval} * * * * cd /home/rockhawk/Code/mixin/hawkassist; node mixswap.js ${buyAmount} >> mixswap.log &`
    // console.log(cmd);
    shell.exec(`echo "${cmd}" > cron.mixswap`);
    shell.exec("crontab cron.mixswap");
    shell.exec("crontab -l");
}


main();

// Usage: buying token with usdt then transfer back to user_id's wallet
//      node buy.js b7366a96-afd9-4b1c-bb74-9084196959d3 xin 100 
// amount: required
// token Symbol: option, default is btc
// userId: option, default is rock21834
// it will buy xin with 100 usdt then transfer back to userId.

const axios = require("axios");
const db = require("./dbFunctions");
const mixin = require("./mixinFunctions");


const mixswapApiPoint = "https://mixswap.exchange/api/v1";
const mixswapUserId = "6a4a121d-9673-4a7e-a93e-cb9ca4bb83a2";
const myUserId = "b7366a96-afd9-4b1c-bb74-9084196959d3";  //Rock 21834
const assetIdBtc = "c6d0c728-2624-429b-8e0d-d9d19b6592fa";
// const assetIdCnb = "965e5c6e-434c-3fa9-b780-c50f43cd955c";  //cnb for test
const assetIdUsdt = "4d8c508b-91c5-375b-92b0-ee702ed2dac5";
// const assetIdPusd = "31d2ea9c-95eb-3355-b65b-ba096853bc18";


//set default parameters
let userId = myUserId;
let buyAssetSymbol = "BTC";
let buyAmount = 0.001;
let payAssetId = assetIdUsdt;
let waitTime = 6000; // ms
let waitRound = 50;

//get user id from cmd line
if (process.argv[2]) {
    userId = process.argv[2];
}
//get token symbol from cmd line
if (process.argv[3]) {
    buyAssetSymbol = process.argv[3].toUpperCase();
}
//get pay cost from cmd line
if (process.argv[4]) {
    buyAmount = process.argv[4];
}


// await sleep(ms)
function sleep(ms) {
    return new Promise(resolve=>{
        console.log("sleep",ms);
        setTimeout(resolve, ms);
    })
}


async function getMixswapOrderStatus(traceId) {
    orderStatus = "";
    let r = "";
    for (let i = 0; i < waitRound; i++) {
        await sleep(waitTime);
        // console.log(`${mixswapApiPoint}/order/${traceId}`);
        try {
            r = await axios.get(`${mixswapApiPoint}/order/${traceId}`);
            r = r.data;
        } catch (error) {
            console.log(Date());
            console.log(error);
        }

        if (r.success === true) {
            orderStatus = r.data.orderStatus;
            console.log(orderStatus);
        }
        
        if (orderStatus == "done") {
            console.log(Date());
            console.log(r);
            return r.data.receiveAmount;
        }
    }
    return false;
}


async function checkPayBalance(userId, cost) {
    const payAssetSymbol = "USDT";
    const payAssetId = "4d8c508b-91c5-375b-92b0-ee702ed2dac5";
    const payAssetChainId = "43d61dcd-e413-450d-80b8-101d5e903357";  // ETH USDT
    let balance = 0;
    
    const assets = await mixin.getUserWalletAssets(userId);
    assets.forEach(asset => {
        if (asset.symbol == payAssetSymbol
            && asset.asset_id == payAssetId
            && asset.chain_id == payAssetChainId) {
            balance = asset.balance;
        }
    });

    return balance < cost ? false : true;
}


async function main() {

    if (await checkPayBalance(userId, buyAmount)) {
        const userConfig = await db.getUserConfig(userId);
        const {BlazeClient} = require("mixin-node-sdk");
        const clientUser = new BlazeClient(userConfig, {parse: true, syncAck: true});

        let buyAssetId = await mixin.searchAssetIdByToken(buyAssetSymbol);
        const buyMemo = Buffer.from(`0|${buyAssetId}`).toString("base64");
        const buyTraceId = mixin.client.newUUID();

        const buyTransInfo = {
            asset_id: payAssetId,
            opponent_id: mixswapUserId,
            amount: buyAmount,
            trace_id: buyTraceId,
            memo: buyMemo,
        }

        // transfer usdt to mixswap for buying
        clientUser.transfer(buyTransInfo, mixin.mixinAppConfig.user_pin).then(async r=>{
            console.log(Date());
            console.log(r);
            const receiveAmount = await getMixswapOrderStatus(buyTraceId);

            //transfer back to user
            if (receiveAmount) {
                const transBackMemo = `${buyAmount}USDT with Mixswap`
                const transBackTraceId = mixin.client.newUUID();
                backTransInfo = {
                    asset_id: buyAssetId,
                    opponent_id: userId,
                    amount: receiveAmount,
                    // amount: "100",
                    trace_id: transBackTraceId,
                    memo: transBackMemo,
                }
                console.log(Date());
                console.log(backTransInfo);

                for (let i = 0; i < waitRound; i++) {
                    await sleep(waitTime);
                    let r = await clientUser.transfer(backTransInfo, mixin.mixinAppConfig.user_pin);
                    if (r.amount) {
                        console.log(Date());
                        console.log("transfer back done.");
                        break;
                    }
                }
            }
        });

        if (!checkPayBalance(userId, buyAmount)) {
            mixin.noticeInsufficient(userId);
            mixin.client.sendTextMsg(userId, `已完成本次${buyAssetSymbol}购买，不足以完成下次购买`);
        }
    }
    //insufficient balance
    else{
        mixin.noticeInsufficient(userId);
        mixin.client.sendTextMsg(userId, `未能完成本次${buyAssetSymbol}购买`);
    }
}


main();

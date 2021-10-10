// Usage: buying btc in mixswap with 100.123 usdt then transfer back to rock21834
//   node mixswap.js 100.123
// it will check balance automatically.

const axios = require("axios");
const {BlazeClient} = require("mixin-node-sdk");
const mixinAppConfig = require("./mixinConfig");

const client = new BlazeClient(mixinAppConfig, {parse: true, syncAck: true})


const myUserId = "b7366a96-afd9-4b1c-bb74-9084196959d3";  //Rock 21834
const mixswapApiPoint = "https://mixswap.exchange/api/v1";
const mixswapUserId = "6a4a121d-9673-4a7e-a93e-cb9ca4bb83a2";
const assetIdBtc = "c6d0c728-2624-429b-8e0d-d9d19b6592fa";
// const assetIdBtc = "965e5c6e-434c-3fa9-b780-c50f43cd955c";  //cnb for test

const assetIdUsdt = "4d8c508b-91c5-375b-92b0-ee702ed2dac5";
const buyAmount = process.argv[2];  // get amount argument from cmd line
const buyMemo = Buffer.from(`0|${assetIdBtc}`).toString("base64");
const buyTraceId = client.newUUID();
const waitTime = 6000; // ms


// await sleep(ms)
function sleep(ms) {
    return new Promise(resolve=>{
        console.log("sleep",ms);
        setTimeout(resolve, ms);
    })
}


async function checkBalance(assetId, amount) {
    let balance = await client.readAsset(assetId);
    balance = balance.balance;
    console.log(Date());
    console.log(`${assetId} balance ${balance}`);
    if (balance >= amount) {
        return true;
    } else {
        return false;
    }
}


async function getMixswapOrderStatus(traceId) {
    orderStatus = "";
    let r = "";
    for (let i = 0; i < 15; i++) {
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


const buyTransInfo = {
    asset_id: assetIdUsdt,
    opponent_id: mixswapUserId,
    amount: buyAmount,
    trace_id: buyTraceId,
    memo: buyMemo,
}


async function main() {
    if (await checkBalance(assetIdUsdt, buyAmount)) {
        // transfer usdt to mixswap for buying btc
        client.transfer(buyTransInfo).then(async r=>{
            console.log(Date());
            console.log(r);
            receiveAmount = await getMixswapOrderStatus(r.trace_id);
            if (receiveAmount) {
                const transBackMemo = `${buyAmount}USDT with Mixswap`
                backTransInfo = {
                    asset_id: assetIdBtc,
                    opponent_id: myUserId,
                    amount: receiveAmount,
                    trace_id: client.newUUID(),
                    memo: transBackMemo,
                }
                console.log(Date());
                console.log(backTransInfo);
                client.transfer(backTransInfo).then(r=>{
                    console.log(Date());
                    console.log(r);
                })
            }
        });
    }
    else{
        client.sendTextMsg(myUserId, "️️️️️⚠️Insufficient balance, please deposit USDT.");
    }
}


main();

const mixinAppConfig = {
    //...
    };
const mixinApiDomain = "https://mixin-api.zeromesh.net";
const mixswapApiDomain = "https://mixswap.exchange/api/v1";

const axios = require("axios");
const {BlazeClient} = require("mixin-node-sdk");
const client = new BlazeClient(mixinAppConfig, {parse: true, syncAck: true});


async function searchAssetByToken(token) {
    const api = `${mixinApiDomain}/network/assets/search/${token}`;
    const r = await axios.get(api);
    const assetInfo = r.data;
    // console.log(assetInfo);
    //just take the 1st element of assetInfo list, keep an eye on USDT's multi-chain!
    const assetId = assetInfo.data[0].asset_id;
    return assetId;
}


async function readMixswapOrderStatus(userId, traceId) {
    const mixswapOrderStatusApi = `${mixswapApiDomain}/order/${traceId}`;
    // console.log("mixswapOrderStatusApi:", mixswapOrderStatusApi);

    //slow down loop
    const sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const msInterval = 2000;
    const minTimeout = 5;

    for (let i = 0; i <= minTimeout*60/2; i++) {
        let orderStatusReply;     
        await sleep(msInterval);

        if (i == minTimeout*60/2) {
            client.sendTextMsg(userId, 
                `❌A swap order failed after ${minTimeout}mins,
open @7000103767 chat to check reply message.`);
        }
   
        try {
            orderStatusReply = await axios.get(mixswapOrderStatusApi);
        } catch (error) {
            // console.log("403");
            continue;
        }
        
        if (orderStatusReply.data.data.orderStatus === "done") {
            // console.log(orderStatusReply.data.data.orderStatus);
            const payAmount = orderStatusReply.data.data.payAmount;
            // console.log("payAssetUuid", orderStatusReply.data.data.payAssetUuid);
            let r = await client.readAsset(orderStatusReply.data.data.payAssetUuid);
            let payAssetSymbol = r.symbol;
            const receiveAmount = orderStatusReply.data.data.receiveAmount;
            // console.log("receiveAssetUuid", orderStatusReply.data.data.receiveAssetUuid);
            r = await client.readAsset(orderStatusReply.data.data.receiveAssetUuid);
            let receiveAssetSymbol = r.symbol;
            const tradePrice = orderStatusReply.data.data.tradePrice;

            client.sendTextMsg(userId, `✅Swap done:
💰Paid: ${payAmount} ${payAssetSymbol}
💧Got: ${receiveAmount} ${receiveAssetSymbol}

📈Price: 
1 ${payAssetSymbol} = ${1/parseFloat(tradePrice)} ${receiveAssetSymbol}
1 ${receiveAssetSymbol} = ${tradePrice} ${payAssetSymbol}`);
            return;
        }
    }
}
// client.readAsset("f5ef6b5d-cc5a-3d90-b2c0-a2fd386e7a3c").then(r => {console.log(r.symbol)});


async function sendMixSwapButton(userId, message) {
    //message: "buy 10 usdt xin"
    const mixSwapId = "6a4a121d-9673-4a7e-a93e-cb9ca4bb83a2";
    const words = message.split(" ");
    const assetIdPay = await searchAssetByToken(words[2].toUpperCase());
    const assetIdBuy = await searchAssetByToken(words[3].toUpperCase());
    const memo = Buffer.from(`0|${assetIdBuy}`).toString("base64");
    const amount = words[1];
    const traceId = client.newUUID();

    const mixinPayUrl = 
        `mixin://pay?recipient=${mixSwapId}&asset=${assetIdPay}&amount=${amount}&memo=${memo}&trace=${traceId}`;
    await client.sendAppButtonMsg(userId,
        [{
            label: `Check your bill: ${amount} ${words[2].toUpperCase()}`,
            color: "#7FFF00",
            action: mixinPayUrl,
        }]);
    // client.sendTextMsg(userId, "Please check @7000103767 reply message.");
    
    readMixswapOrderStatus(userId, traceId);
}


async function sendAssetBack(transferBody) {
    const senderId = transferBody.data.opponent_id;
    const assetId = transferBody.data.asset_id;
    const assetAmount = transferBody.data.amount;
    const assetInfo = await client.readAsset(assetId);
    const assetName = assetInfo.symbol;
    const trans = await client.transfer(
        {
            asset_id: assetId,
            opponent_id: senderId,
            amount: assetAmount,
            trace_id: client.newUUID(),
            memo: `Refund退款${assetName}:${assetAmount}`,
        }
    );
    // console.log('TRANSACTION---> ', trans);
    if (trans.trace_id) {
        client.sendTextMsg(senderId, `Received asset ${assetAmount} ${assetName} and refunded.`);
    } else {
        client.sendTextMsg(senderId, `Refund failed.\n ${trans.description}`);
    }
}


client.loopBlaze({
    async onMessage(message) {
        if (message.type != "message"
            || !message.category
            || message.source != "CREATE_MESSAGE") {
            return;
        }

        console.log(message);
        const senderId = message.user_id;
        
        //buy action
        if (message.category === "PLAIN_TEXT"
            && message.data.substring(0, 4).toLowerCase() === "buy ") {
            await sendMixSwapButton(message.user_id, message.data);
        }
        //help message
        else if(message.category === "PLAIN_TEXT"
            && ["?", "help", "h", "？"].includes(message.data)) {
            client.sendTextMsg(senderId, 
                `Usage:
  1. "buy n A B", instance: "buy 10 usdt xin";
  2. ...`)
        }

    },

    async onTransfer(message) {
        if (parseFloat(message.data.amount) > 0) {
            // await sendAssetBack(message);
        }
    },
});
   

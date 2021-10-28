const axios = require("axios");
const {BlazeClient} = require("mixin-node-sdk");
const mixinAppConfig = require("./mixinConfig");
const client = new BlazeClient(mixinAppConfig, {parse: true, syncAck: true})
const db = require("./dbFunctions");


const mixinApiDomain = "https://mixin-api.zeromesh.net";


async function createNewUser(userName) {
    const PIN = mixinAppConfig.user_pin;
    let userConfig = await client.createUser(userName);
    userConfig.client_id = userConfig.user_id; // there is no client_id in createUser return
    let clientUser = new BlazeClient(userConfig, {parse: true, syncAck: true});
    await clientUser.modifyPin(PIN, "");
    // console.log(await clientUser.userMe());
    return userConfig;
}


async function getUserWalletAssets(userId) {
    let userConfig = await db.getUserConfig(userId);
    const clientUser = new BlazeClient(userConfig, {parse: true, syncAck: true});
    return await clientUser.readAssets();
}


async function sendUserDepositButton(userId) {
    const userWalletId = await db.getUserWalletAddress(userId);
    const mixinPayUrl = `mixin://transfer/${userWalletId}`;

    await client.sendAppButtonMsg(userId,
        [{
            label: `充值`,
            color: "#7FFF00",
            action: mixinPayUrl,
        }]
    );
}


async function searchAssetIdByToken(token) {
    const api = `${mixinApiDomain}/network/assets/search/${token}`;
    const r = await axios.get(api);
    const assetInfo = r.data;
    // console.log(assetInfo);
    //just take the 1st element of assetInfo list, keep an eye on USDT's multi-chain!
    const assetId = assetInfo.data[0].asset_id;
    return assetId;
}


async function sendUserHelp(userId) {
    const helpMsg = 
`
## HawkAssist - 定投助手使用说明

### 创建：
在HawkAssist服务中创建一个新账号，然后开始充值和定投。

### 充值：
为用户的HawkAssist账号充值，账号余额不足无法续投。

### 定投：
Ahr999指标确定的三个行情区间：底部、中部、顶部。HawkAssist将自动判断当前行情处于哪个区间，并且自动为用户执行买入。
用户只需要设置好每个月的定投金额即可。

例如：
- 你想在价格处于低谷时，每月花30刀进行抄底，
- 行情一般时，每月花个20刀，
- 价格很高时，每月只花他10刀就够了，留着抄底。
那么你只要向HawkAssist发送下面这一行指令，然后及时充值，其他的事情HawkAssist都替你自动完成了。
这样的策略比传统无脑定投的资金利用率更高，同时也能确保你的币数量在任何行情中都是不断增加的，才能在牛市来时绝不踏空。

定投指令：
## **\`定投BTC 30 20 10\`**

### 其含义为：
- 定投目标是BTC；
- 行情处于 *底部区间* 时，每月投入 30 USDT；
- 行情处于 *中部区间* 时，每月投入 20 USDT；
- 行情处于 *顶部区间* 时，每月投入 10 USDT；
- HawkAssist将拆分成 *每小时* 去Mixswap执行买入；
- 余额不足以完成本次定投时，会提醒用户充值。

### 定投指令的注意事项：
- 指令中间有 *空格*，即：
    \`定投BTC<空格>30<空格>20<空格>10<发送>\`
- 定投目标可以是 *MixSwap* 里的币种，比如ETH/XIN/EOS/BOX...；
- 金额指的是 *月* 投入，例如30就代表 *1个月投入30 USDT进行定投*；
- 充值目前只支持 *USDT*；
- 再次输入定投BTC的指令，就会覆盖之前的设定；
- 取消定投的指令是 \`取消定投BTC\` 。
`

    const userWalletId = await db.getUserWalletAddress(userId);
    const mixinPayUrl = `mixin://transfer/${userWalletId}`;
    
    const helpButtons_1 = [
        {
            "label": "Ahr999指标",
            "color": "#7FFF00",
            "action": "input:ahr"
        },
    ]

    const helpButtons_2 = [
        {
            "label": "创建",
            "color": "#7FFF00",
            "action": "input:创建"
        },
        {
            "label": "充值",
            "color": "#7FFF00",
            "action": `${mixinPayUrl}`
        },
        {
            "label": "余额",
            "color": "#7FFF00",
            "action": "input:余额"
        },
        {
            "label": "提取",
            "color": "#7FFF00",
            "action": "input:提取"
        },
    ]

    const helpButtons_3 = [
        {
            "label": "定投BTC 30 20 10",
            "color": "#7FFF00",
            "action": "input:定投BTC 30 20 10"
        },
        {
            "label": "我的定投",
            "color": "#7FFF00",
            "action": "input:我的定投"
        },
        {
            "label": "取消定投BTC",
            "color": "#7FFF00",
            "action": "input:取消定投BTC"
        },
        {
            "label": "取消全部定投",
            "color": "#7FFF00",
            "action": "input:取消定投"
        },
    ]

    await client.sendPostMsg(userId, helpMsg);
    await client.sendAppButtonMsg(userId, helpButtons_1);
    await client.sendAppButtonMsg(userId, helpButtons_2);
    await client.sendAppButtonMsg(userId, helpButtons_3);
}


async function noticeInsufficient(userId) {
    const msg = `您的余额不足，请充值`;
    await client.sendTextMsg(userId, msg);
    sendUserDepositButton(userId);
}


async function userWithdraw(userId) {
    let userConfig = await db.getUserConfig(userId);
    const clientUser = new BlazeClient(userConfig, {parse: true, syncAck: true});
    const assets = await clientUser.readAssets();
    assets.forEach(asset => {
        transInfo = {
            asset_id: asset.asset_id,
            opponent_id: userId,
            amount: asset.balance,
            trace_id: client.newUUID(),
            memo: `Withdraw from HawkAssist.`,
        }
        clientUser.transfer(transInfo, mixinAppConfig.user_pin);
        console.log(`user ${userConfig.userName} withdraw: ${asset.symbol} ${asset.balance}`);
    });
}


module.exports = {
    mixinAppConfig,
    client,
    createNewUser,
    getUserWalletAssets,
    sendUserDepositButton,
    searchAssetIdByToken,
    sendUserHelp,
    noticeInsufficient,
    userWithdraw,
}

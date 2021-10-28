const db = require("./src/dbFunctions");
const mixin = require("./src/mixinFunctions");
const ahr = require("./src/ahr999");


//msg "/new"
async function handleNewUser(msg) {
    let userId = msg.user_id;
    if (await db.userExisted(userId)) {
        mixin.client.sendTextMsg(userId, "用户已经存在");
        console.log("user existed when created new user.");
    }
    else {
        let userInfo = await mixin.client.readUser(userId);
        const userName = `hawkassist_${userInfo.full_name}`;
        let userConfig = await mixin.createNewUser(userName);
        await db.saveUserToDb(userId, userConfig);
        await mixin.client.sendTextMsg(userId, "用户创建成功，可以充值和定投了");
        console.log(`created a new user: ${userName}`);
        
        // mixin.sendUserHelp(userId);
    }
}


//msg "/deposit"
async function handleDeposit(msg) {
    const userId = msg.user_id;
    const userWalletId = await db.getUserWalletAddress(userId);
    const mixinPayUrl = `mixin://transfer/${userWalletId}`;

    button = [{
        label: `充值`,
        color: "#7FFF00",
        action: `${mixinPayUrl}`,
    }]

    mixin.client.sendPostMsg(userId, button);
}


//msg "/balance"
async function handleBalance(msg) {
    const userId = msg.user_id;
    let assets = await mixin.getUserWalletAssets(userId);

    let asset_msg = `
## 我的余额
|币种 | 余额|
|:--:|:--:|`;
    assets.forEach(a => {
        asset_msg += `
|${a.symbol}|${a.balance}`;
    });

    mixin.client.sendPostMsg(userId, asset_msg);
}


//msg "定投xxx"
async function handleInvest(msg) {
    const userId = msg.user_id;
    const reg = /^定投([a-z]+)[\s]+([0-9]+)[\s]+([0-9]+)[\s]+([0-9]+)$/gi;
    if (reg.test(msg.data)) {
        const tokenSymbol = RegExp.$1.toUpperCase();
        const costs = [parseFloat(RegExp.$2), parseFloat(RegExp.$3), parseFloat(RegExp.$4)];

        if(await db.saveUserInvestToDB(userId, tokenSymbol, costs)) {
            await mixin.client.sendTextMsg(userId, "定投设置成功");
            mixin.client.sendAppButtonMsg(userId, [
                {
                    label: `我的定投`,
                    color: "#7FFF00",
                    action: `input:/myinvest`,
                },
            ])
        } else {
            mixin.client.sendTextMsg(userId, "定投设置失败");
        }
    } else {
        await mixin.client.sendTextMsg(userId,
            "指令格式错误。正确格式：\n定投BTC<空格>300<空格>200<空格>100<发送>");
    }
}


//msg "/myinvest"
async function handleCheckInvest(msg) {
    const userId = msg.user_id;
    const invests = await db.getUserInvest(userId);
    if (invests.length == 0) {
        mixin.client.sendTextMsg(userId, "没有你的定投配置");
    } 
    else {
        let investInfo = `## 我的定投
|定投标的|底部区间  |中部区间  |顶部区间  |
|:-----:|:------:|:-------:|:------:|`;
        invests.forEach(invest => {
            costs = JSON.parse(invest.amounts);
            investInfo += `
|${invest.tokenSymbol}|$${costs[0]}/月|$${costs[1]}/月|$${costs[2]}/月|`
        })

        mixin.client.sendPostMsg(userId, investInfo);
    }
}


//msg "取消定投xxx"
async function handleDeleteInvest(msg) {
    const userId = msg.user_id;
    const reg = /^取消定投([a-z]*)$/gi;  //"取消定投"可以删除所有定投
    if (reg.test(msg.data)) {
        const tokenSymbol = RegExp.$1.toUpperCase();

        if(await db.deleteUserInvest(userId, tokenSymbol)) {
            await mixin.client.sendTextMsg(userId, `已经取消${tokenSymbol.toUpperCase()}定投`);
            mixin.client.sendAppButtonMsg(userId, [
                {
                    label: `我的定投`,
                    color: "#7FFF00",
                    action: `input:/myinvest`,
                },
            ])
        } else {
            mixin.client.sendTextMsg(userId, "取消定投失败");
        }
    } else {
        await mixin.client.sendTextMsg(userId,
            "指令格式错误。正确格式：\n取消定投BTC<发送>");
    }
}


//msg "/withdraw"
async function handleWithdraw(msg) {
    const userId = msg.user_id;
    await mixin.userWithdraw(userId);
    mixin.client.sendTextMsg(userId, `提取完成，可以去钱包查看`);
}


//msg "/ahr"
async function handleAhr(msg) {
    const userId = msg.user_id;
    const ahr999 = await ahr.getAhr999();
    const ahr999x = await ahr.getAhr999x();
    ahrInfo = `
## Ahr999指标简要说明
|指标   |当前值|
|:----:|:---:|
|Ahr999|${ahr999}|
|Ahr999x|${ahr999x}|

- Ahr999指标：
    - 小于0.45，处于底部区间，此区间可加大定投并抄底，
    - 0.45~1.2，处于正常区间，此区间可持续定投，
    - 大于1.2，处于高位区间，此区间可减小投入，坐等起飞。
- Ahr999x指标：
    - 处于0.45附近时，可考虑逃顶。基于历史上几次BTC的顶部，该指标均正确。`
    
    mixin.client.sendPostMsg(userId, ahrInfo);
}


mixin.client.loopBlaze({
    async onMessage(msg) {
        //unrelated messages
        if (msg.type != "message"
            || msg.category.search("PLAIN") == -1
            || msg.source != "CREATE_MESSAGE"
            || msg.user_id == "6a4a121d-9673-4a7e-a93e-cb9ca4bb83a2"
            || typeof msg.data == "number") {
            return;
        }

        //return balance
        if (msg.data == "/new"
            || msg.data == "创建") {
            handleNewUser(msg);
        }

        else if (msg.data == "/deposit"
            || msg.data == "充值") {
            handleDeposit(msg);
        }

        else if (msg.data == "/balance"
            || msg.data == "余额") {
            handleBalance(msg);
        }

        else if (msg.category == "PLAIN_TEXT"
            && msg.data.search(/^定投*/g) != -1) {
            handleInvest(msg);
        }

        else if (msg.data == "/myinvest"
            || msg.data == "我的定投") {
            handleCheckInvest(msg);
        }

        else if (msg.category == "PLAIN_TEXT"
            && msg.data.search(/^取消定投*/g) != -1) {
            handleDeleteInvest(msg);
        }

        else if (msg.data == "/withdraw"
            || msg.data == "提取") {
            handleWithdraw(msg);
        }

        else if (msg.data == "/ahr"
            || msg.data == "ahr") {
            handleAhr(msg);
        }

        else if (msg.data == "/getallinvests") {
            mixin.client.sendTextMsg(msg.user_id, await db.getAllInvests());
        }

        else if (msg.data == "/getallusers") {
            mixin.client.sendTextMsg(msg.user_id, await db.getAllUsers());
        }

        else {
            console.log(msg.data);
            console.log("do nothing...");
            await mixin.client.sendTextMsg(msg.user_id, "请看看帮助吧");
            mixin.sendUserHelp(msg.user_id);
        }
    },
});

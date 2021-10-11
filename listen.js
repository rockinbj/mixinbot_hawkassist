const {BlazeClient} = require("mixin-node-sdk");
const mixinAppConfig = require("./mixinConfig");
const {getAhr999, getAhr999x} = require("./ahr999");

const client = new BlazeClient(mixinAppConfig, {parse: true, syncAck: true});


client.loopBlaze({
    async onMessage(msg) {
        //unrelated messages
        if (msg.type != "message"
            || !msg.category
            || msg.source != "CREATE_MESSAGE") {
            return;
        }

        console.log(msg);
        a9 = await getAhr999();
        a9x = await getAhr999x();
        replyMsg = `Ahr999: ${a9}\nAhr999x: ${a9x}`;

        client.sendTextMsg(msg.user_id, replyMsg);
    },
  });
const {BlazeClient} = require("mixin-node-sdk");
const mixinAppConfig = require("./mixinConfig");
const {getAhr999, getAhr999x} = require("./ahr999");

const client = new BlazeClient(mixinAppConfig, {parse: true, syncAck: true});

const helpMessage = "a9: get ahr999\n\
a9x: get ahr999x"



client.loopBlaze({
    onMessage(msg) {
        console.log(msg);

        if (msg.data == "a9") {
            getAhr999().then(r=>{
                client.sendTextMsg(msg.user_id, r);
            })
        }
        else if (msg.data == "a9x") {
            getAhr999x().then(r=>{
                client.sendTextMsg(msg.user_id, r);
            })
        }
        else {
            client.sendTextMsg(msg.user_id, helpMessage);
        }
    },
  });
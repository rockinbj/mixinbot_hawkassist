const conf = require('@tsmx/secure-config')();


let mixinAppConfig = {
    "pin": conf.client.pin,
    "client_id": conf.client.client_id,
    "session_id": conf.client.session_id,
    "session_secret": conf.client.session_secret,
    "pin_token": conf.client.pin_token,
    "private_key": conf.client.private_key,
    "user_pin": conf.clientUser.pin,
}


module.exports = mixinAppConfig;

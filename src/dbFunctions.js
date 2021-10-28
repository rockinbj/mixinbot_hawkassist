const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/hawkassist.db");


async function getAllUsers() {
    const sqlcmd = `SELECT * FROM user;`;
    return new Promise((res, rej)=>{
        db.all(sqlcmd, (err, rows)=>{
            err ? rej(err) : res(rows);
        })
    })
}


function getAllInvests() {
    sqlcmd = `SELECT * FROM invest;`;
    return new Promise((res, rej)=>{
        db.all(sqlcmd, (err, rows)=>{
            err ? rej(err) : res(rows);
        })
    })
}


function getUserInvest(userId) {
    const sqlcmd = `SELECT * FROM invest WHERE userId = '${userId}';`;
    return new Promise((res, rej)=>{
        db.all(sqlcmd, (err, rows)=>{
            err ? rej(err) : res(rows);
        })
    })
}


function getUserConfig(userId) {
    const sqlcmd = `SELECT userConfig FROM user WHERE userId = '${userId}' LIMIT 1`;
    return new Promise((res, rej)=>{
        db.all(sqlcmd, (err, rows)=>{
            if (err) {
                rej(err);
            }
            let _json = JSON.parse(rows[0].userConfig);
            res(_json);
        })
    })
}


function getUserWalletAddress(userId) {
    const sqlcmd = `SELECT userConfig FROM user WHERE userId = '${userId}' LIMIT 1`;
    return new Promise((res, rej)=>{
        db.all(sqlcmd, (err, rows)=>{
            if (err) {
                rej(err);
            }
            else if (rows.length == 0) {
                res(false);
            }
            else {
                let _json = JSON.parse(rows[0].userConfig);
                res(_json.client_id);
            }
        })
    })
}


function saveUserToDb(userId, userConfig) {
    userConfigString = JSON.stringify(userConfig);
    const sqlcmd = `INSERT INTO user (userId, userConfig, regTime) VALUES ('${userId}', '${userConfigString}', CURRENT_TIMESTAMP);`

    return new Promise((res, rej)=>{
        db.run(sqlcmd, err=>{
            err ? rej(err) : res(true);
        })
    })
}


async function saveUserInvestToDB(userId, tokenSymbol, costs) {
    
    if (await userExisted(userId) == false) {
        let url = `input:/new`;
        await client.sendTextMsg(userId, "还没有创建账号吧，请先创建");
        client.sendAppButtonMsg(userId, [
            {
                label: `创建`,
                color: "#7FFF00",
                action: url,
            }
        ])
        console.log("user does not existed when save invest to db");
        return false;
    }

    let costsStr = JSON.stringify(costs);
    const sqlcmd_select = `SELECT * From invest WHERE userId = '${userId}' AND tokenSymbol = '${tokenSymbol}';`;
    // let tokenId = await searchAssetIdByToken(tokenSymbol);
    
    return new Promise((res, rej)=>{
        db.all(sqlcmd_select, (err, rows)=>{
            if (err) rej(err);
            console.log(rows);
            
            if (rows.length == 0) {
                console.log("save invest to db: no record before");
                //no record before
                sqlcmd_insert = `INSERT INTO invest (userId, tokenSymbol, amounts) VALUES ('${userId}', '${tokenSymbol}', '${costsStr}');`;
    
                db.run(sqlcmd_insert, (err)=>{
                    if (err) rej(err);
                    console.log("insert new invest record.");
                    res(true);
                });
            } else {
                console.log("save invest to db: found record before");
                //update record
                sqlcmd_update = `UPDATE invest SET amounts = '${costsStr}' WHERE userId = '${userId}' AND tokenSymbol = '${tokenSymbol}';`;

                db.run(sqlcmd_update, (err)=>{
                    if (err) rej(err);
                    console.log("updated invest record.");
                    res(true);
                });
            }
        });
    })
}


function userExisted(userId) {
    const sqlcmd = `SELECT * FROM user WHERE userId = '${userId}'`;
    return new Promise((res, rej)=>{
        db.all(sqlcmd, (err, rows)=>{
            rows.length ? res(true) : res(false);
        });
    })
}


async function deleteUserInvest(userId, tokenSymbol) {
    let sqlToken = "";
    if (tokenSymbol) {
        sqlToken = ` AND tokenSymbol = '${tokenSymbol}'`;
    }

    const sqlcmd = `DELETE FROM invest WHERE userId = '${userId}'` + sqlToken;
    return new Promise((res)=>{
        db.run(sqlcmd, err=>{
            if (err) {
                console.log("delete user invest failed:", err);
                res(false);
            } else {
                console.log("deleted user invest");
                res(true);
            }
        });
    })
}


module.exports = {
    getAllUsers,
    getAllInvests,
    getUserInvest,
    getUserConfig,
    getUserWalletAddress,
    saveUserToDb,
    saveUserInvestToDB,
    userExisted,
    deleteUserInvest,
}

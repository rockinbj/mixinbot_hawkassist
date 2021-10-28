const request = require("superagent");
const cheerio = require("cheerio");

const urlAhr999 = "https://btctom.com/dash/ahr999";
const urlAhr999x = "https://btctom.com/dash/ahr999x";


function getAhr999() {
    return new Promise((promiesBingo, promiseErr)=>{
        let ahr999 = "";
        request
            .get(urlAhr999)
            .end((err, res)=>{
                if (err) {
                    console.log("ERR:", err);
                    promiseErr(err);
                }

                // console.log(res.text);
                let $ = cheerio.load(res.text);
                ahr999 = $("#ahr999").text();
                // console.log(ahr999);
                promiesBingo(ahr999);
            })
    })
}


function getAhr999x() {
    return new Promise((promiesBingo, promiseErr)=>{
        let ahr999x = "";
        request
            .get(urlAhr999x)
            .end((err, res)=>{
                if (err) {
                    console.log("ERR:", err);
                    promiseErr(err);
                }

                // console.log(res.text);
                let $ = cheerio.load(res.text);
                ahr999x = $("#ahr999x").text();
                // console.log(ahr999x);
                promiesBingo(ahr999x);
            })
    })
}


module.exports = {
    getAhr999,
    getAhr999x
}

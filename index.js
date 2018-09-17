var http = require("https");
var cheerio = require("cheerio");
var fs = require("fs-extra");
var xlsx = require("node-xlsx");

var citys = ["beicai", "biyun","caolu","chuansha","datuanzhen","geqing","gaohang","gaodong","huamu","hangtou","huinan",
"jinqiao","jinyang","kangqiao","lujiazui","laogangzhen","lingangxincheng","lianyang","nichengzhen","nanmatou","sanlin",
"shibo","shuyuanzhen","tangqiao","tangzhen","waigaoqiao","wanxiangzhen","weifang","xuanqiao","xinchang","yuqiao1","yangdong",
"yuanshen","yangjing","zhangjiang","zhuqiao","zhoupu"];
var index = 0;
var sheetDataMap = {};

var cityName = "chunshen";
var outFileName = "result"
var maxPage = 100;

var baseUrl = "https://sh.lianjia.com/ershoufang/";
var page = 1;
var dataList = [];

function doRepitle() {
    dataList = [];
    page = 1;
    cityName = citys[index];
    console.log('开始爬%s'.replace("%s", cityName));
    reqHttp();
}

function getUrl() {
    if (page == 1) return baseUrl + cityName + "/rs/";
    else return baseUrl + cityName + "/pg" + page + "/"
}

function reqHttp() {
    console.log('开始爬第%s页'.replace("%s", page));
    http.get(getUrl(), function (res) {
        var html = '';
        res.on('data', function (data) {
            html += data;
        });
        res.on('end', function () {
            dataList = dataList.concat(filterData(html));
            if (page >= maxPage) {
                collectData();
                return;
            }
            setTimeout(() => {
                page++;
                reqHttp();
            }, 100)
        });
    }).on('error', function () {
        collectData();
    });
}

function filterData(html) {
    var $ = cheerio.load(html);
    var temp = [];

    $('.sellListContent li').each(function () {
        let info = $(this).find("div");
        var data = {};

        data.title = info.find(".title").find("a").text();
        let params = info.find(".address").find(".houseInfo").text().split("|");
        for (let i = 0, len = params.length; i < len; i++) {
            data["param" + i] = params[i];
        }
        data.flood = info.find(".flood").find(".positionInfo").text();
        data.address = info.find(".flood").find(".positionInfo").find("a").text();
        data.followInfo = info.find(".followInfo").text();
        data.totalPrice = info.find(".priceInfo").find(".totalPrice span").text() + "万";
        data.unitPrice = info.find(".priceInfo").find(".unitPrice span").text();

        temp.push(data);
    })
    return temp;
}

function collectData() {
    var data = [];
    let dat = dataList[0];
    let keys = data[0] = [];
    keys.push("id");
    for (let key in dat) {
        keys.push(key);
    }
    for (let i = 0, len = dataList.length; i < len; i++) {
        let temp = data[i + 1] = [];
        dat = dataList[i];
        temp.push(i + 1);
        for (let j = 0, len = keys.length; j < len; j++) {
            let key = keys[j];
            if (key != "id") temp.push(dat[key]);
        }
    }
    sheetDataMap[cityName] = data;

    index++;
    if (index >= citys.length) {
        saveData();
    } else {
        doRepitle();
    }
}

function saveData() {
    let obj = [];
    let filePath = './' + outFileName + ".xlsx";
    for (let key in sheetDataMap) {
        obj.push({ "name": key, "data": sheetDataMap[key] });
    }
    var buffer = xlsx.build(obj);
    fs.writeFile(filePath, buffer, function (err) {
        if (err) throw err;
        console.log(' finished');
    });

    // fs.outputFileSync("source.json", JSON.stringify(sourceObj));
}

module.exports = doRepitle;

if (require.main == module) {
    doRepitle();
}



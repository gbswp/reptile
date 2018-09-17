var http = require("https");
var cheerio = require("cheerio");
var fs = require("fs-extra");
var xlsx = require("node-xlsx");

var outSheetName = "chunshen";
var outFileName = "result"
var maxPage = 10;

var baseUrl = "https://sh.lianjia.com/ershoufang/";
var index = 1;
var dataList = [];

function getUrl() {
    if (index == 1) return baseUrl + outSheetName + "/rs/";
    else return baseUrl + outSheetName + "/pg" + index + "/"
}

function reqHttp() {
    console.log('开始爬第%s页'.replace("%s", index));
    http.get(getUrl(), function (res) {
        var html = '';
        res.on('data', function (data) {
            html += data;
        });
        res.on('end', function () {
            dataList = dataList.concat(filterData(html));
            if (index >= maxPage) {
                // fs.outputFileSync("source.json", JSON.stringify(dataList));
                saveData();
                return;
            }
            setTimeout(() => {
                index++;
                reqHttp();
            }, 100)
        });
    }).on('error', function () {
        // console.log('获取数据出错！');
        saveData();
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

// var data =
//     [
//         [
//             'A',
//             'B'
//         ],
//         [
//             '1',
//             '2'
//         ],
//         [
//             '3',
//             '4'
//         ]
//     ];
function saveData() {
    console.log('开始保存数据！');
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

    let obj = [];
    let filePath = './' + outFileName + ".xlsx";
    if (fs.existsSync(filePath)) {
        obj = xlsx.parse(filePath);
    }
    // fs.outputFileSync("source.json", JSON.stringify(sourceObj));
    let isExist = false;
    for (let temp of obj) {
        if (temp.name == outSheetName) {
            temp.data = data;
            isExist = true;
        }
    }
    !isExist && (obj.push({ "name": outSheetName, "data": data }));

    var buffer = xlsx.build(obj);
    fs.writeFile(filePath, buffer, function (err) {
        if (err) throw err;
        console.log('has finished');
    });

}

module.exports = reqHttp;

if (require.main == module) {
    reqHttp();
}



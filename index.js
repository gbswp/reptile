var http = require("https");
var cheerio = require("cheerio");
var fs = require("fs-extra");

var baseUrl = "https://sh.lianjia.com/ershoufang/";
var index = 1;
var maxIndex = 10;
var dataList = [];

function getUrl() {
    if (index == 1) return baseUrl + "rs/";
    else return baseUrl + "pg" + index + "/"
}

function reqHttp() {
    http.get(getUrl(), function (res) {
        var html = '';
        res.on('data', function (data) {
            html += data;
        });
        res.on('end', function () {
            dataList = dataList.concat(filterData(html));
            if (index >= 10) {
                fs.outputFileSync("source.json", JSON.stringify(dataList));
                return;
            }
            setTimeout(() => {
                index++;
                reqHttp();
            }, 100)
        });
    }).on('error', function () {
        console.log('获取数据出错！');
    });
}

/* 过滤章节信息 */
function filterData(html) {

    var $ = cheerio.load(html);
    var temp = [];

    $('.sellListContent li').each(function () {
        let info = $(this).find("div");
        var data = {};

        data.title = info.find(".title").find("a").text();
        data.params = info.find(".address").find(".houseInfo").text();
        data.flood = info.find(".flood").find(".positionInfo").text();
        // house.address = info.find("flood").find("positionInfo").find("a").html();
        data.followInfo = info.find(".followInfo").text();
        data.totalPrice = info.find(".priceInfo").find(".totalPrice span").text() + "万";
        data.unitPrice = info.find(".priceInfo").find(".unitPrice span").text();

        temp.push(data);

    })
    // fs.outputFileSync("source.html", temp.);
    return temp;
}

module.exports = reqHttp;

if (require.main == module) {
    reqHttp();
}



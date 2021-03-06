var https = require("https");
var fs = require("fs-extra");
var path = require("path");
let execSync = require('child_process').execSync;
let PromisePool = require('es6-promise-pool');
let ProgressBar = require('progress');

var WorkSpacePath = "F:\\code_store"

var url = "https://gitcode.wonderful-app.com/api/v4/projects?private_token=cNDPKW76XEAs2uxC8VjD&per_page=100";
var repos = []; //仓库列表

/**获取仓库列表 */
function reqHttp(page) {
    return new Promise(function (resolve, reject) {
        https.get(url + `&page=${page}`, function (res) {
            let bufs = "";
            res.on("data", function (data) {
                bufs += data;
            });
            res.on("end", function () {
                repos = repos.concat(JSON.parse(bufs));
                resolve()
            })
        }).on("error", function (error) {
            console.error(error)
            reject(error);
        })
    })
}

/**克隆仓库 */
function cloneRepo() {
    Promise.all([
        reqHttp(1),
        reqHttp(2)
    ]).then(function () {
        if (!repos || !repos.length) return;
        let total = repos.length;
        let progressBar = new ProgressBar(':bar :percent', {
            complete: '█',
            total: total,
            width: 60
        })
        console.log(`开始克隆 ${total}个项目`);
        let num = 0;
        doTaskList(() => {
            if (!repos.length) {
                console.log(`克隆完成 当前克隆了${num}个项目`)
                return null
            };
            let data = repos.shift();
            let repoName = data.name;
            let namespaceName = data.namespace.name;
            let ssh_url_to_repo = data.ssh_url_to_repo;
            let repoDir = path.join(WorkSpacePath, namespaceName);
            if (!fs.existsSync(repoDir)) {
                fs.mkdirSync(repoDir);
            }
            let repoPath = path.join(repoDir, repoName);
            if (!fs.existsSync(repoPath)) {
                try {
                    let cmd = `git clone ${ssh_url_to_repo}`;
                    execSync(cmd, { cwd: repoDir, encoding: 'utf8' });
                    progressBar.tick();
                    num++;
                } catch (error) {
                    console.log(`项目${namespaceName}/${repoName}出现克隆异常`)
                }
            } else {
                console.log(`目录${namespaceName}/${repoName}已存在`)
            }

            return Promise.resolve();
        })
    })
}

function doTaskList(handler, concurrencyNum = 1) {
    return new PromisePool(handler, concurrencyNum).start();
}

module.exports = cloneRepo;
if (require.main == module) {
    cloneRepo();
}

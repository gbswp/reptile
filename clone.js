var https = require("https");
var fs = require("fs-extra");
var path = require("path");
let execSync = require('child_process').execSync;
let PromisePool = require('es6-promise-pool');
let ProgressBar = require('progress');

var WorkSpacePath = "F:\\code_store"

var url = "https://gitcode.wonderful-app.com/api/v4/projects?private_token=cNDPKW76XEAs2uxC8VjD";
var repos = []; //仓库列表

/**获取仓库列表 */
function reqHttp() {
    return new Promise(function(resolve, reject) {
        https.get(url, function(res) {
            let bufs = "";
            res.on("data", function(data) {
                bufs += data;
            });
            res.on("end", function() {
                repos = JSON.parse(bufs);
                resolve()
            })
        }).on("error", function() {
            reject();
        })
    })
}

/**克隆仓库 */
function cloneRepo() {
    reqHttp().then(function() {
        if (!repos || !repos.length) return;

        let total = repos.length;
        let progressBar = new ProgressBar(':bar :percent', {
            complete: '█',
            total: total,
            width: 60
        })

        doTaskList(() => {
            if (!repos.length) {
                console.log(`克隆完成 当前克隆了${total}个项目`)
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
                let cmd = `git clone ${ssh_url_to_repo}`;
                execSync(cmd, { cwd: repoDir, encoding: 'utf8' });
                progressBar.tick();
                return Promise.resolve();
            } else {
                fs.removeSync(repoPath);
                return null;
            }
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

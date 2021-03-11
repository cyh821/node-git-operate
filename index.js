const fs = require('fs')

const {
    exec
} = require('child_process')
const {
    filePathData
} = require('./config/index.js')
const minimist = require('minimist')
const {
    logStyles
} = require('./style/logStyle')
const argv = minimist(process.argv.slice(2))

let params = {
    remote: 'origin',
    branch: ''
}

// 检测路径是否是文件夹
const checkDir = (path) => {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                console.log(err)
                resolve({
                    path,
                    status: false
                })
            }
            resolve({
                path,
                status: stats.isDirectory()
            })
        })
    })

}


// 进入文件夹命令
const createCommandToFolder = (path) => {
    return `cd ${path}`
}

// pull命令
const createCommandToPull = (remote = 'origin', branch = '') => {
    return `git pull ${remote} ${branch}`
}

// push命令
const createCommandToPush = (remote = 'origin', branch = '') => {
    return `git push ${remote} ${branch}`
}

// git命令
const createCommandToFetch = () => {
    return `git fetch`
}



// 执行命令
const execCmd = (command, path, type) => {
    return new Promise((resolve,reject)=>{
        exec(command, {
            cwd: path
        }, (error, stdout, stderr) => {
            if (error) {
                console.error(logStyles.red[0],`执行的错误: ${error}`);
                reject()
                return;
            }
            console.log(logStyles.white[0],`-----------------------${type}----------------------------------`);
            console.log(logStyles.yellow[0],`path = ${path} start ${type}`);
            console.log(logStyles.blue[0],`command : ${command}`);
            stdout && console.log(logStyles.cyan[0],`${type} stdout : ${stdout}`);
            stderr && console.error(logStyles.red[0],`${type} stderr : ${stderr}`);
            console.log(logStyles.yellow[0],`path = ${path} end ${type}`);
            console.log(logStyles.white[0],`-----------------------${type}----------------------------------`);
            resolve(stdout)
        })
    })
    
}

// 过滤不是文件夹的路径
const passCheckPath = async () => {
    let promiseArr = []
    for (const item of filePathData) {
        promiseArr.push(checkDir(item))
    }
    let PA = Promise.all(promiseArr)
    let passPathArr = []
    // 等到PA里面的执行完后再执行return
    await PA.then((arr) => {
        for (const item of arr) {
            if (item.status) {
                passPathArr.push(item.path)
            } else {
                console.log(`${item.path} is not Dir`);
            }
        }
    })
    return passPathArr
}

const getGitCurrentBranch = async (path) => {
    const currentBranchCommand = 'git symbolic-ref --short -q HEAD'
    let branch = await execCmd(currentBranchCommand,path,'get brand')
    return branch
}

// 执行pull
const pull = async (remote = 'origin', branch = '') => {
    let passPathArr = await passCheckPath()
    let comm = ''
    for (const path of passPathArr) {
        // comm = `${createCommandToFolder(path)} && ${createCommandToPull()}`
        branch = await getGitCurrentBranch(path)
        comm = createCommandToPull(remote, branch)
        await execCmd(comm, path, 'pull')
    }
}

// 执行push
const push = async (remote = 'origin', branch = '') => {
    let passPathArr = await passCheckPath()
    let comm = ''
    for (const path of passPathArr) {
        // comm = `${createCommandToFolder(path)} && ${createCommandToPush()}`
        branch = await getGitCurrentBranch(path)
        comm = createCommandToPush(remote, branch)
        await execCmd(comm, path, 'push')
    }
}

// 执行fetch
const fetch = async () => {
    let passPathArr = await passCheckPath()
    let comm = ''
    for (const path of passPathArr) {
        comm = createCommandToFetch()
        await execCmd(comm, path, 'fetch')
    }
}

// 根据命令行传过来的参数判断执行方法
const processArgvType = async () => {
    params.remote = argv.remote || 'origin'
    params.branch = argv.branch || ''
    switch (argv.type) {
        case 'pull':
            pull(params.remote, params.branch)
            break;
        case 'push':
            push(params.remote, params.branch)
            break;
        case 'fetch':
            fetch()
            break;
        default:
            break;
    }
}

processArgvType()
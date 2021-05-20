const { dialog, app, BrowserWindow, ipcMain, ipcRenderer } = require("electron")
const path = require("path")
const {exec} = require("child_process")
const fs = require("fs")
const linux = process.platform == "linux"

let filename
let winFilename

function createWindow() {
    let win = new BrowserWindow({
        radii: [1, 1, 1, 1],
        width: 1350,
        height: 900,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }
    })

    win.on('maximize', function (e) {
        win.webContents.send("window-maximize")
    })

    win.on('unmaximize', function (e) {
        win.webContents.send("window-unmaximize")
    })

    ipcMain.on("window-minimize", () => {
        win.minimize()
    })

    ipcMain.on("window-maximize", () => {
        if(win.isMaximized()){
            win.unmaximize()
            win.webContents.send("window-unmaximize")
        }else{
            win.maximize()
            win.webContents.send("window-maximize")
        }
    })

    if(linux){
        filename = `/tmp/tmp.tex`
    }else{
        exec("wsl -- wslpath -a %TEMP:\\=//%", (error, stdout, stderr) => {
            if(error){
                console.log(stderr)
                return false
            }
            filename = `${stdout.trim()}/tmp.tex`
        })
    }

    if(!linux){
        exec("echo %TEMP%", (error, stdout, stderr) => {
            if(error){
                console.log(stderr)
                return false
            }
            winFilename = `${stdout.trim()}\\tmp.tex`
        })
    }

    ipcMain.on("window-close", () => {
        win.close()
    })

    win.loadFile("index.html")
}

app.whenReady().then(() => {
    createWindow()
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit()
    }
})

ipcMain.on("ready", (event) => { // html 読み込み後
    event.sender.send("log", process.argv)
    if(process.argv.slice(-1)[0].match(/\.*.tex$/)){
        event.sender.send("log", 1)
        filename = process.argv.slice(-1)[0]
        winFilename = filename
        let efilename = winFilename.replace(/\\/g, "\\\\")
        exec(`wsl -- wslpath -a ${efilename}`, (error, stdout, stderr) => {
            filename = stdout.trim()
        })
        event.sender.send("filename", linux ? filename : winFilename)
        fs.readFile(linux ? filename : winFilename, (err, data) => {
            if(err) throw err
            event.sender.send("opentxt", data.toString())
            event.sender.send("filename", linux ? filename : winFilename)
            event.sender.send("compile-done")
        })
    }
})


// 保存
ipcMain.on("compile", (event, data) => {
    event.sender.send("filename", (linux ? filename : winFilename))
    save(event, data)
})

// 名前をつけて保存
ipcMain.on("saveas", (event, data) => {
    let savefile = dialog.showSaveDialog(null, {
        properties: ['openFile'],
        title: '名前をつけて保存',
        defaultPath: '.',
        filters: [
            {name: 'TeX 文章', extensions: ['tex']}
        ]
    })
    savefile.then(p => {
        if(!p["canceled"]){
            if(linux){
                filename = p["filePath"]
                save(event, data)
            }else{
                winFilename = p["filePath"]
                let efilename = winFilename.replace(/\\/g, "\\\\")
                exec(`wsl -- wslpath -a ${efilename}`, (error, stdout, stderr) => {
                    filename = stdout.trim()
                    save(event, data)
                })
            }
        }
    })
})

// 保存
function save(event, data){
    event.sender.send("filename", linux ? filename : winFilename)
    fs.writeFile(linux ? filename : winFilename, data, (err) => {
        if(err){
            console.log("SAVE ERROR!")
            throw err
        }
        event.sender.send("saved-tmptex")
    })
    let cmd = `ptex2pdf -l -ot -kanji=utf8 -halt-on-error -interaction=nonstopmode -file-line-error -output-directory ${path.dirname(filename)} ${filename}`
    if(!linux){
        cmd = `wsl -- PATH=$PATH:/usr/local/texlive/2021/bin/x86_64-linux ${cmd}`
    }
    console.log(cmd)
    exec(cmd, (error, stdout, stderr) => {
        if(error){
            console.log(stderr)
            event.sender.send("compile-error")
            return false
        }
        event.sender.send("compile-done")
    })
}

// 開く
ipcMain.on("openfile", event => {
    let fileopen = dialog.showOpenDialog(null, {
        properties: ['openFile'],
        title: 'ファイルを開く',
        defaultPath: '.',
        filters: [
            {name: 'TeX 文章', extensions: ['tex']}
        ]
    })
    fileopen.then( p => {
        if(!p["canceled"]){
            if(linux){
                filename = p["filePaths"][0]
            }else{
                winFilename = p["filePaths"][0]
                let efilename = winFilename.replace(/\\/g, "\\\\")
                exec(`wsl -- wslpath -a ${efilename}`, (error, stdout, stderr) => {
                    filename = stdout.trim()
                })
            }
            event.sender.send("filename", linux ? filename : winFilename)
            fs.readFile(linux ? filename : winFilename, (err, data) => {
                if(err) throw err
                event.sender.send("opentxt", data.toString())
                event.sender.send("filename", linux ? filename : winFilename)
                event.sender.send("compile-done")
            })
        }
    })
})
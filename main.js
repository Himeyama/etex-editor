const { dialog, app, BrowserWindow, ipcMain, ipcRenderer } = require("electron")
const path = require("path")
const {exec} = require("child_process")
const fs = require("fs")
const iconv = require("iconv-lite")


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

    exec("wsl -- wslpath -a %TEMP:\\=//%", (error, stdout, stderr) => {
        if(error){
            console.log(stderr)
            return false
        }
        filename = `${stdout.trim()}/tmp.tex`
    })

    exec("echo %TEMP%", (error, stdout, stderr) => {
        if(error){
            console.log(stderr)
            return false
        }
        winFilename = `${stdout.trim()}\\tmp.tex`
    })

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


// 保存
ipcMain.on("compile", (event, data) => {
    event.sender.send("filename", winFilename)
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
            winFilename = p["filePath"]
            let efilename = winFilename.replace(/\\/g, "\\\\")
            exec(`wsl -- wslpath -a ${efilename}`, (error, stdout, stderr) => {
                filename = stdout.trim()
                save(event, data)
            })
        }
    })
})

// 保存
function save(event, data){
    event.sender.send("filename", winFilename)
    fs.writeFile(winFilename, data, (err) => {
        if(err){
            console.log("SAVE ERROR!")
            throw err
        }
        event.sender.send("saved-tmptex")
    })
    let cmd = `wsl -- PATH=$PATH:/usr/local/texlive/2021/bin/x86_64-linux ptex2pdf -l -ot -kanji=utf8 -halt-on-error -interaction=nonstopmode -file-line-error -output-directory ${path.dirname(filename)} ${filename}`
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
            winFilename = p["filePaths"][0]
            let efilename = winFilename.replace(/\\/g, "\\\\")
            // console.log()
            exec(`wsl -- wslpath -a ${efilename}`, (error, stdout, stderr) => {
                filename = stdout.trim()
            })
            event.sender.send("filename", winFilename)
            fs.readFile(winFilename, (err, data) => {
                if(err) throw err
                event.sender.send("opentxt", data.toString())
                event.sender.send("filename", winFilename)
                event.sender.send("compile-done")
            })
        }
    })
})
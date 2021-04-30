const {contextBridge, ipcRenderer} = require("electron")

contextBridge.exposeInMainWorld(
    "electron",
    {
        windowMinimize: () => ipcRenderer.send("window-minimize"),
        windowMaximize: () => ipcRenderer.send("window-maximize"),
        windowClose: () => ipcRenderer.send("window-close"),

        compile: (data) => ipcRenderer.send("compile", data),
        saveas: (data) => ipcRenderer.send("saveas", data),

        openfile: () => ipcRenderer.send("openfile"),

        on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
        func1: () => ipcRenderer.send("func1"),
        func2: (arg) => ipcRenderer.send("func2", arg)
    }
)
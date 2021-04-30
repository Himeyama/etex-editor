let title = windowTitle.innerText
let filename = ""
let untitled = true

// Ctrl + S
document.body.addEventListener("keydown", event => {
    if(event.key === "s" && event.ctrlKey){
        untitled ? saveas() : save()
    }
})

// Ctrl + O
document.body.addEventListener("keydown", event => {
    if(event.key === "o" && event.ctrlKey){
        openfile()
    }
})

function openfile(){
    window.electron.openfile()
}

function save(){
    windowTitle.innerText = `保存中... | ${filename} - ${title}`
    window.electron.compile(editor.getValue())
}

function saveas(){
    windowTitle.innerText = `保存中... | ${filename} - ${title}`
    window.electron.saveas(editor.getValue())
    untitled = false
}

window.electron.on("saved-tmptex", () => {
    windowTitle.innerText = `変換中... |  ${filename} - ${title}`
})

window.electron.on("compile-done", () => {
    windowTitle.innerText = `${filename} - ${title}`
    document.getElementById("pdfview").setAttribute("src", `${filename.match(/(.*?)\.tex$/)[1]}.pdf`)
})

window.electron.on("compile-error", (error) => {
    windowTitle.innerText = `変換に失敗 :( | ${filename} - ${title}`
})

window.electron.on("opentxt", data => {
    untitled = false
    editor.setValue(data)
})

window.electron.on("filename", data => {
    filename = data
    windowTitle.innerText = `${filename} - ${title}`
})


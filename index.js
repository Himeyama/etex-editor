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
    const edit_setvalue = setInterval(() => {
        if(typeof editor.setValue != "undefined"){// 定義されているとき
            editor.setValue(data)
            clearInterval(edit_setvalue)
        }
    }, 1)
})

window.electron.on("filename", data => {
    filename = data
    windowTitle.innerText = `${filename} - ${title}`
})

// セパレートをクリックしたとき
function resep(x){
    let edit = document.getElementById("editor")
    let sepa = document.getElementById("separate")
    let pv = document.getElementById("pdfview")
    let css = document.getElementById("jstyle")
    edit.style.width = `${x}px`
    css.innerHTML = `#pdfview{width: calc(100% - ${x + 30}px)}`
}

let sep = document.getElementById("separate")
let smove = false
sep.addEventListener("mousedown", () => {
    smove = true
    console.log(true)
})
window.addEventListener("mousemove", (e) => {
    if(smove){
        console.log(e.pageX)
        resep(e.pageX)
    }
})
window.addEventListener("mouseup", () => {
    if(smove){
        smove = false
        console.log("マウス上げ")
    }
    
})
window.electron.on("log", data => {
    console.log(data)
})


window.electron.ready()
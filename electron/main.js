const { app, BrowserWindow } = require("electron")
const path = require("path")

function createWindow() {
  const win = new BrowserWindow({
    width: 1250,
    height: 800
  })

  win.loadFile(path.join(__dirname, "../out/index.html"))
}

app.whenReady().then(createWindow)
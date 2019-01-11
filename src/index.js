const electron = require('electron');
const AutoLaunch = require('auto-launch');

const ipc = electron.ipcMain;
const app = electron.app;
const globalShortcut = electron.globalShortcut;

var mainWindow = null;
var screenWidth = null;
var screenHeight = null;
var windowWidth = null;
var windowHeight = null;

const gotTheLock = app.requestSingleInstanceLock();

if(!gotTheLock) {
    if(process.platform != 'darwin') {
        app.quit();
    }
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if(mainWindow) {
            mainWindow.focus();
        }
    });
}

function createWindow () {
    screenWidth = electron.screen.getPrimaryDisplay().bounds.width;
    screenHeight = electron.screen.getPrimaryDisplay().bounds.height;
    windowWidth = Math.floor((screenWidth*15)/100);
    windowHeight = Math.floor((screenHeight*25)/100);

    mainWindow = new electron.BrowserWindow({
                            width: windowWidth,
                            height: windowHeight,
                            x: screenWidth-windowWidth+40,
                            y: screenHeight-windowHeight-50,
                            minimizable: false,
                            maximizable: false,
                            closable: false,
                            alwaysOnTop: true,
                            fullscreen: false,
                            fullscreenable: false,
                            transparent: true,
                            frame: false,
                            type: "dock",
                            icon: "assets/icons/icon.png"
                       });

    mainWindow.setMinimumSize(windowWidth, windowHeight);
    mainWindow.loadURL(`file://${__dirname}/index.html`);
    mainWindow.focus();
    //mainWindow.webContents.openDevTools();
}

ipc.on('open-popup', function (event, arg) {
    mainWindow.hide();
    mainWindow.setPosition(screenWidth-windowWidth*2.5+40, screenHeight-windowHeight*2.5-50);
    mainWindow.setSize(windowWidth*2.5, windowHeight*2.5);
    mainWindow.webContents.send('popup-opened', {});
    mainWindow.show();
    mainWindow.focus();
});

ipc.on('close-popup', function (event, arg) {
    mainWindow.hide();
    mainWindow.setSize(windowWidth, windowHeight);
    mainWindow.setPosition(screenWidth-windowWidth+40, screenHeight-windowHeight-50);
    mainWindow.webContents.send('popup-closed', {});
    mainWindow.show();
    mainWindow.focus();
});

app.on('ready', () => {
    var autoLaunch = new AutoLaunch({
        name: 'QuickTasks'
    });
    autoLaunch.isEnabled().then((isEnabled) => {
        if(!isEnabled) {
            autoLaunch.enable();
        }
    });

    const ret1 = globalShortcut.register('CommandOrControl+Shift+Alt+T', () => {
        mainWindow.focus();
        mainWindow.webContents.send('command-open-popup', {});

        mainWindow.hide();
        mainWindow.setPosition(screenWidth-windowWidth*2.5+40, screenHeight-windowHeight*2.5-50);
        mainWindow.setSize(windowWidth*2.5, windowHeight*2.5);
        mainWindow.webContents.send('popup-opened', {});
        mainWindow.show();
        mainWindow.focus();
    });

    const ret2 = globalShortcut.register('CommandOrControl+Shift+Alt+E', () => {
        mainWindow.close();
    });

    setTimeout(createWindow, 5000);
});

app.on('will-quit', () => {
    if(globalShortcut.isRegistered('CommandOrControl+Shift+Alt+T')) {
        globalShortcut.unregister('CommandOrControl+Shift+Alt+T');
    }

    if(globalShortcut.isRegistered('CommandOrControl+Shift+Alt+E')) {
        globalShortcut.unregister('CommandOrControl+Shift+Alt+E');
    }
})

app.on('window-all-closed', () => {
    if(process.platform != 'darwin') {
        app.quit();
    }
});

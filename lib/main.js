/*jshint esversion: 6 */
const {app, ipcMain, globalShortcut, BrowserWindow} = require('electron');


let mainWindow; // keep the browser window from being garbage collected
function createWindow () {
    // Create the browser window.
    // more options can be found at http://electron.atom.io/docs/all/#browserwindow
    mainWindow = new BrowserWindow({
        title: "BIMS",
        width: 1200,
        height: 800,
        center: true,
        webPreferences: {
            nativeWindowOpen: true
        }
    });

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`);

    // Open the DevTools. (optional modes: right, bottom, undocked, detached)
    //mainWindow.webContents.openDevTools({mode:'bottom'});
    mainWindow.webContents.openDevTools({mode:'undocked'});

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;

        //TODO Add Logout Logs Here
    });

    //Hide Menu Bar
    mainWindow.setMenu(null);

    mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options, additionalFeatures) => {
        event.preventDefault()
        console.log(additionalFeatures);
        Object.assign(options, {
          modal: true,
          parent: mainWindow,
          width: 500,
          height: 500,
          center: true
        })
        event.newGuest = new BrowserWindow(options);
        event.newGuest.setMenu(null);
        const PDFWindow = require('electron-pdf-window');
        PDFWindow.addSupport(event.newGuest);
        //event.newGuest.webContents.openDevTools({mode:'bottom'});
        //event.newGuest.loadURL(`file://${__dirname}/js/views/main/test.pdf`);
        event.newGuest.loadURL(url);

        // event.newGuest.webContents.on('dom-ready', () => { 
        //     event.newGuest.webContents.insertCSS('#download {display: none !important;}');
        // });
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const electron = require('electron')
require('electron-reload')(__dirname);
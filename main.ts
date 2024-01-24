// main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import { check, startProcess, backupDirectory, checkMemoryUsage } from './protector';
import path from 'path';

function createWindow() {
    const mainWindow = new BrowserWindow({
        // ... 窗口配置
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js') // 如果您使用了 preload 脚本
        }
    });

    mainWindow.loadFile('index.html');
    // ... 其他窗口创建相关的代码
}

app.whenReady().then(createWindow);

// 设置 IPC 侦听器以响应渲染进程的请求
ipcMain.on('perform-action', (event, arg) => {
    // 基于 arg 的值执行不同的操作
    // 例如，如果 arg.action 是 'backup'，则调用 backupDirectory 函数
    if (arg.action === 'backup') {
        backupDirectory(arg.sourceDir, arg.backupDir);
    }
    // 添加其他操作的处理
});

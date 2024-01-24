// main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import {
  startProcess,
  checkMemoryUsage,
  backupDirectory,
  // ...其他需要的函数
} from './protector';
import path from 'path';
import { exec } from 'child_process';
import moment from 'moment';

let mainWindow: BrowserWindow | null;
let isRunning: boolean = false;

let checkIntervaljob: NodeJS.Timeout | null = null;
let backupIntervaljob: NodeJS.Timeout | null = null;


/**设置区域**************/

//游戏存档目录
let gamedataPath: string = 'C:\\Users\\kiros\\Desktop\\steamcmd\\steamapps\\common\\PalServer\\Pal\\Saved\\SaveGames';
//存档备份路径
let backupPath: string = path.join(__dirname, 'backup');
//存档备份周期
let backupInterval: number = 1800;
//监控服务端名称
let processName: string = "Pal";
//服务端启动路径
let cmd: string = `"C:\\Users\\kiros\\Desktop\\steamcmd\\steamapps\\common\\PalServer\\PalServer.exe"`;
//内存占用百分比阈值（%）
let memTarget: number = 90;
//内存监控周期（秒）
let checkSecond: number = 20;
//关服延迟（秒） 默认内存监控周期一半（不应超过内存监控周期，避免重复触发指令）
let rebootSecond: number = checkSecond / 2;
//rcon地址 默认本季
let serverHost: string = '127.0.0.1';
//rcon端口
let serverPort: number = 25575;
//rcon密码
let rconPassword: string = 'admin';

/************************/


function createWindow() {
  const mainWindow = new BrowserWindow({
    // ...窗口配置
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js') // 如果使用 preload 脚本
    }
  });

  mainWindow.loadFile('index.html');
  // ...其他窗口创建相关的代码
}

app.whenReady().then(createWindow);

function sendToConsole(str: string) {
    if (mainWindow) {
        mainWindow.webContents.send('action-response', str);
    }
}


ipcMain.on('perform-action', (event, arg) => {
  if (arg.action === 'start') {
    gamedataPath = arg.gamedataPath;
    backupPath = arg.backupPath;
    backupInterval = parseInt(arg.backupInterval);
    processName = arg.processName;
    cmd = arg.cmd;
    memTarget = parseInt(arg.memTarget);
    checkSecond = parseInt(arg.checkSecond);
    rebootSecond = parseInt(arg.rebootSecond);
    serverHost = arg.serverHost;
    serverPort = parseInt(arg.serverPort);
    rconPassword = arg.rconPassword;
    
    // 设置内存检查的定时任务
    if (checkIntervaljob) {
      clearInterval(checkIntervaljob);
    }
    checkIntervaljob = setInterval(() => {
      checkMemoryUsage().then(memUsage => {
        // 可以将内存使用情况发送回渲染器进程
        event.reply('action-response', `Memory Usage: ${memUsage}%`);
      });
      checkMemoryUsage();
        exec(`tasklist`, (err: Error | null, stdout: string, stderr: string) => {
            if (err) {
                console.error(`[${moment().format('HH:mm:ss')}] Error executing tasklist: ${err}`);
                return;
            }

            if (stdout.toLowerCase().indexOf(processName.toLowerCase()) === -1) {
                console.log(`[${moment().format('HH:mm:ss')}] ${processName} is not running. Attempting to start.`);
                startProcess();
            } else {
                console.log(`[${moment().format('HH:mm:ss')}] ${processName} is already running.`);
            }
        });
    }, parseInt(arg.checkSecond) * 1000);

    // 设置备份的定时任务
    if (backupIntervaljob) {
      clearInterval(backupIntervaljob);
    }
    backupIntervaljob = setInterval(() => {
      backupDirectory(gamedataPath, backupPath);
      // 完成备份后的操作
    }, parseInt(arg.backupInterval) * 1000);

    isRunning = true;
  }
  else{
    if (checkIntervaljob) {
        clearInterval(checkIntervaljob);
      }

    if (backupIntervaljob) {
        clearInterval(backupIntervaljob);
      }
    isRunning = false;
  }
  // ...处理其他操作
});

// ...其他必要的代码


// 每隔20秒钟检查一次
setInterval(check, checkSecond*1000);



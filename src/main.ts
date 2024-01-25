// main.ts
import { app, BrowserWindow, ipcMain,Menu   } from 'electron';
import {
  startProcess,
  checkMemoryUsage,
  backupDirectory,
  sendMsgandReboot
  // ...其他需要的函数
} from './protector';
import path from 'path';
import { exec } from 'child_process';
import moment from 'moment';
import ps from 'ps-node';
import pidusage from 'pidusage';

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
//let processName: string = "Pal";
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
  mainWindow = new BrowserWindow({
    title: "Protector for PalServer  By Kiros",
    width: 800,      // 设置窗口的宽度
    height: 800,     // 设置窗口的高度
     resizable: false, // 禁止调整窗口大小
    // ...窗口配置
    webPreferences: {
      devTools: true, // 确保开启开发者工具

      nodeIntegration: true,
      contextIsolation: false,
      //preload: path.join(__dirname, 'preload.js') // 如果使用 preload 脚本
    }
  });
  Menu.setApplicationMenu(null);

  let indexPath: string;

    if (app.isPackaged) {
        // 打包环境
        indexPath = path.join(process.resourcesPath, 'app.asar', 'dist/index.html');
    } else {
        // 开发环境
        indexPath = path.join(__dirname, 'index.html');
    }
  // ...其他窗口创建相关的代码
  console.log("Loading index from:", indexPath);
  mainWindow.loadFile(indexPath);
}


app.whenReady().then(() => {
  createWindow()
  // 注册一个 'Ctrl+I' 的全局快捷键
  if (!app.isPackaged && mainWindow) {

    mainWindow.webContents.openDevTools();
  }

});



function sendToConsole(str: string) {
    if (mainWindow) {
        mainWindow.webContents.send('action-response', str);
    }
    else{
      console.log('mainWindow is null');
    }
}


async function checkServerStatus(): Promise<void> {
  try {
    // 检查内存使用情况
    const memUsage = await checkMemoryUsage();
    sendToConsole(`[${moment().format('HH:mm:ss')}] 当前内存占用: ${memUsage}%`);

    if (memUsage > memTarget) {
      console.log(`负载过高，即将重启。`);
      sendToConsole(`[${moment().format('HH:mm:ss')}] 负载过高，即将重启。`);
      await sendMsgandReboot(serverHost, serverPort, rconPassword);
    }

    // 查找特定路径的进程
    ps.lookup({}, (err, resultList) => {
      if (err) {
        throw err;
      }

      let isFound = false;
      for (const process of resultList) {
        if (process && process.command === cmd) {
          isFound = true;
          // pidusage(process.pid, (err, stats) => {
          //   if (err) {
          //     // 同样，使用 err.message
          //     console.error(`PID使用情况错误: ${err.message}`);
          //     return;
          //   }
          //   const memoryInGB: number = stats.memory / Math.pow(1024, 3); // 将内存从字节转换为GB

          //   console.log(`进程 ${process.pid} 的 CPU 使用率: ${stats.cpu}`);
          //   console.log(`进程 ${process.pid} 的内存使用: ${stats.memory}`);
          //   sendToConsole(`[${moment().format('HH:mm:ss')}] 发现服务端进程(${process.pid})占用内存${memoryInGB.toFixed(2)}G`);
          // });
          sendToConsole(`[${moment().format('HH:mm:ss')}] 发现服务端进程(${process.pid})`);

          break;
        }
      }

      if (!isFound) {
        sendToConsole(`[${moment().format('HH:mm:ss')}] 未找到进程，尝试启动新服务端`);
        startProcess(cmd);
      }
    });

  } catch (error) {
    console.error(`错误: ${error}`);
    sendToConsole(`[${moment().format('HH:mm:ss')}] 进程查找失败。请检查。`);
  }
}


ipcMain.on('perform-action', (event, arg) => {
  if (arg.action === 'start') {
    gamedataPath = arg.gamedataPath;
    backupPath = arg.backupPath;
    backupInterval = parseInt(arg.backupInterval);
    //processName = arg.processName;
    cmd = arg.cmd;
    memTarget = parseInt(arg.memTarget);
    checkSecond = parseInt(arg.checkSecond);
    rebootSecond = parseInt(arg.rebootSecond);
    serverHost = arg.serverHost;
    serverPort = parseInt(arg.serverPort);
    rconPassword = arg.rconPassword;

    sendToConsole(`[${moment().format('HH:mm:ss')}] 开始运行...`)
    
    // 设置内存检查的定时任务
    if (checkIntervaljob) {
      clearInterval(checkIntervaljob);
    }
    checkIntervaljob = setInterval(() => {
      checkServerStatus();
    }, parseInt(arg.checkSecond) * 1000);

    // 设置备份的定时任务
    if (backupIntervaljob) {
      clearInterval(backupIntervaljob);
    }
    backupIntervaljob = setInterval(() => {
      sendToConsole(`[${moment().format('HH:mm:ss')}] 正在备份游戏存档。`)

      backupDirectory(gamedataPath, backupPath);
      // 完成备份后的操作
    }, parseInt(arg.backupInterval) * 1000);

    sendToConsole(`[${moment().format('HH:mm:ss')}] 正在备份游戏存档。`)
    backupDirectory(gamedataPath, backupPath); //启动时先备份一次

    isRunning = true;


  }
  else{
    if (checkIntervaljob) {
        clearInterval(checkIntervaljob);
      }

    if (backupIntervaljob) {
        clearInterval(backupIntervaljob);
      }
      sendToConsole(`[${moment().format('HH:mm:ss')}] 已停止...`)
      isRunning = false;

  }
  // ...处理其他操作
});

// ...其他必要的代码



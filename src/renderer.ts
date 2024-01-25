// renderer.ts
const { ipcRenderer } = require('electron');


let isrun:Boolean = false;


function setInputs(isrun: Boolean){
    if(isrun){//改只读
    
        (document.getElementById('gamedataPath') as HTMLInputElement).setAttribute("readonly", "true");
        (document.getElementById('backupPath') as HTMLInputElement).setAttribute("readonly", "true");
        (document.getElementById('cmd') as HTMLInputElement).setAttribute("readonly", "true");
        (document.getElementById('backupInterval') as HTMLInputElement).setAttribute("readonly", "true");
        //(document.getElementById('processName') as HTMLInputElement).setAttribute("readonly", "true");
        (document.getElementById('memTarget') as HTMLInputElement).setAttribute("readonly", "true");
        (document.getElementById('checkSecond') as HTMLInputElement).setAttribute("readonly", "true");
        (document.getElementById('rebootSecond') as HTMLInputElement).setAttribute("readonly", "true");
        (document.getElementById('serverHost') as HTMLInputElement).setAttribute("readonly", "true");
        (document.getElementById('serverPort') as HTMLInputElement).setAttribute("readonly", "true");
        (document.getElementById('rconPassword') as HTMLInputElement).setAttribute("readonly", "true");
    }
    else{
        (document.getElementById('gamedataPath') as HTMLInputElement).removeAttribute("readonly");
        (document.getElementById('backupPath') as HTMLInputElement).removeAttribute("readonly");
        (document.getElementById('cmd') as HTMLInputElement).removeAttribute("readonly");
        (document.getElementById('backupInterval') as HTMLInputElement).removeAttribute("readonly");
        //(document.getElementById('processName') as HTMLInputElement).removeAttribute("readonly");
        (document.getElementById('memTarget') as HTMLInputElement).removeAttribute("readonly");
        (document.getElementById('checkSecond') as HTMLInputElement).removeAttribute("readonly");
        (document.getElementById('rebootSecond') as HTMLInputElement).removeAttribute("readonly");
        //(document.getElementById('serverHost') as HTMLInputElement).removeAttribute("readonly");
        (document.getElementById('serverPort') as HTMLInputElement).removeAttribute("readonly");
        (document.getElementById('rconPassword') as HTMLInputElement).removeAttribute("readonly");
    }
}
  

(document.getElementById('startStopButton') as HTMLElement).addEventListener('click', () => {
    if(!isrun){
        //游戏存档目录
        const gamedataPath = (document.getElementById('gamedataPath') as HTMLInputElement).value;
        //存档备份路径
        const backupPath = (document.getElementById('backupPath') as HTMLInputElement).value;
        //服务端启动路径
        const cmd = (document.getElementById('cmd') as HTMLInputElement).value;
        //存档备份周期
        const backupInterval = (document.getElementById('backupInterval') as HTMLInputElement).value;
        //监控服务端名称
     //   const processName = (document.getElementById('processName') as HTMLInputElement).value;
        //内存占用百分比阈值（%）
        const memTarget = (document.getElementById('memTarget') as HTMLInputElement).value;
        //内存监控周期（秒）
        const checkSecond = (document.getElementById('checkSecond') as HTMLInputElement).value;
        //关服延迟（秒） 默认内存监控周期一半（不应超过内存监控周期，避免重复触发指令）
        const rebootSecond = (document.getElementById('rebootSecond') as HTMLInputElement).value;
        //rcon地址 默认本机
        const serverHost = (document.getElementById('serverHost') as HTMLInputElement).value;
        //rcon端口
        const serverPort = (document.getElementById('serverPort') as HTMLInputElement).value;
        //rcon密码
        const rconPassword = (document.getElementById('rconPassword') as HTMLInputElement).value;

        if(rebootSecond>=checkSecond){
            const outputElement = document.getElementById('output') as HTMLTextAreaElement;
            outputElement.value += '重启延迟不能比监测周期更长，请修改。' + '\n';
            // 滚动到底部
            outputElement.scrollTop = outputElement.scrollHeight;
            return;
        }
        if(gamedataPath.indexOf(' ') !== -1){
            const outputElement = document.getElementById('output') as HTMLTextAreaElement;
            outputElement.value += '游戏存档目录不能包含空格，请修改。' + '\n';
            // 滚动到底部
            outputElement.scrollTop = outputElement.scrollHeight;
            return;
        }
        if(backupPath.indexOf(' ') !== -1){
            const outputElement = document.getElementById('output') as HTMLTextAreaElement;
            outputElement.value += '备份保存目录不能包含空格，请修改。' + '\n';
            // 滚动到底部
            outputElement.scrollTop = outputElement.scrollHeight;
            return;
        }
        if(cmd.indexOf(' ') !== -1){
            const outputElement = document.getElementById('output') as HTMLTextAreaElement;
            outputElement.value += '启动路径不能包含空格，请修改。' + '\n';
            // 滚动到底部
            outputElement.scrollTop = outputElement.scrollHeight;
            return;
        }
        ipcRenderer.send('perform-action', {
            action: 'start',
            cmd: cmd,
            gamedataPath: gamedataPath,
            backupPath: backupPath,
            backupInterval: backupInterval,
     //       processName: processName,
            memTarget: memTarget,
            checkSecond: checkSecond,
            rebootSecond: rebootSecond,
            serverHost: serverHost,
            serverPort: serverPort,
            rconPassword: rconPassword
        });
        isrun = true;
        setInputs(isrun);
        (document.getElementById('startStopButton') as HTMLElement).innerHTML = '停止'
    }
    else{
        ipcRenderer.send('perform-action', {
            action: 'stop',
 
        });
        isrun = false;
        setInputs(isrun);

        (document.getElementById('startStopButton') as HTMLElement).innerHTML = '启动'

    }
    
});

// 监听主进程的响应
ipcRenderer.on('action-response', (event, message) => {
    console.log(message);
    const outputElement = document.getElementById('output') as HTMLTextAreaElement;
    outputElement.value += message + '\n';
    // 滚动到底部
    outputElement.scrollTop = outputElement.scrollHeight;
});


function getElementById<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function setupDialogOpeners() {
  const gamedataPathButton = getElementById<HTMLButtonElement>('openGamedataPathDialog');
  const backupPathButton = getElementById<HTMLButtonElement>('openBackupPathDialog');
  const cmdPathButton = getElementById<HTMLButtonElement>('openCmdPathDialog');

  gamedataPathButton?.addEventListener('click', () => {
    ipcRenderer.send('open-directory-dialog', { id: 'gamedataPath' });
  });

  backupPathButton?.addEventListener('click', () => {
    ipcRenderer.send('open-directory-dialog', { id: 'backupPath' });
  });

  cmdPathButton?.addEventListener('click', () => {
    ipcRenderer.send('open-file-dialog', { id: 'cmd' });
  });
}

function setupIpcListeners() {
  ipcRenderer.on('selected-directory', (event, arg) => {
    const path = arg.path;
    const id = arg.id;

    if (id === 'gamedataPath') {
      const gamedataPathInput = getElementById<HTMLInputElement>('gamedataPath');
      if (gamedataPathInput) {
        gamedataPathInput.value = path;
      }
    } else if (id === 'backupPath') {
      const backupPathInput = getElementById<HTMLInputElement>('backupPath');
      if (backupPathInput) {
        backupPathInput.value = path;
      }
    }
  });

  ipcRenderer.on('selected-file', (event, arg) => {
    const path = arg.path;
    const id = arg.id;

    if (id === 'cmd') {
      const cmdInput = getElementById<HTMLInputElement>('cmd');
      if (cmdInput) {
        cmdInput.value = path;
      }
    }
  });
}

setupDialogOpeners();
setupIpcListeners();

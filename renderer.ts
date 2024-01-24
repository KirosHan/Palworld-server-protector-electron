// renderer.ts
const { ipcRenderer } = require('electron');

const backupButton = document.getElementById('backupButton');
(backupButton as HTMLElement).addEventListener('click', () => {
    ipcRenderer.send('perform-action', {
        action: 'backup',
        sourceDir: '源目录路径',
        backupDir: '备份目录路径'
    });
});

// 从主进程接收消息并更新 UI
ipcRenderer.on('action-result', (event, result) => {
    // 显示结果
    console.log(result);
});

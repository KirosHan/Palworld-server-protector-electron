# Palworld-server-protecter-electron
GUI版本 Palworld服务端进程守护+内存监控+优雅重启+自动存档
（for windows）

## 功能
- 内存监控（自定义阈值触发）
- 进程守护（当前如果没有服务端运行就自动重启）
- 优雅重启（内存占用达到阈值后自动发送公告并关服等待重启）
- 自动备份存档

## 注意
- 本次扩展仅针对动手能力弱的用户，因UI启动后本身会占用内存，推荐动手能力强的用户仍然使用命令行版本[https://github.com/KirosHan/Palworld-server-protector](https://github.com/KirosHan/Palworld-server-protector)

## 效果图
[预览](https://github.com/KirosHan/Palworld-server-protector-electron/blob/main/PNG/screenshot@2x.png?raw=true)

## 编译运行
使用前请先安装nodejs环境

服务端配置文件中RCONEnabled需要设置为True

1.在目录命令行中运行`npm install`

2.在目录命令行中运行`npm start`

## 打包

在目录命令行中运行`npx electron-builder --win --x64`

## 运行逻辑

```mermaid
graph TD
    A[开始] --> B[检查内存使用]
    B --> C{检查是否超过预设阈值}
    C -- 是 --> D[发送重启命令并重启]
    C -- 否 --> E[检查进程是否运行]
    E -- 是 --> F[等待下一个监控周期]
    E -- 否 --> G[启动进程]
    G --> F
    D --> F
    A --> H[定时备份游戏存档]
    H --> I[等待下一个备份周期]
    I --> H
```
## 已知问题
1.受服务端限制，rcon发送的文本中无法保留空格

2.受服务端限制，rcon无法发送中文，貌似服务端是gbk编码

3.rcon发送命令后，无法获取响应，但rcon客户端仍然会期待响应，这导致了虽然会报错，但服务端仍会正常接收，不影响实际使用。
```Error sending RCON command: Error: Timeout for packet id 1```RCON超时报错不影响使用

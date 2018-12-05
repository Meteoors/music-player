# music-player
一个简单的音乐播放器

## 说明
-------
因为部分数据需要用ajax获取，所以用node.js搭建了一个简单的服务器提供接口，想要查看页面效果必须先用node.js启动服务器。
 
## 项目运行
----------
```bash
# 下载依赖
npm install

# 运行服务器
node app
```
服务器启动后打开[localhost:3000/static/index.html](http://localhost:3000/static/index.html)查看效果。

## 功能
-------
- 点击上一首/下一首按钮、双击歌单切歌
- 点击按钮暂停/播放
- 支持列表循环、随机播放、单曲循环三种循环方式
- 点击/移动进度条调整播放进度
- 点击/移动音量条调整播放时间
- 歌词随播放时间滚动并高亮
- 记住上次关闭页面前的状态

## 技术栈
----------
jQuery + node.js

#### 注意：svg图标下载于[Iconfont-阿里巴巴矢量图标库](http://www.iconfont.cn/)

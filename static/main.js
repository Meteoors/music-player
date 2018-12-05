$(function() {
    let audio = $('#audio').get(0);  //audio对象          
    let list;   //歌单
    let sTimer;    //滚动歌词定时器
    let songIndex = 0;  //歌曲索引
    let str;    //原始歌词
    let lrcArr;     //歌词对象数组
    let loopIndex = 0;  //循环类型索引
    let loopList = [{type: 'list', name: '列表循环'}, {type: 'random', name: '随机播放'}, {type: 'single', name:'单曲循环'}]; //循环类型列表
    let rangeL = parseInt($('#range').css('width')); //进度条长度
    let voiceL = parseInt($('#voice_range').css('width'));  //音量条长度

    //刷新进度条长度
    $(window).resize(function() {
        rangeL = parseInt($('#range').css('width'));
        if(audio.paused){
            updateTime();   //暂停状态下resize窗口更新进度条进度           
        }
    });
    initData();

    //渲染歌单并绑定双击事件
    $.get('/static/list.json', function(data) {
        list = data;
        let ul = $('#list');
        for(let i=0; i<list.length; i++) {
            let html = `<li>
                            <div class='playing iconfont' style='width:32px'></div>
                            <div class='name'><i id='playing' class='icon'></i>${list[i].name}</div>
                            <div class='info'>
                                <div class='singer'>${list[i].singer}</div>
                                <div class='time'>${list[i].time}</div>
                            </div>
                        </li>`;
            ul.append(html);
        }

        updateData();

        //双击列表切歌
        $('li').dblclick(function() {
            songIndex = $(this).index();
            playSong();
            $('#play').removeClass('icon-pause').addClass('icon-play');
        })
    });
    
    //从localStorage取出数据并初始化
    function initData () {
        if (localStorage.songIndex !== undefined) {
            songIndex = localStorage.songIndex;
        }

        if(localStorage.volume !== undefined) {
            audio.volume = localStorage.volume;
        }else {
            audio.volume = 0.5;
        }

        if (localStorage.loopIndex !== undefined) {
            loopIndex =  localStorage.loopIndex;
        }
        $('#type').attr('title', loopList[loopIndex].name).addClass('icon-' + loopList[loopIndex].type);
    }

    //打开页面、切歌时刷新播放图标、歌名、src、歌词
    function updateData () {
        $('.icon-music').removeClass('icon-music');        
        $('#list').children().eq(songIndex).children().first().addClass('icon-music');

        audio.src = 'music/' + list[songIndex].singer + ' - ' + list[songIndex].name + '.mp3';      

        let songName = list[songIndex].name + ' - ' + list[songIndex].singer;
        $('#songName').text(songName);
        
        insertLrc();         
    }

    //加载完音乐文件后更新音乐时间
    $('#audio').on('loadedmetadata', function() {
        $('#total_time').text(secToMin(this.duration));
    });

    //点击按钮播放/暂停
    $('#play').click(function(){    
        if(audio.paused){
            audio.play();
            $('#play').removeClass('icon-pause').addClass('icon-play');            
        }else{
            audio.pause();
            $('#play').removeClass('icon-play').addClass('icon-pause');             
        }
    });

    //点击按钮切换静音
    $('#volume').click(function() {
        if (audio.muted) {
            audio.muted = false;
            $('#volume').removeClass('icon-mute').addClass('icon-volume');
        } else {
            audio.muted = true;
            $('#volume').removeClass('icon-volume').addClass('icon-mute');
        }
    });

    //点击按钮切换循环方式
    $('#type').click(function() {
        let oldIndex = loopIndex;
        loopIndex = ++loopIndex % 3;
        $('#type').attr('title', loopList[loopIndex].name).removeClass('icon-' + loopList[oldIndex].type).addClass('icon-' + loopList[loopIndex].type);
        localStorage.loopIndex = loopIndex;
    });

    //点击下一首切歌
    $('#next').click(function() {
        if (loopIndex == 1) {
            loopRandom();
        } else {
            nextList();
        }
        $('#play').removeClass('icon-pause').addClass('icon-play');
    });

    //点击上一首切歌
    $('#prev').click(function () {
        if (loopIndex == 1) {
            loopRandom();
        } else {
            prevList();
        }
        $('#play').removeClass('icon-pause').addClass('icon-play');
    })


    //根据播放时间更新进度条位置和显示时间
    function updateTime() {
        let current = audio.currentTime,
            circle = $('#circle'),
            left = Math.floor(current/audio.duration * rangeL) + 'px';
            // console.log(current);
        circle.css('left', left);
        $('#current_time').text(secToMin(current));
    }
    //播放音乐时监听timeupdate事件更新进度条进度
    $('#audio').on('timeupdate', updateTime);

    //点击进度条设置播放时间
    $('#progress_wrapper').on('click', function (e) {
        let audio = $('#audio').get(0);
        let x = e.offsetX;
        let rate = x/rangeL;
        audio.currentTime = audio.duration * rate;
    });
    //移动小圆点调整播放条进度
    $('#circle').mousedown(function(e) {
        $('#audio').off('timeupdate', updateTime);
        $(document).on('mouseup', setCurrentTime);
        let progressL = parseInt($('#range').css('width')), //进度条长度
            startL = parseInt($('#circle').css('left')),
            startR = progressL - startL,
            startX = e.clientX,
            circle = $('#circle');
        $(document).on('mousemove', function(e) {
            let mLength = e.clientX - startX;
            if (mLength<0 && Math.abs(mLength) >= startL){
                circle.css('left', 0);
            } else if(mLength>0 && mLength>=startR){
                circle.css('left', progressL + 'px');
            } else {
                let rate = (startL + mLength)/progressL,
                    l = Math.floor(progressL*rate) + 'px';
                $('#current_time').text(secToMin(audio.duration*rate));
                circle.css('left', l);
            }
        })
    });
    //松开鼠标时设置播放时间
    function setCurrentTime() {
        $(document).off('mousemove').off('mouseup');

        let left = parseInt($('#circle').css('left')),
            progressL = parseInt($('#range').css('width')),
            time = left/progressL * audio.duration;
        audio.currentTime = time;
        $('#audio').on('timeupdate', updateTime);
    };
    //阻止冒泡，否则移动进度条小圆点时会触发进度条上的点击事件
    $('#circle').click(function(e) {
        e.stopPropagation();    
    })

    
    //音量改变时，调整音量条小圆点的位置
    $('#audio').on('volumechange', function() {
        let left = parseInt(audio.volume * voiceL) +'px';
        $('#voice_circle').css('left', left);
        localStorage.volume = audio.volume;        
    })
    //点击音量条设置音量
    $('#voice_wrapper').click(function (e) {
        let audio = $('#audio').get(0);
        let x = e.offsetX;
        let rate = (x/voiceL).toFixed(2);
        audio.volume = rate;
    });
    //移动小圆点设置音量
    $('#voice_circle').mousedown(function(e) {
        //松开鼠标时清空document上的事件处理程序
        $(document).on('mouseup', function() {  
            $(document).off('mousemove').off('mouseup');
        });

        //取得按下鼠标时的位置信息
        let startL = parseInt($('#voice_circle').css('left')),  //小圆点到进度条左端的距离
            startR = voiceL - startL,   //小圆点到进度条右端的距离
            startX = e.clientX;     //按下鼠标时的x坐标
        $(document).on('mousemove', function (e) {
            let currentX = e.clientX;
            mLength = currentX - startX; //鼠标移动的距离
            // 向左移动，当移动的距离大于初始left时，音量变为0
            if (mLength < 0) {
                if (Math.abs(mLength) >= startL) {
                    audio.volume = 0;
                } else {
                    let rate = ((startL+mLength)/voiceL).toFixed(2);
                    audio.volume = rate;
                }
            } else {
                if (mLength >= startR) {
                    audio.volume = 1;
                } else{
                    let rate = ((startL+mLength)/voiceL).toFixed(2);
                    audio.volume = rate;
                }
            }
        });
    });
    //阻止冒泡，否则移动音量条小圆点时会触发音量条上的点击事件
    $('#voice_circle').click(function(e) {
        e.stopPropagation();    
    })


    //通过改变songIndex实现三种循环方式
    //列表循环下一首
    function nextList () {
        songIndex++;
        if(songIndex == list.length) {
            songIndex = 0;
        }
        playSong();
    }
    //列表循环上一首
    function prevList () {
        songIndex--;
        if(songIndex == -1) {
            songIndex = list.length-1;
        }
        playSong();
    }
    //随机播放
    function loopRandom () {
        songIndex = Math.round(Math.random()*(list.length-1));
        playSong();
    }
    //根据songIndex刷新播放界面
    function playSong () {        
        updateData(); 

        audio.play();
        if (audio.paused) {
            $('#play').removeClass('icon-pause').addClass('icon-play');
        }
        localStorage.songIndex = songIndex;
    }
    //播完自动切换下一首
    $('#audio').on('ended', function() {
        if (loopIndex == 0) {
            nextList();
        } else if (loopIndex == 1) {
            loopRandom();
        } else {
            playSong();
        }
    })


    //获取歌词，处理后插入页面  一定要先于showLine（init lrcArr）
    function insertLrc() {
        let eLrc = $('.lrc');        
        let path = '/static/lrc/' + list[songIndex].singer + ' - ' + list[songIndex].name +'.lrc';
        $.ajax({url: path, success: function(data) {
            str = data;
        
            let strArr = str.split('\n');    //拆分换行符得到歌词数组
            lrcArr = strArr.map(item => {
                let time = minToSec(item.substring(item.indexOf('[') + 1, item.indexOf(']')));
                let word = item.substring(item.lastIndexOf(']') + 1);
                return {time, word};
            })
            eLrc.html('');
            lrcArr.forEach(item => {
                let li = `<li>${item.word}</li>`;
                eLrc.append(li);
            });

            $('#audio').on('timeupdate', showLine);
        }, error: function() {
            $('#audio').off('timeupdate', showLine);            
            eLrc.html(`<li style='color:#fff'>抱歉，本首歌暂不提供歌词！</li>`);
        }});
    }

    //检测当前时间对应的歌词行索引, 高亮并滚动到索引行
    function showLine () {
        let lineIndex = 0; //歌词索引行

        if(audio.currentTime < lrcArr[1].time){
            lineIndex = 0;
        }else if (audio.currentTime > lrcArr[lrcArr.length-1].time) {
            lineIndex = lrcArr.length - 1;
        } else {
            lrcArr.forEach((item, index, arr) => {
                if(audio.currentTime >= item.time && audio.currentTime < arr[index+1].time) {
                    lineIndex = index;
                }
            })
        }  

        $('.highlight').removeClass('highlight');
        $('.lrc li').eq(lineIndex).addClass('highlight');

        let top = -parseInt(($('.lrc li').eq(lineIndex).position().top)); 
        if(lineIndex > 0) {
            top += 50;
        } 
        $('.lrc').css('top', top + 'px');
    }


    //秒 => 分钟
    function secToMin (second) {
        let min = Math.floor(second/60);
        if (min<10) {
            min = '0' + min;
        }
        let sec = Math.floor(second%60);
        if (sec<10) {
            sec = '0' + sec
        }
        return `${min}:${sec}`
    }
    //分钟 => 秒
    function minToSec (time) {
        let arr = time.split(':');
        return (arr[0]*60 + parseFloat(arr[1])).toFixed(2);
    }

});
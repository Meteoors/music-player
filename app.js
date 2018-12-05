const Koa = require('koa');

const app = new Koa();

const fs = require('mz/fs');
const mime = require('mime');
const path = require('path');

app.use(async (ctx, next) => {
    console.log(ctx.request.path);
    let rpath = decodeURI(ctx.request.path),
        url = '/static/',
        dir = __dirname + '/static';
    if (rpath.startsWith(url)) {
        let fp = path.join(dir, rpath.substring(url.length));
        if (await fs.exists(fp)) {
            if(rpath.endsWith('.mp3')) {
                ctx.response.set('Accept-Ranges', 'bytes')
            }

            if(rpath.endsWith('.lrc')) {
                ctx.response.type = 'text/plain';
            } else {
                ctx.response.type = mime.lookup(fp);
            }

            ctx.response.body = await fs.readFile(fp);
        } else {
            ctx.response.status = 404;
        }
    } else {
        ctx.response.status = 404;        
    }
});

app.listen('3000');
console.log('app started at port 3000');
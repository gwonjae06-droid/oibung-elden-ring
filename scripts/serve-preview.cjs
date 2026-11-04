const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),port=Number(process.env.PORT||8137);
http.createServer((req,res)=>{try{
 let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 const size=fs.statSync(file).size,mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg'};
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');res.setHeader('Cache-Control','no-store');
 const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let start=0,end=size-1;if(range){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;if(start>end){res.writeHead(416).end();return;}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});}else res.setHeader('Content-Length',size);
 fs.createReadStream(file,{start,end}).pipe(res);
}catch{res.writeHead(404).end('Not found');}}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port+'/spider-combat.html'));

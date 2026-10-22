import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {WebSocketServer,WebSocket} from 'ws';
import {createCoopRooms} from './rooms.mjs';
const port=Number(process.env.PORT||8080);
const origins=new Set((process.env.ALLOWED_ORIGINS||'http://localhost:8000,http://127.0.0.1:8000').split(',').map(s=>s.trim()).filter(Boolean));
// No battle adapter yet: production start requests are deliberately rejected.
const rooms=createCoopRooms(),peers=new Map(),buckets=new Map();
const server=http.createServer((req,res)=>{if(req.url==='/health'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,stage:'lobby-only',battleAvailable:false}));}else{res.writeHead(404);res.end();}});
const wss=new WebSocketServer({server,path:'/coop',maxPayload:4096,perMessageDeflate:false,verifyClient:info=>origins.has(info.origin)&&wss.clients.size<128});
function send(ws,data){if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<65536)ws.send(JSON.stringify(data));else if(ws.bufferedAmount>=65536)ws.terminate();}
function depart(id){let state;try{state=rooms.snapshot(id);}catch{return;}const result=rooms.leave(id);if(result?.closed)for(const p of state.players){const peer=peers.get(p.id);if(peer&&p.id!==id)send(peer.ws,{type:'room_closed',code:result.code,reason:result.reason});}}
function broadcast(){for(const state of rooms.snapshots())for(const p of state.players){const peer=peers.get(p.id);if(peer)send(peer.ws,{type:'state',selfId:p.id,state});}}
wss.on('connection',(ws,req)=>{
 const id=randomUUID(),ip=req.socket.remoteAddress||'unknown';peers.set(id,{ws,alive:true});send(ws,{type:'hello',id,version:1});
 ws.on('pong',()=>{const p=peers.get(id);if(p)p.alive=true;});
 ws.on('message',(raw,binary)=>{try{
  if(binary)throw Error('TEXT_ONLY');const now=Date.now();let bucket=buckets.get(ip);
  if(!bucket||now-bucket.since>=1000){bucket={since:now,count:0};buckets.set(ip,bucket);}if(++bucket.count>100)throw Error('RATE_LIMIT');
  const message=JSON.parse(raw.toString());if(!message||typeof message!=='object'||Array.isArray(message))throw Error('BAD_MESSAGE');
  if(message.type==='leave'){depart(id);send(ws,{type:'left'});}
  else rooms.handle(id,message);
  broadcast();
 }catch(error){send(ws,{type:'error',code:error instanceof SyntaxError?'BAD_JSON':error.message});}});
 ws.on('error',()=>ws.terminate());
 ws.on('close',()=>{peers.delete(id);depart(id);broadcast();});
});
let last=performance.now(),acc=0;
const timer=setInterval(()=>{const now=performance.now();acc=Math.min(.05,acc+(now-last)/1000);last=now;while(acc>=1/60){rooms.tick(1/60);acc-=1/60;}broadcast();},50);
const heartbeat=setInterval(()=>{for(const p of peers.values()){if(!p.alive)p.ws.terminate();else{p.alive=false;p.ws.ping();}}const now=Date.now();for(const [ip,b]of buckets)if(now-b.since>60000)buckets.delete(ip);},15000);
function shutdown(){clearInterval(timer);clearInterval(heartbeat);for(const p of peers.values())p.ws.terminate();wss.close();server.close();}
process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
server.listen(port,'0.0.0.0',()=>console.log('Oibung lobby server on port '+port+'; combat is not connected.'));

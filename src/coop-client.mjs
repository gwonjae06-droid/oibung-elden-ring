export function connectCoop(url,{onMessage=()=>{},onClose=()=>{},onError=()=>{}}={}){
 const endpoint=new URL(url,globalThis.location?.href);
 if(!['ws:','wss:'].includes(endpoint.protocol))throw Error('WebSocket 주소가 필요합니다.');
 if(globalThis.location?.protocol==='https:'&&endpoint.protocol!=='wss:')throw Error('HTTPS 게임에서는 WSS 서버가 필요합니다.');
 const socket=new WebSocket(endpoint);let closed=false;
 socket.addEventListener('message',e=>{try{onMessage(JSON.parse(e.data));}catch(error){onError(error);}});
 socket.addEventListener('error',()=>onError(Error('멀티 서버 연결 오류')));
 socket.addEventListener('close',()=>{closed=true;onClose();});
 function send(type,data={}){if(closed||socket.readyState!==WebSocket.OPEN)throw Error('멀티 서버가 연결되지 않았습니다.');socket.send(JSON.stringify({...data,type}));}
 return {socket,create:(name,weapon='sword',boss='kwon')=>send('create',{name,weapon,boss}),join:(code,name,weapon='sword',boss)=>send('join',{code,name,weapon,boss}),ready:value=>send('ready',{value}),start:()=>send('start'),input:(epoch,seq,x,z,action=null)=>send('input',{epoch,seq,x,z,action}),leave:()=>send('leave'),close:()=>socket.close()};
}

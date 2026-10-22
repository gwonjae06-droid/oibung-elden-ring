import {randomInt} from 'node:crypto';
export const COOP_VERSION=1;
const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const weapons=new Set(['sword','hammer','bow','cards']);
const fail=code=>{throw new Error(code);};
export function createCoopRooms({battleFactory=null,maxRooms=32}={}){
 const rooms=new Map(),members=new Map();let clock=0;
 function roomOf(id){const code=members.get(id);return rooms.get(code)||fail('NOT_IN_ROOM');}
 function view(r){return {version:COOP_VERSION,code:r.code,host:r.host,phase:r.phase,epoch:r.epoch,battleAvailable:Boolean(battleFactory),players:[...r.players].map(([id,p])=>({id,name:p.name,weapon:p.weapon,ready:p.ready})),battle:r.battle?.snapshot()??null};}
 function player(id,data={}){const name=typeof data.name==='string'?data.name.replace(/[\x00-\x1f\x7f]/g,'').trim().slice(0,16):'';if(!weapons.has(data.weapon??'sword'))fail('BAD_WEAPON');return {name:name||'모험가',weapon:data.weapon??'sword',ready:false,seq:-1,lastInput:0,actions:[],input:{x:0,z:0}};}
 function begin(r,id){if(r.host!==id)fail('HOST_ONLY');if(!battleFactory)fail('BATTLE_NOT_CONNECTED');if(r.players.size!==2||![...r.players.values()].every(p=>p.ready))fail('NOT_READY');r.battle=battleFactory([...r.players].map(([id,p])=>({id,weapon:p.weapon})));r.epoch++;r.phase='playing';for(const p of r.players.values()){p.seq=-1;p.lastInput=clock;p.actions=[];p.input={x:0,z:0};}}
 function handle(id,message){
  if(!message||typeof message!=='object'||Array.isArray(message))fail('BAD_MESSAGE');
  const type=message.type;
  if(type==='create'||type==='join'){
   if(members.has(id))fail('ALREADY_IN_ROOM');
   const p=player(id,message);
   if(type==='create'){
    if(rooms.size>=maxRooms)fail('ROOM_LIMIT');let code;do{code=Array.from({length:6},()=>chars[randomInt(chars.length)]).join('');}while(rooms.has(code));
    rooms.set(code,{code,host:id,phase:'lobby',epoch:0,players:new Map([[id,p]]),battle:null});members.set(id,code);return view(rooms.get(code));
   }
   const code=typeof message.code==='string'?message.code.toUpperCase():'';
   const r=rooms.get(code)||fail('ROOM_NOT_FOUND');if(r.phase!=='lobby')fail('ROOM_IN_PROGRESS');if(r.players.size>=2)fail('ROOM_FULL');r.players.set(id,p);members.set(id,code);return view(r);
  }
  const r=roomOf(id),p=r.players.get(id);
  if(type==='ready'){if(r.phase!=='lobby')fail('NOT_IN_LOBBY');if(typeof message.value!=='boolean')fail('BAD_READY');p.ready=message.value;}
  else if(type==='start'){if(r.phase!=='lobby')fail('ALREADY_STARTED');begin(r,id);}
  else if(type==='input'){
   if(r.phase!=='playing')fail('NOT_PLAYING');if(message.epoch!==r.epoch)fail('STALE_EPOCH');
   if(!Number.isSafeInteger(message.seq)||message.seq<0)fail('BAD_SEQUENCE');if(message.seq<=p.seq)return view(r);
   if(!Number.isFinite(message.x)||!Number.isFinite(message.z))fail('BAD_INPUT');
   const action=message.action??null;if(![null,'light','skill','roll','heal'].includes(action))fail('BAD_ACTION');
   const n=Math.max(1,Math.hypot(message.x,message.z));if(!Number.isFinite(n))fail('BAD_INPUT');if(action&&p.actions.length>=4)fail('ACTION_QUEUE_FULL');p.input={x:message.x/n,z:message.z/n};if(action)p.actions.push(action);p.seq=message.seq;p.lastInput=clock;
  }else fail('UNKNOWN_MESSAGE');
  return view(r);
 }
 function leave(id){const code=members.get(id),r=rooms.get(code);members.delete(id);if(!r)return null;
  r.players.delete(id);if(r.host===id){for(const other of r.players.keys())members.delete(other);rooms.delete(code);return {code,closed:true,reason:'HOST_LEFT'};}
  if(r.phase==='playing'){r.phase='lobby';r.battle=null;}for(const p of r.players.values()){p.ready=false;p.actions=[];p.input={x:0,z:0};}return view(r);
 }
 function tick(dt){if(!Number.isFinite(dt)||dt<=0||dt>.05)fail('BAD_DT');clock+=dt;for(const r of rooms.values())if(r.phase==='playing'){
  r.battle.step(dt,[...r.players].map(([id,p])=>{if(clock-p.lastInput>.25){p.input={x:0,z:0};p.actions=[];}return {id,...p.input,action:p.actions.shift()??null};}));
 }}
 return {handle,leave,tick,snapshots:()=>[...rooms.values()].map(view),snapshot:id=>view(roomOf(id))};
}

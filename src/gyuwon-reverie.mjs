export const GYUWON_REVERIE_SECONDS=58;
export const GYUWON_REVERIE_SHOTS=Object.freeze([
 {at:0,end:9,id:'unanswered',place:'aftermath'},
 {at:9,end:17,id:'day-shift',place:'shop'},
 {at:17,end:25,id:'school',place:'school'},
 {at:25,end:31,id:'night-shift',place:'shop'},
 {at:31,end:39,id:'bedroom',place:'room'},
 {at:39,end:44,id:'question',place:'room'},
 {at:44,end:50,id:'thought-cloud',place:'room'},
 {at:50,end:58,id:'into-imagination',place:'room'}
]);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const reverieEase=t=>{t=clamp(t);return t*t*(3-2*t);};
export function gyuwonReverieFrame(time){
 const t=clamp(time,0,GYUWON_REVERIE_SECONDS),shot=GYUWON_REVERIE_SHOTS.find(s=>t>=s.at&&t<s.end)||GYUWON_REVERIE_SHOTS.at(-1);
 const local=t-shot.at,progress=clamp(local/(shot.end-shot.at));
 // Only the montage cuts fade; the bedroom, realization and camera push are
 // one continuous shot with no text-based skip or change of the music clock.
 const cut=[9,17,25,31].reduce((fade,at)=>Math.max(fade,clamp(1-Math.abs(t-at)/.28)),0);
 return {time:t,shot:shot.id,place:shot.place,local,progress,cut,
  subtitle:t>=2.8&&t<6.8?'사수까지 했는데…':t>=39.4&&t<44.6?'내가 진짜 하고 싶은 일은 뭘까?':'',
  cloud:reverieEase((t-44)/6),zoom:reverieEase((t-50)/6.2),white:reverieEase((t-55.8)/2.2),
  roomFade:1-reverieEase((t-48)/7),complete:t>=GYUWON_REVERIE_SECONDS};
}
export function beginGyuwonReverie(g,emit=()=>{}){
 const e=g.gyuwon?.years;if(!e||e.legacyAnnual||e.year!==4||e.reverieComplete||e.mode==='reverie')return false;
 e.reverie={time:0,clock:null,origin:{x:g.boss.x,y:g.boss.floorY||0,z:g.boss.z},startedAt:g.time};
 e.mode='reverie';e.cast=null;e.castT=0;e.dodge=null;e.chat=[];e.wards=[];e.damageBank=0;e.resultScene=null;
 g.gyuwon.hazards.length=0;g.projectiles.length=0;g.player.action=null;g.boss.state='recovery';g.gyuwon.pattern=null;g.gyuwon.stun=0;
 emit('gyuwon-reverie-start',{year:4});return true;
}
export function tickGyuwonReverie(g,dt,emit=()=>{}){
 const e=g.gyuwon.years,r=e.reverie;if(e.mode!=='reverie'||!r)return false;
 r.time=Math.min(GYUWON_REVERIE_SECONDS,Number.isFinite(r.clock)?Math.max(r.time,r.clock):r.time+dt);
 if(r.time<GYUWON_REVERIE_SECONDS)return false;
 e.reverieComplete=true;e.reverie=null;emit('gyuwon-reverie-ended',{year:4});return true;
}

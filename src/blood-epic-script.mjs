// Shared authored cinematic clocks. Attack hazards and the camera read the
// same combat time; no wall-clock cutscene may move damage ahead of the view.
// The added warning time is precisely matched by attack duration in blood-data.
export const BLOOD_EPIC_CUTS=Object.freeze({
 requiem:Object.freeze({type:'horizon',lead:2.15,hold:1.68,finish:2.56,title:'해일의 장송'}),
 tide:Object.freeze({type:'horizon',lead:1.15,hold:.64,finish:1.16,title:'혈해 범람'}),
 eclipse:Object.freeze({type:'sky',lead:1.15,hold:.64,finish:1.16,title:'피의 일식'}),
 judgement:Object.freeze({type:'sky',lead:1.15,hold:.64,finish:1.16,title:'붉은 성창 낙하'}),
 ritual:Object.freeze({type:'altar',lead:1.15,hold:.64,finish:1.16,title:'성흔 심판'}),
 wingGenesis:Object.freeze({type:'altar',lead:1.15,hold:.64,finish:1.16,title:'혈익 개벽'}),
 lances:Object.freeze({type:'altar',lead:1.15,hold:.64,finish:1.16,title:'순교자의 혈창'}),
 cross:Object.freeze({type:'altar',lead:1.15,hold:.64,finish:1.16,title:'성혈의 십자'})
});
const clamp01=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const smooth=(a,b,t)=>{const u=clamp01((t-a)/Math.max(.001,b-a));return u*u*(3-2*u);};
export const bloodEpicKey=game=>{
 const s=game?.blood,b=game?.boss;
 return b?.state==='pattern'&&s&&BLOOD_EPIC_CUTS[s.pattern]?
  b.phase+':'+s.pattern+':'+(s.hazards?.[0]?.id??'missing'):null;
};
export function bloodEpicShotState(game,{reduced=false,skipKey=null}={}){
 const key=bloodEpicKey(game),s=game?.blood,def=key?BLOOD_EPIC_CUTS[s.pattern]:null;
 if(!def||game.status!=='playing')return {key:null,active:false,blocking:false,weight:0,firstHit:Infinity};
 const t=Math.max(0,s.t||0),firstHit=Math.min(...(s.hazards||[]).map(h=>h.warn));
 const blocking=!reduced&&skipKey!==key&&t<def.finish;
 const weight=blocking?smooth(.03,.28,t)*(1-smooth(def.hold,def.finish,t)):0;
 return {key,pattern:s.pattern,title:def.title,type:def.type,t,firstHit,
  finish:def.finish,blocking,active:blocking&&weight>.001,weight,
  phase:t<def.hold?'reveal':t<def.finish?'return':'fight',
  remainingReaction:firstHit-def.finish};
}

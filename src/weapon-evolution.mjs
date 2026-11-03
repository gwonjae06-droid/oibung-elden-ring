export const EVOLUTIONS={
 sword:[{id:'blade-wave',name:'월광 검기',text:'기본 베기마다 전방으로 검기를 발사합니다. 다시 선택하면 검기 피해가 강화됩니다.'},{id:'charged-blade',name:'축적된 일격',text:'좌클릭·J·터치 공격을 누르고 있다 떼면 차징 베기. 0.9초에 최대 3배 피해. 다시 선택하면 최대 피해 증가.'}],
 hammer:[{id:'earth-wave',name:'대지의 파동',text:'일반 강타마다 전방으로 무거운 충격파를 보냅니다. 중복 선택 시 파동 강화.'},{id:'blood-hammer',name:'붉은 망치',text:'유효한 일반 공격 피해의 12%를 회복합니다. 중복 선택 시 24%.'}],
 bow:[{id:'twin-arrow',name:'갈래 화살',text:'일반 사격에 화살 한 발을 추가합니다. 중복 선택 시 총 세 발.'},{id:'piercing-arrow',name:'별을 꿰는 활',text:'일반 화살이 더 빠르고 30% 강해지며 관통합니다. 중복 선택 시 피해 강화.'}],
 cards:[{id:'wide-deck',name:'오색의 패',text:'일반 공격을 다섯 장으로 넓힙니다. 중복 선택 시 일곱 장.'},{id:'blood-deck',name:'생명을 거는 패',text:'유효한 일반 카드 피해의 8%를 회복합니다. 중복 선택 시 16%.'}],
};
export const evolutionCount=(game,id)=>(game.evolutions||[]).filter(x=>x===id).length;
export function consumeBattleGrace(game,dt){if(!(game.startGrace>0))return false;game.startGrace=Math.max(0,game.startGrace-Math.max(0,dt));return true;}
// Capture only the attack command; ordinary attacks keep their existing input route.
export function installChargeInput(target,{getGame,isActive,listen,act}){
 const relevant=e=>e.code==='KeyJ'||(e.button===0&&(e.target?.id==='world'||e.target?.closest?.('[data-act="light"]')))||e.target?.closest?.('[data-act="light"]');
 const down=e=>{const g=getGame();if(g.player.action?.kind==='charging'&&(e.code==='Space'||e.target?.closest?.('[data-act="roll"]'))){g.player.action=null;return;}if(!isActive()||!evolutionCount(g,'charged-blade')||!relevant(e))return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)act(g,'charge-start');};
 const up=e=>{const g=getGame();if(!(e.code==='KeyJ'||e.type==='pointerup'&&e.button===0)||g.player.action?.kind!=='charging')return;e.preventDefault();e.stopImmediatePropagation();if(isActive())act(g,'charge-release');else g.player.action=null;};
 const cancel=()=>{const g=getGame();if(g.player.action?.kind==='charging')g.player.action=null;};
 listen(target,'keydown',down,true);listen(target,'keyup',up,true);listen(target,'pointerdown',down,true);listen(target,'pointerup',up,true);listen(target,'pointercancel',cancel,true);listen(target,'lostpointercapture',cancel,true);
}

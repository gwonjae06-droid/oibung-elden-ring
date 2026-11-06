export const EVOLUTIONS={
 sword:[{id:'blade-wave',name:'월광 검기',text:'기본 베기마다 전방으로 검기를 발사합니다. 다시 선택하면 검기 피해가 강화됩니다.'},{id:'charged-blade',name:'축적된 일격',text:'좌클릭·J·터치 공격을 누르고 있다 떼면 차징 베기. 0.9초에 최대 3배 피해. 다시 선택하면 최대 피해 증가.'}],
 hammer:[{id:'earth-wave',name:'대지의 파동',text:'일반 강타마다 전방으로 무거운 충격파를 보냅니다. 중복 선택 시 파동 강화.'},{id:'blood-hammer',name:'붉은 망치',text:'유효한 일반 공격 피해의 5%를 회복합니다. 두 번째 각인 시 10%.'}],
 bow:[{id:'twin-arrow',name:'불화살',text:'일반 화살에 불꽃을 둘러 화염 추가 피해 12%. 두 번째 각인 시 24%. 화살 수는 늘어나지 않습니다.'},{id:'piercing-arrow',name:'질풍의 회피',text:'활 사용 중 회피 거리 20% 증가. 두 번째 각인 시 35% 증가. 화살은 관통하지 않습니다.'}],
 cards:[{id:'wide-deck',name:'운명의 순환',text:'파랑→빨강→노랑 카드 스킬이 평타마다 번갈아 자동 발동합니다(위력 하향). 두 번째 각인은 효과 강화. 카드 장수는 유지됩니다.'},{id:'blood-deck',name:'생명을 거는 패',text:'유효한 일반 카드 피해의 8%를 회복합니다. 중복 선택 시 16%.'}],
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

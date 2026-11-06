export const EVOLUTIONS={
 sword:[{id:'blade-wave',name:'검기',text:'기본 베기를 할 때 전방에 검기가 생성됩니다. 2각인 시 검기 피해가 강화됩니다.'},{id:'charged-blade',name:'장검의 영역',text:'검의 외형과 실제 근접 사정거리가 모두 2배가 됩니다. 2각인 시 추가 피해를 얻습니다.'}],
 hammer:[{id:'earth-wave',name:'받아내는 철벽',text:'스킬 사용 시 1.2초간 받는 피해가 50%로 줄어들고, 막아낸 피해 50%를 다음 평타에 더합니다. 2각인은 재사용 대기시간 감소.'},{id:'blood-hammer',name:'회귀하는 철추',text:'스킬로 해머를 던져 타격하고 자동 회수합니다. 투척 경직은 기본 해머의 1.3배. 2각인 시 투척 피해 강화.'}],
 bow:[{id:'twin-arrow',name:'후퇴 연사',text:'스킬로 뒤쪽으로 도약하며 일반 화살 두 발을 발사합니다. 2각인 시 스킬 재사용 대기시간 감소.'},{id:'piercing-arrow',name:'화염의 시위',text:'일반 화살에 불이 붙고 적중 시 직접 피해에 더해 3초 동안 약 1회분의 추가 피해를 줍니다. 2각인 시 화상 피해 강화.'}],
 cards:[{id:'wide-deck',name:'삼중 문양',text:'기본 카드 공격이 적중할 때마다 보스에게 문양을 새깁니다. 3번 적중하면 문양이 터져 추가 피해와 경직을 줍니다. 2각인 시 폭발 강화.'},{id:'blood-deck',name:'생명을 거는 패',text:'일반 카드 공격의 실제 피해 8%를 회복합니다. 2각인 시 16% 회복.'}]
};
export const evolutionCount=(game,id)=>(game.evolutions||[]).filter(x=>x===id).length;
export function consumeBattleGrace(game,dt){if(!(game.startGrace>0))return false;game.startGrace=Math.max(0,game.startGrace-Math.max(0,dt));return true;}
// Legacy charge handler API; the old charge specialization has retired.
export function installChargeInput(){return ()=>{};}

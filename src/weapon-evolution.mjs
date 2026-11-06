export const EVOLUTIONS={
 sword:[
  {id:'blade-wave',name:'검기',text:'일반 베기 때 실제로 날아가는 검기가 생성됩니다. 2각인 시 검기 피해가 증가합니다.'},
  {id:'charged-blade',name:'장검의 확장',text:'검의 외형과 실제 근접 사거리가 정확히 2배가 됩니다. 2각인 시 근접 타격의 경직 누적이 증가합니다.'}
 ],
 hammer:[
  {id:'earth-wave',name:'피해 저장',text:'스킬을 사용해 1.2초 동안 받는 피해를 절반으로 줄입니다. 막은 50%의 피해를 다음 직접 타격에 더합니다. 2각인은 저장 피해의 위력을 강화합니다.'},
  {id:'blood-hammer',name:'귀환 철추',text:'망치를 던져 피해를 주고, 자동으로 돌아옵니다. 투척 공격의 경직 누적은 1.3배이며, 2각인 시 피해가 강화됩니다.'}
 ],
 bow:[
  {id:'twin-arrow',name:'후퇴 사격',text:'스킬 사용 시 뒤로 도약하면서 일반 화살 2발을 발사합니다. 2각인은 스킬 재사용 시간을 단축합니다.'},
  {id:'piercing-arrow',name:'화염의 시위',text:'일반 화살이 명중하면 초기 피해만큼의 화상 피해를 시간에 걸쳐 추가합니다(총 약 2배). 2각인은 화상 지속 시간을 늘립니다.'}
 ],
 cards:[
  {id:'wide-deck',name:'삼중 낙인',text:'유효한 카드 일반 공격 적중마다 보스에 문양이 하나 쌓이고 3회째 폭발해 피해와 짧은 경직을 줍니다. 한 번의 3장 발사는 1회로 셉니다.'},
  {id:'blood-deck',name:'생명 흡수',text:'카드 일반 공격이 실제로 준 피해의 일부를 흡혈합니다. 1각인 8%, 2각인 16%.'}
 ]
};
export const evolutionCount=(game,id)=>(game.evolutions||[]).filter(x=>x===id).length;
export function consumeBattleGrace(game,dt){if(!(game.startGrace>0))return false;game.startGrace=Math.max(0,game.startGrace-Math.max(0,dt));return true;}
// Compatibility export for cached battle modules. Charge-attacking was
// replaced by the permanent doubled sword reach; no legacy listeners remain.
export const installChargeInput=()=>{};

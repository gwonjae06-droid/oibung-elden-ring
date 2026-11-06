// Shared meter contract, including accessibility values when only the maximum changes.
export function renderBattleMeter(element,value,max,{round=Math.ceil}={}) {
  const ratio=Number.isFinite(value)&&Number.isFinite(max)&&max>0
    ?Math.max(0,Math.min(1,value/max)):0;
  const transform='scaleX('+ratio+')';
  if(element.style.transform!==transform)element.style.transform=transform;
  const now=String(round(value)),limit=String(max),meter=element.parentElement;
  if(meter.getAttribute('aria-valuenow')!==now)meter.setAttribute('aria-valuenow',now);
  if(meter.getAttribute('aria-valuemax')!==limit)meter.setAttribute('aria-valuemax',limit);
}

export function renderSharedHud(root,game,skill,{weaponName,lockLabel,round=Math.ceil}={}) {
  const get=id=>root.getElementById(id),player=game.player,boss=game.boss;
  const text=(id,value)=>{const element=get(id),next=String(value);if(element.textContent!==next)element.textContent=next;};
  for(const [id,value,max] of [['hp-fill',player.hp,player.maxHp],['stamina-fill',player.stamina,100],['boss-fill',boss.hp,boss.maxHp],['skill-fill',skill.ratio*100,100]])renderBattleMeter(get(id),value,max,{round});
  text('hp-value',Math.ceil(player.hp));text('stamina-value',Math.floor(player.stamina));text('flasks',player.potions);
  text('weapon-label',weaponName);text('lock-label',lockLabel);text('skill-name',skill.name);text('skill-text',skill.text);
  Object.assign(get('skill-hud').dataset,{card:skill.card,ready:String(skill.ready),weapon:game.weapon});
  text('boss-value',round(boss.hp).toLocaleString('ko-KR')+' / '+boss.maxHp.toLocaleString('ko-KR'));
}

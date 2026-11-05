import {EVOLUTIONS} from './weapon-evolution.mjs';
import {flameBalance,forgeTier,investedFlames,FORGE_MAX_TIER} from './purification-forge.mjs';

export const FORGE_WEAPON_NAMES=Object.freeze({sword:'검',hammer:'망치',bow:'활',cards:'카드'});
export const FORGE_TIER_NAMES=Object.freeze({
 'blade-wave':['검기의 해방','월광의 증폭'],'charged-blade':['축적된 일격','응축된 파괴'],
 'earth-wave':['대지의 울림','파동의 격류'],'blood-hammer':['피의 계약','붉은 수확'],
 'twin-arrow':['갈래의 각인','세 갈래 운명'],'piercing-arrow':['별을 꿰는 활','성좌의 관통'],
 'wide-deck':['오색의 패','일곱 운명의 패'],'blood-deck':['생명의 도박','심홍의 대가']
});
const safe=n=>String(Math.max(0,Math.floor(Number(n)||0)));
const html=(...parts)=>parts.join('');
export const flameMark=(type='small')=>html(
 '<svg class="j-flame-icon j-flame-',type,'" viewBox="0 0 88 112" aria-hidden="true" focusable="false">',
 '<path d="M43 105C14 105 5 80 12 58c5-17 22-27 22-49 17 12 25 28 17 47 13-7 19-19 17-31 29 31 23 80-25 80Z" fill="#d6a15c" stroke="#fce5aa" stroke-width="2"/>',
 '<path d="M44 99c-16 0-25-12-19-27 3-8 12-15 16-28 14 13 10 21 6 28 6-3 10-8 11-15 15 20 4 42-14 42Z" fill="#fff1b7"/>',
 '<path d="M43 8c1 11-4 19-7 24M68 25c-3 9-5 13-12 19" fill="none" stroke="#fff5d2" stroke-linecap="round" stroke-width="2"/>',
 '</svg>'
);
export const flameCounter=profile=>html(
 '<span class="j-flame-counter" aria-label="정화의 불꽃 ',safe(flameBalance(profile)),'개">',
 flameMark('tiny'),'<span>정화의 불꽃</span><strong>',safe(flameBalance(profile)),'</strong></span>'
);
export function forgeScreen(profile,weapon,{button,back,warning,devNotice=''}){
 const w=Object.hasOwn(EVOLUTIONS,weapon)?weapon:'sword',balance=flameBalance(profile),owned=investedFlames(profile,w);
 const symbols={sword:'⚔',hammer:'◆',bow:'➶',cards:'✧'};
 const tabs=Object.entries(FORGE_WEAPON_NAMES).map(([id,label])=>button('forge-weapon',
  html('<span class="j-forge-weapon-symbol">',symbols[id],'</span><strong>',label,
   '</strong><small>',safe(investedFlames(profile,id)),'개 각인</small>'),
  'data-weapon="'+id+'" class="j-forge-tab '+(w===id?'j-forge-current':'')+'" aria-pressed="'+(w===id)+'"'
 )).join('');
 const trees=EVOLUTIONS[w].map((e,branch)=>{
  const rank=forgeTier(profile,w,e.id);
  const nodes=Array.from({length:FORGE_MAX_TIER},(_,i)=>{
   const tier=i+1,active=rank>=tier,can=rank===i&&balance>0,locked=rank<i;
   const label=FORGE_TIER_NAMES[e.id][i];
   return html('<div class="j-forge-node-wrap ',active?'j-forge-owned':locked?'j-forge-locked':'j-forge-available','">',
    '<span class="j-forge-chain" aria-hidden="true"></span>',
    button('forge-buy',html('<span class="j-forge-node-glyph" aria-hidden="true">',active?'✦':locked?'◇':'✧',
      '</span><span class="j-forge-node-copy"><strong>제',tier,'각인 · ',label,'</strong><small>',
      active?'해방된 불꽃':locked?'이전 각인 필요':balance>0?'정화의 불꽃 1개 소모':'불꽃 부족',
      '</small></span>'),
     'class="j-forge-node" data-evolution="'+e.id+'" data-tier="'+tier+'" '+(can?'':'disabled')+
     ' aria-label="'+label+' '+(active?'습득 완료':locked?'이전 단계 필요':balance?'1개 사용 가능':'불꽃 부족')+'"'),
    '</div>');
  }).join('');
  return html('<section class="j-forge-branch" data-branch="',e.id,'" aria-label="',e.name,' 진화 계열">',
   '<div class="j-forge-branch-heading"><span class="j-forge-path-index">0',branch+1,
   ' / PATH</span><h2>',e.name,'</h2><p>',e.text,'</p><span class="j-forge-rank">',
   rank,' / ',FORGE_MAX_TIER,' 각인</span></div><div class="j-forge-node-line">',nodes,'</div></section>');
 }).join('');
 return html('<div class="j-panel j-forge">',
  '<p class="j-kicker">THE ASHEN SMITHY · 불꽃과 강철의 서약</p>',
  '<div class="j-forge-heading"><div><h1>대장간</h1><p>쓰러뜨린 자들의 잔불을 무기에 새기십시오.',
  '진화는 현재 브라우저에 영구히 남으며, 다른 여정에서도 적용됩니다.</p></div>',
  '<div class="j-forge-kiln" aria-hidden="true"><div class="j-forge-halo"></div>',flameMark('large'),
  '<span>FORGED IN OATH</span></div></div>',
  '<div class="j-forge-resources"><span>보유한 정화의 불꽃</span>',flameCounter(profile),
  '<small>누적 획득 ',safe(profile.earnedFlames),'개 · 총 투자 ',safe(investedFlames(profile)),'개</small></div>',
  '<nav class="j-forge-tabs" aria-label="진화할 무기 선택">',tabs,'</nav>',
  '<div class="j-forge-trees">',trees,'</div>',
  '<div class="j-forge-bottom"><div><strong>',FORGE_WEAPON_NAMES[w],'에 투자한 불꽃 ',owned,
  '개</strong><p>반환하면 이 무기의 모든 진화가 해제되고 투자한 불꽃 ',owned,
  '개를 돌려받습니다. 다른 무기에 다시 투자할 수 있습니다.</p></div>',
  button('forge-refund','↶ 불꽃 반환 · +'+owned,'class="j-forge-refund" data-weapon="'+w+'" '+(owned?'':'disabled')),
  '</div><div class="j-forge-developer" data-forge-dev-easter-egg="true"><span class="j-forge-dev-mark">DEV</span>',
  '<span>개발자용 이스터에그 · 대장간에서 <kbd>;</kbd> 키를 누르면 정화의 불꽃 <strong>+2</strong></span></div>',
  devNotice?'<p class="j-forge-dev-result" role="status" aria-live="polite">'+devNotice+'</p>':'',
  back(),warning(),'</div>');
}
export function flameRewardScreen(profile,bossName,{button,back,warning,complete=false}){
 return html('<div class="j-panel j-flame-result"><p class="j-kicker">PURIFICATION · 시련의 잔불</p>',
  '<div class="j-earned-circle" aria-hidden="true"><div class="j-earned-rays"></div>',
  flameMark('earned'),'</div>',
  '<p class="j-flame-overline">',bossName,' 토벌</p>',
  '<h1>정화의 불꽃을 획득했습니다</h1>',
  '<p>소멸한 지배자의 혼에서 작은 빛 하나가 되살아났습니다. 불꽃은 메인화면의 ',
  '<strong>대장간</strong>에서 영구 무기 진화에 쓰거나, 메인에서 1개를 사용해 해금된 마지막 보스로 건너뛸 수 있습니다.</p>',
  '<div class="j-earned-balance">',flameCounter(profile),'<span>+1 정화의 불꽃</span></div>',
  button('flame-next',complete?'서약의 기록을 마주한다':'다음 시련으로','class="j-primary"'),
  back(),warning(),'</div>');
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {renderBattleMeter,renderSharedHud} from '../src/battle-hud.mjs';
import {loadBattleStyles} from '../src/runtime/battle-styles.mjs';

test('meter refreshes accessibility values when ratio is unchanged and bounds visual overflow',()=>{
  const attrs=new Map(),element={style:{},parentElement:{getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v)}};
  renderBattleMeter(element,50,100);renderBattleMeter(element,100,200);
  assert.equal(element.style.transform,'scaleX(0.5)');
  assert.equal(attrs.get('aria-valuenow'),'100');assert.equal(attrs.get('aria-valuemax'),'200');
  renderBattleMeter(element,250,200);assert.equal(element.style.transform,'scaleX(1)');
  renderBattleMeter(element,0,0);assert.equal(element.style.transform,'scaleX(0)');
});

test('shared HUD updates live player and skill state across a weapon switch',()=>{
  const elements=new Map(),root={getElementById(id){if(!elements.has(id)){const attrs=new Map();elements.set(id,{textContent:'',dataset:{},style:{},parentElement:{getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v)}});}return elements.get(id);}};
  const game={weapon:'sword',player:{hp:50,maxHp:120,stamina:70,potions:2},boss:{hp:1500,maxHp:3000}},skill={ratio:.5,name:'기술',text:'준비',card:'',ready:false};
  renderSharedHud(root,game,skill,{weaponName:'검',lockLabel:'록온'});
  game.weapon='cards';game.player.hp=90;skill.card='red';skill.ready=true;
  renderSharedHud(root,game,skill,{weaponName:'카드',lockLabel:'자유'});
  assert.equal(root.getElementById('hp-value').textContent,'90');assert.equal(root.getElementById('weapon-label').textContent,'카드');assert.equal(root.getElementById('skill-hud').dataset.weapon,'cards');assert.equal(root.getElementById('skill-hud').dataset.ready,'true');assert.equal(root.getElementById('lock-label').textContent,'자유');
});

test('disposing pending styles settles readiness and removes every late callback',async()=>{
  const links=[],root={prepend:link=>links.push(link)},doc={createElement:()=>({remove(){this.removed=true;}})};
  const styles=loadBattleStyles(root,doc,['base.css','skills.css']);
  const late=links[0].onload;styles.dispose();styles.dispose();late();
  assert.equal(await styles.ready,false);
  assert.ok(links.every(link=>link.onload===null&&link.onerror===null&&link.removed));
});

test('style creation failure settles without rejecting or blocking the remaining links',async()=>{
  let count=0;const links=[],root={prepend:link=>links.push(link)},doc={createElement:()=>{if(++count===1)throw Error('DOM');return {remove(){}};}};
  const styles=loadBattleStyles(root,doc,['base.css','skills.css']);links[0].onload();
  assert.equal(await styles.ready,false);styles.dispose();
});

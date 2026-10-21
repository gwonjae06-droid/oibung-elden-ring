import test from 'node:test';
import assert from 'node:assert/strict';
import {bindBossName} from '../src/boss-ui-chain.mjs';
function fixture(){
 const make=()=>({style:{position:'',transform:'',opacity:''},children:[],appendChild(x){this.children.push(x);x.parent=this;return x;},setAttribute(){},remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}});
 const root={head:make()},doc={createElement:make},name=make(),hud=make();name.textContent='긴턱의 이권재';hud.ownerDocument=doc;hud.getRootNode=()=>root;hud.querySelector=()=>name;return {hud,name};
}
test('chains bind the existing name node rather than replacing it',()=>{const {hud,name}=fixture(),binding=bindBossName(hud);binding.update(1,.5);assert.equal(hud.querySelector('h2'),name);assert.equal(name.textContent,'긴턱의 이권재');assert.equal(name.children.length,1);assert.equal(name.children[0].children.length,6);assert.match(hud.style.transform,/130px/);binding.restore();assert.equal(name.children.length,0);assert.equal(name.style.position,'');assert.equal(hud.style.transform,'');});
test('entrance-managed pull does not move or fade the HUD twice',()=>{const {hud}=fixture(),b=bindBossName(hud,false);b.update(1,1);assert.equal(hud.style.transform,'');assert.equal(hud.style.opacity,'');b.restore();});

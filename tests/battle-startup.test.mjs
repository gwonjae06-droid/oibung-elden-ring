import {qualityPixelRatio,reducedMotion} from '../src/display-preferences.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createBattleStartup,runBattleStartup} from '../src/runtime/battle-startup.mjs';

test('startup rollback releases resources in reverse order and continues after sync and async failures',async()=>{
  const startup=createBattleStartup(),calls=[];
  startup.own('dialog',()=>calls.push('dialog'));
  startup.own('renderer',()=>{calls.push('renderer');throw Error('dispose');});
  startup.own('audio',()=>{calls.push('audio');return Promise.reject(Error('close'));});
  const completion=startup.rollback();assert.deepEqual(calls,['audio','renderer','dialog']);
  assert.equal(startup.rollback(),completion);
  assert.deepEqual((await completion).errors.map(item=>item.label),['audio','renderer']);
});

test('successful startup transfers resources and preserves the original setup error on failure',()=>{
  let disposed=0;const startup=createBattleStartup();startup.resource('renderer',{dispose(){disposed++;}});startup.commit();
  startup.rollback();assert.equal(disposed,0);assert.equal(startup.pending,false);
  const original=Error('model');assert.throws(()=>runBattleStartup(scope=>{scope.own('scene',()=>disposed++);throw original;}),error=>error===original);
  assert.equal(disposed,1);
});

for(const boss of ['clown','dice'])test(boss+' launch removes its dialog and renderer when scene construction fails',()=>{
  const log=[],original=Error('scene failed');
  const node=(tag='node')=>({style:{},classList:{remove(){}},setAttribute(){},appendChild(){},append(){},remove(){if(tag==='dialog')log.push('remove');},
    showModal(){},replaceChildren(){},querySelector:()=>node(),querySelectorAll:()=>[],attachShadow:()=>({getElementById:()=>node(),append(){}}),cloneNode:()=>node()});
  const renderer=class{constructor(){this.shadowMap={};}setPixelRatio(){}dispose(){log.push('renderer');}};
  const context={qualityPixelRatio,reducedMotion,URL,runBattleStartup,selectedWeapon:weapon=>weapon,matchMedia:()=>({matches:false}),devicePixelRatio:1,
    document:{getElementById:id=>id==='arena'||id==='boss-hud'?node():null,createElement:tag=>node(tag),body:{appendChild(){}}},
    THREE:{WebGLRenderer:renderer,Scene:class{constructor(){throw original;}},PCFSoftShadowMap:1},
    window:{},createEventScope:()=>({dispose(){log.push('events');}}),createDiceUi:()=>({d:node(),root:{},$:()=>node(),canvas:{},dispose(){log.push('remove');}})};
  let source=readFileSync(new URL('../src/'+boss+'-battle.mjs',import.meta.url),'utf8');
  source=source.replace(/^import .*;\r?\n/gm,'').replaceAll('export function ','function ').replaceAll('import.meta.url',"'http://localhost/src/battle.mjs'");
  const method=boss==='clown'?'launchClownBattle':'launchDiceBattle';
  vm.runInNewContext(source+'\nglobalThis.launch='+method+';',context);
  assert.throws(()=>context.launch(),error=>error===original);
  assert.deepEqual(log,['events','renderer','remove']);
});

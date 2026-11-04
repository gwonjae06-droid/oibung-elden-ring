import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {qualityPixelRatio,reducedMotion} from '../src/display-preferences.mjs';
import {bloodQuality} from '../src/blood-fluid.mjs';
import {BLOOD_PATTERNS} from '../src/blood-data.mjs';

const dir=new URL('../src/',import.meta.url);
const files=readdirSync(dir).filter(name=>name.endsWith('.mjs'));
const read=name=>readFileSync(new URL(name,dir),'utf8');

test('A1: no source offers a player-facing skip control',()=>{
 for(const name of files)assert.doesNotMatch(read(name),/건너뛰기|skip-giant|\bskip\.(onclick|hidden)|\bhud\.skip\b/,name);
});
test('A1: Escape cannot finish a transition cinematic',()=>{
 for(const[name,node]of[['journey-transition.mjs','d'],['dice-entrance-view.mjs','dialog']]){
  const s=read(name);
  assert.ok(s.includes(node+".addEventListener('cancel',e=>e.preventDefault());"),name);
  assert.doesNotMatch(s,/addEventListener\('cancel',e=>\{e\.preventDefault\(\);end\(true\)/,name);
 }
});
test('E1: no reduced-motion or low-quality switch exists anywhere in the source',()=>{
 for(const name of files)assert.doesNotMatch(read(name),/oibung\.quality|oibung\.motion|prefers-reduced-motion|j-quality|j-motion/,name);
});
test('E1: stored or system preferences cannot enable a reduced mode',()=>{
 const keys=['localStorage','matchMedia','devicePixelRatio'],saved=keys.map(k=>Object.getOwnPropertyDescriptor(globalThis,k));
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>k==='oibung.motion'?'reduced':k==='oibung.quality'?'low':null}});
 Object.defineProperty(globalThis,'matchMedia',{configurable:true,value:()=>({matches:true})});
 Object.defineProperty(globalThis,'devicePixelRatio',{configurable:true,value:2});
 try{
  assert.equal(reducedMotion(),false);
  assert.equal(qualityPixelRatio(1.75),1.75);
  assert.deepEqual(bloodQuality({storage:{getItem:()=> 'low'}}),bloodQuality({}));
  assert.equal(bloodQuality({}).low,false);
 }finally{
  keys.forEach((k,i)=>saved[i]?Object.defineProperty(globalThis,k,saved[i]):delete globalThis[k]);
 }
});
test('B1: every blood pattern has a timed cast and a recovery window',()=>{
 for(const[id,spec]of Object.entries(BLOOD_PATTERNS))assert.ok(spec.duration>0&&spec.recover>0,id);
});
test('F1: the dice and blood battle screens carry no explanatory or instructional text',()=>{
 for(const name of['dice-ui.mjs','blood-ui.mjs'])assert.doesNotMatch(read(name),/지금 반격|빈틈|압사 주의|다음 칸으로 굴러|약점 노출|createBloodStageUi/,name);
});
test('C1: blood rectangle (lane) hazards get no ground warning mesh',()=>{
 assert.match(read('blood-view.mjs'),/h\.shape==='lane'\)continue/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {bindBattleSession} from '../src/battle-session.mjs';

function fakeUi(){
 const events=new Map(),attrs=new Map();
 const brand={
  onclick:null,getAttribute:k=>attrs.get(k)??null,
  setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),
  addEventListener:(k,fn)=>events.set(k,fn),removeEventListener:(k,fn)=>{if(events.get(k)===fn)events.delete(k);},
  fire(k,value={}){events.get(k)?.(value);}
 };
 const arena={querySelector:q=>q==='.brand'?brand:null};
 const pageEvents=[];
 const win={Event,dispatchEvent:e=>pageEvents.push(e.type)};
 const doc={defaultView:win,createElement:()=>({dataset:{},remove(){}}),
  head:{appendChild(){}},getElementById:k=>k==='arena'?arena:null,querySelectorAll:()=>[]};
 const shadow={ownerDocument:doc,host:{},appendChild(){},getElementById:k=>k==='arena'?arena:null,querySelectorAll:()=>[]};
 return {brand,doc,shadow,events,pageEvents,attrs};
}

test('original arena home header dispatches journey navigation and is keyboard operable',()=>{
 const f=fakeUi(),release=bindBattleSession(f.doc,()=>({active:true}));
 assert.equal(f.brand.getAttribute('role'),'button');
 assert.equal(f.brand.getAttribute('tabindex'),'0');
 f.brand.fire('click');
 assert.deepEqual(f.pageEvents,['oibung:home']);
 let blocked=false,stopped=false;
 f.brand.fire('keydown',{code:'Enter',preventDefault(){blocked=true;},stopPropagation(){stopped=true;}});
 assert.equal(blocked,true);assert.equal(stopped,true);
 assert.deepEqual(f.pageEvents,['oibung:home','oibung:home']);
 release();
 assert.equal(f.events.size,0,'no dangling header listeners after exit');
 assert.equal(f.brand.getAttribute('role'),null,'original header semantics restored');
});

test('cloned boss home header closes only its live session',()=>{
 const f=fakeUi();let n=0;
 const release=bindBattleSession(f.shadow,()=>({close(){n++;}}));
 f.brand.fire('click');assert.equal(n,1);
 assert.deepEqual(f.pageEvents,[]);
 release();f.brand.fire('click');assert.equal(n,1);
});

test('explicit Gyuwon/Blood home handlers are left untouched',()=>{
 const f=fakeUi();let native=0;
 f.brand.onclick=()=>native++;
 const release=bindBattleSession(f.shadow,()=>({close(){throw Error('duplicate close');}}));
 assert.equal(f.events.size,0);
 f.brand.onclick();assert.equal(native,1);
 release();assert.equal(f.brand.onclick instanceof Function,true);
});

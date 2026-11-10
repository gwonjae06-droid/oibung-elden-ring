import test from 'node:test';
import assert from 'node:assert/strict';
import {installDevBossDamage} from '../src/dev-boss-damage.mjs';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

test('event battles never accept the hidden 500 HP developer shortcut',()=>{
 const handlers=new Map();
 const win={
  addEventListener(type,fn){handlers.set(type,fn);},
  removeEventListener(type){handlers.delete(type);}
 };
 const doc={defaultView:win,querySelector:()=>null};
 const g={boss:{hp:1000},status:'playing',odenPrizeEvent:true};
 const dispose=installDevBossDamage(doc,()=>({active:true,game:g}));
 assert.equal(typeof handlers.get('keydown'),'function');
 let intercepted=false;
 handlers.get('keydown')({
  code:'Semicolon',shiftKey:false,repeat:false,isComposing:false,
  ctrlKey:false,altKey:false,metaKey:false,composedPath:()=>[],
  preventDefault(){intercepted=true;}
 });
 assert.equal(intercepted,false);
 assert.equal(g.boss.hp,1000);
 dispose();
 assert.equal(handlers.size,0);
});

test('the regular journey tags event game states before developer shortcut handlers read them',()=>{
 const script=readFileSync(fileURLToPath(new URL('../src/journey.mjs',import.meta.url)),'utf8');
 assert.match(script,/configure=g=>\{configureJourney\(g,r,profile\);if\(eventMode\)g\.odenPrizeEvent=true;/);
});

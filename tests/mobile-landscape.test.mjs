import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bindBattleSession} from '../src/battle-session.mjs';
import {isMobilePortrait,installMobileLandscape,MOBILE_LANDSCAPE_GATE_HTML} from '../src/mobile-landscape.mjs';

function rig(){
 let portrait=true,fullscreens=0,locks=0;
 const listeners=new Map(),gates=[],roots={
  arena:{appendChild(node){gates.push(node);}},
  journey:{appendChild(node){gates.push(node);}}
 };
 const win={
  matchMedia:()=>({matches:portrait}),
  addEventListener(name,fn){listeners.set(name,fn);},
  removeEventListener(name,fn){if(listeners.get(name)===fn)listeners.delete(name);},
  screen:{orientation:{
   async lock(value){assert.equal(value,'landscape');locks++;},
   addEventListener(name,fn){listeners.set('screen:'+name,fn);},
   removeEventListener(name,fn){if(listeners.get('screen:'+name)===fn)listeners.delete('screen:'+name);}
  }}
 };
 const doc={
  getElementById:id=>roots[id]??null,
  createElement:()=>({
   set innerHTML(value){this.firstElementChild={html:value,remove(){this.removed=true;}};}
  }),
  documentElement:{async requestFullscreen(){fullscreens++;}}
 };
 return {doc,win,gates,listeners,get portrait(){return portrait;},setPortrait(v){portrait=v;listeners.get('resize')?.();},get fullscreens(){return fullscreens;},get locks(){return locks;}};
}

test('mobile orientation detector never blocks desktop or a sideways device',()=>{
 assert.equal(isMobilePortrait({matchMedia:()=>({matches:false})}),false);
 assert.equal(isMobilePortrait({matchMedia:()=>({matches:true})}),true);
 assert.equal(isMobilePortrait({}),false);
});
test('landscape gate is present on main arena and every Journey screen, including cloned boss arenas',()=>{
 const f=rig(),controller=installMobileLandscape(f.doc,f.win);
 assert.ok(controller);
 assert.equal(installMobileLandscape(f.doc,f.win),controller);
 assert.equal(f.gates.length,2);
 assert.ok(f.gates.every(node=>node.html.includes('data-mobile-landscape="lock"')));
 const html=readFileSync(new URL('../spider-combat.html',import.meta.url),'utf8');
 const journey=readFileSync(new URL('../src/journey.mjs',import.meta.url),'utf8');
 const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
 assert.match(html,/installMobileLandscape\(\)/);
 assert.match(journey,/MOBILE_LANDSCAPE_GATE_HTML/);
 assert.match(css,/@media \(pointer:coarse\) and \(orientation:portrait\)/);
 assert.match(css,/\.mobile-landscape-gate\{display:flex!important\}/);
 assert.match(css,/@media \(pointer:coarse\) and \(orientation:landscape\)/);
 assert.match(MOBILE_LANDSCAPE_GATE_HTML,/휴대폰을 옆으로 돌리면/);
 controller.dispose();
 assert.equal(f.listeners.size,0);
 assert.ok(f.gates.every(node=>node.removed));
});

test('a portrait rotation pauses an active fight and resumes only the one it paused',()=>{
 const f=rig(),game={status:'playing',player:{hp:100},boss:{hp:100}};
 let active=true,pause=0,resume=0;
 const unbind=bindBattleSession(f.doc,()=>({game,active,pause:()=>{active=false;pause++;},resume:()=>{active=true;resume++;}}));
 const ctrl=installMobileLandscape(f.doc,f.win);
 assert.equal(pause,1);
 f.setPortrait(false);
 assert.equal(resume,1);
 f.setPortrait(true);
 assert.equal(pause,2);
 game.status='lost';
 f.setPortrait(false);
 assert.equal(resume,1);
 ctrl.dispose();unbind();
});

test('fullscreen/landscape request is user initiated and handles unsupported browsers',async()=>{
 const f=rig(),ctrl=installMobileLandscape(f.doc,f.win);
 const request={dataset:{mobileLandscape:'lock'}};
 f.listeners.get('click')({composedPath:()=>[request]});
 await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(f.fullscreens,1);
 assert.equal(f.locks,1);
 ctrl.dispose();
});

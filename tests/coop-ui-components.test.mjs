import test from 'node:test';
import assert from 'node:assert/strict';
import {installCoopMenu} from '../src/coop-menu.mjs';
import {openCoopRoom} from '../src/coop-ui.mjs';
class E{
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.events={};this.text='';this.value='';this.disabled=false;}
 set textContent(v){this.text=v;this.children=[];}get textContent(){return this.text+this.children.map(c=>c.textContent).join('');}
 append(...nodes){for(const n of nodes){n.remove();this.children.push(n);n.parentNode=this;}}
 insertBefore(n,b){n.remove();this.children.splice(this.children.indexOf(b),0,n);n.parentNode=this;}
 remove(){if(this.parentNode){const a=this.parentNode.children;a.splice(a.indexOf(this),1);this.parentNode=null;}}
 replaceWith(n){this.parentNode.insertBefore(n,this);this.remove();}
 setAttribute(k,v){this[k]=v;}addEventListener(t,f){(this.events[t]??=[]).push(f);}
 emit(t,v={}){v.preventDefault??=()=>{};v.stopPropagation??=()=>{};for(const f of this.events[t]||[])f(v);if(t==='click')this.onclick?.(v);}
 focus(){}showModal(){this.open=true;}close(){this.open=false;}
 match(s){if(s.startsWith('[data-'))return this.dataset[s.slice(6,-1).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]!==undefined;if(s[0]==='.')return (this.className||'').split(' ').includes(s.slice(1));return this.tagName===s;}
 closest(s){return this.match(s)?this:this.parentNode?.closest(s);}
 querySelectorAll(s){const out=[],[a,t]=s.includes(' ')?s.split(' '):[null,s];for(const c of this.children){if(c.match(t)&&(!a||c.parentNode?.closest(a)))out.push(c);out.push(...c.querySelectorAll(s));}return out;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
}
function fixture(){const body=new E('body'),head=new E('head'),timers=new Map();let observer;
 const doc={body,head,createElement:t=>new E(t),getElementById:id=>{const find=n=>n.id===id?n:n.children.map(find).find(Boolean);return find(body)||find(head)||null;},querySelectorAll:s=>body.querySelectorAll(s),querySelector:s=>body.querySelector(s)};
 const win={location:{protocol:'https:'},OIBUNG_COOP_URL:'wss://example.test/coop',localStorage:{getItem:()=>null,setItem(){}},MutationObserver:class{constructor(f){observer=f;}observe(){}disconnect(){}},setTimeout(f){timers.set(1,f);return 1;},clearTimeout(id){timers.delete(id);}};return {doc,win,timers,scan:()=>observer?.()};
}
const button=(d,t)=>d.querySelectorAll('button').find(b=>b.textContent===t);
function panel(boss='dice'){const f=fixture(),calls=[];let cb,socket;const control=openCoopRoom({boss,weapon:'hammer',...f,connect:(url,c)=>{cb=c;socket=new E('socket');return {socket,create:(...a)=>calls.push(['create',...a]),join:(...a)=>calls.push(['join',...a]),ready:v=>calls.push(['ready',v]),close:()=>calls.push(['close'])};}});return {...f,...control,calls,get cb(){return cb;},get socket(){return socket;}};}
test('chooser adds three join buttons once and preserves single-player handlers',()=>{const f=fixture(),d=new E('dialog');d.className='boss-secret';f.doc.body.append(d);let singles=0;for(const id of ['kwon','clown','dice']){const b=new E('button');b.dataset.boss=id;b.onclick=()=>singles++;d.append(b);}const calls=[],c=installCoopMenu(f.doc,f.win,{openRoom:o=>{calls.push(o);return {close(){}};}});f.scan();assert.equal(d.querySelectorAll('[data-coop-boss]').length,3);for(const b of d.querySelectorAll('[data-coop-boss]'))b.emit('click');assert.deepEqual(calls.map(o=>o.boss),['kwon','clown','dice']);d.querySelector('[data-boss]').emit('click');assert.equal(singles,1);assert.equal(installCoopMenu(f.doc,f.win),c);c.dispose();assert.equal(d.querySelectorAll('[data-coop-boss]').length,0);});
test('room dialog actually appends its fields and controls',()=>{const f=panel();assert.equal(f.dialog.querySelectorAll('input').length,3);assert.equal(f.dialog.querySelectorAll('button').length,6);assert.ok(f.dialog.textContent.includes('거대 주사위 박성원'));assert.ok(button(f.dialog,'닫기'));f.close();});
test('selected boss and weapon are passed to transport only after open (transport double)',()=>{const f=panel();f.dialog.querySelectorAll('input')[2].value='abcdef';button(f.dialog,'방 참가').emit('click');assert.deepEqual(f.calls,[]);f.socket.emit('open');assert.deepEqual(f.calls[0],['join','ABCDEF','모험가','hammer','dice']);f.close();});
test('room creation passes the selected boss (transport double)',()=>{const f=panel('clown');button(f.dialog,'방 만들기').emit('click');f.socket.emit('open');assert.deepEqual(f.calls[0],['create','모험가','hammer','clown']);f.close();});
test('invalid code and insecure URL do not connect',()=>{const f=panel();button(f.dialog,'방 참가').emit('click');assert.equal(f.socket,undefined);f.dialog.querySelectorAll('input')[0].value='ws://example.test/coop';button(f.dialog,'방 만들기').emit('click');assert.equal(f.socket,undefined);f.close();});
test('confirmed membership enables ready but not unimplemented combat',()=>{const f=panel();button(f.dialog,'방 만들기').emit('click');f.socket.emit('open');f.cb.onMessage({type:'state',selfId:'a',state:{boss:'dice',code:'ABCDEF',host:'a',phase:'lobby',players:[{id:'a',name:'친구',ready:false}]}});assert.ok(f.dialog.textContent.includes('ABCDEF'));assert.equal(button(f.dialog,'준비').disabled,false);button(f.dialog,'준비').emit('click');assert.deepEqual(f.calls.at(-1),['ready',true]);assert.equal(button(f.dialog,'전투 연결 준비 중').disabled,true);f.close();});
test('wrong boss and timeout close connection; stale callbacks are ignored',()=>{const f=panel();button(f.dialog,'방 만들기').emit('click');f.cb.onMessage({type:'state',selfId:'a',state:{boss:'clown',players:[{id:'a'}]}});assert.ok(f.dialog.textContent.includes('일치하지 않습니다'));button(f.dialog,'방 만들기').emit('click');f.timers.get(1)();assert.ok(f.dialog.textContent.includes('초과'));const cb=f.cb;f.close();cb.onClose();assert.equal(f.doc.getElementById('coop-room-dialog'),null);});

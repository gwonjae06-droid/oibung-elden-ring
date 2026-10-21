import * as THREE from 'three';
import {createClownHead} from './clown-head.mjs';
import {createAudio} from './audio.mjs';
import {bindBossName} from './boss-ui-chain.mjs';
import {transitionPose,shouldStartTransition,advanceTransition,WEAPON_NAMES,chooseWeapon,makeClownLoadout} from './transition-data.mjs';

function buildEntrance(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x100b12);scene.fog=new THREE.Fog(0x100b12,25,65);
 const camera=new THREE.PerspectiveCamera(50,1,.1,100);scene.add(new THREE.HemisphereLight(0xffead2,0x271825,1.2));
 const key=new THREE.DirectionalLight(0xffcf9f,2.8);key.position.set(8,17,12);scene.add(key);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(27,64),new THREE.MeshStandardMaterial({color:0x29212b,roughness:.85}));floor.rotation.x=-Math.PI/2;scene.add(floor);
 const ring=new THREE.Mesh(new THREE.RingGeometry(12,12.2,64),new THREE.MeshBasicMaterial({color:0x8d7043,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;scene.add(ring);
 const actor=new THREE.Group();scene.add(actor);
 const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');for(let i=0;i<16;i++){ctx.fillStyle=i%2?'#dfcfad':'#a61c33';ctx.fillRect(i*16,0,16,128);}ctx.fillStyle='#d4a83b';ctx.fillRect(0,56,256,16);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const ball=new THREE.Mesh(new THREE.SphereGeometry(2.6,48,32),new THREE.MeshStandardMaterial({map:tex,roughness:.5,metalness:.1}));ball.position.y=2.6;actor.add(ball);
 const costume=new THREE.Group();actor.add(costume);
 const red=new THREE.MeshStandardMaterial({color:0x981d38,roughness:.72}),ivory=new THREE.MeshStandardMaterial({color:0xe8d5ad,roughness:.8}),black=new THREE.MeshStandardMaterial({color:0x16101a,roughness:.6});
 const mesh=(geo,mat,x,y,z,parent=costume)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;};
 mesh(new THREE.SphereGeometry(1.05,24,18),red,0,7.25,0).scale.set(1,1.2,.75);
 mesh(new THREE.SphereGeometry(.65,18,12),red,0,6.45,0).scale.set(1,.6,.9);
 for(const s of[-1,1]){mesh(new THREE.CylinderGeometry(.24,.3,1.3,10),s<0?ivory:red,s*.45,5.85,0);mesh(new THREE.SphereGeometry(.26,12,10),s<0?ivory:red,s*.45,5.85,.07);mesh(new THREE.SphereGeometry(.4,16,12),black,s*.55,5.3,.3).scale.set(1.3,.55,1.7);}
 const arms=[];for(const s of[-1,1]){const a=new THREE.Group();a.position.set(s*.8,7.7,0);costume.add(a);const sleeve=mesh(new THREE.CylinderGeometry(.23,.3,1.5,12),s<0?red:ivory,s*.65,-.15,0,a);sleeve.rotation.z=s*Math.PI/2;mesh(new THREE.SphereGeometry(.26,12,10),s<0?red:ivory,s*.7,-.15,0,a);mesh(new THREE.SphereGeometry(.4,16,12),ivory,s*1.4,-.15,0,a);arms.push(a);}
 mesh(new THREE.CylinderGeometry(.23,.28,.7,16),ivory,0,8.7,0);
 const head=createClownHead();head.group.position.set(0,9.9,0);costume.add(head.group);
 const collar=mesh(new THREE.TorusGeometry(.72,.19,8,24),ivory,0,8.3,0);collar.rotation.x=Math.PI/2;
 costume.position.y=5.2;for(const child of costume.children)child.position.y-=5.2;
 let width=0,height=0;
 function render(p,t){const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;if(w!==width||h!==height){width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}actor.position.x=(1-p.entry)*15;actor.position.z=-2;ball.rotation.z=-actor.position.x/2.6;costume.rotation.z=Math.sin(t*2.8)*.04*(1-p.entry);costume.rotation.x=p.bow*.65;arms[0].rotation.z=(-.25-Math.sin(t*2)*.12)*(1-p.bow)+p.bow*.7;arms[1].rotation.z=(.3+Math.sin(t*3)*.18)*(1-p.bow)-p.bow*.7;head.group.rotation.x=p.bow*.1;head.setPose(p.stage==='bow'?'idle':p.entry<.95?'idle':'laugh',(t*.3)%1,t);camera.position.set(7-3*p.entry,8.5,23-4*p.entry);camera.lookAt(1,6.2,-2);renderer.render(scene,camera);}
 function dispose(){const gs=new Set(),ms=new Set(),ts=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material])){ms.add(m);if(m.map)ts.add(m.map);}});for(const g of gs)g.dispose();for(const m of ms)m.dispose();for(const t of ts)t.dispose();renderer.dispose();}
 return {render,dispose};
}

export function installBossTransition(){
 if(document.getElementById('boss-transition'))return;
 const result=document.getElementById('result'),menu=document.getElementById('menu'),change=document.getElementById('change');
 if(!result||!menu||!change)throw new Error('Transition requires the arena result/menu controls');
 const dialog=document.createElement('dialog');dialog.id='boss-transition';dialog.setAttribute('aria-label','이권재 토벌과 광대 오슬우 등장');
 dialog.innerHTML='<div class="bt-shade"></div><canvas aria-label="공 위에서 인사하는 광대 오슬우"></canvas><div class="bt-title" role="status">이권재가 토벌되었다</div><section class="bt-next"><small>즐거운 공연 · 거구의 곡예사</small><h2>광대 오슬우</h2><div class="bt-fullbar" aria-hidden="true"></div></section><section class="bt-choice" hidden aria-labelledby="bt-choice-title"><h3 id="bt-choice-title">광대전 무기 재선택</h3><p>무기를 고른 뒤 선택을 확정하세요.</p><div class="bt-weapons" role="group" aria-label="광대전 무기"></div><button class="bt-confirm">선택 확정</button><p class="bt-selection" role="status"></p></section><div class="bt-note"><span>다음 공연이 시작됩니다.</span><br><button class="bt-return" hidden>메인 메뉴로</button></div>';
 document.body.appendChild(dialog);
 const shade=dialog.querySelector('.bt-shade'),canvas=dialog.querySelector('canvas'),title=dialog.querySelector('.bt-title'),next=dialog.querySelector('.bt-next'),note=dialog.querySelector('.bt-note span'),back=dialog.querySelector('.bt-return'),choice=dialog.querySelector('.bt-choice'),confirm=dialog.querySelector('.bt-confirm'),selection=dialog.querySelector('.bt-selection');
 const audio=createAudio(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,STORAGE='oibung.clown.loadout';
 const muted=()=>{try{return localStorage.getItem('oibung-muted')==='1';}catch(e){return false;}};
 addEventListener('pointerdown',()=>{if(!muted()&&!audio.enabled)audio.setEnabled(true);},{passive:true});
 const play=name=>{if(!muted())audio.play(name);};
 let active=false,time=0,last=0,frameId=0,entrance=null,stage='',fromVictory=false,weapon='sword';
 let nameBinding=null;
 const buttons=[];
 function pick(key){weapon=chooseWeapon(key);for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.weapon===weapon));confirm.disabled=false;selection.textContent=WEAPON_NAMES[weapon]+' 선택 중';}
 for(const [key,name] of Object.entries(WEAPON_NAMES)){const b=document.createElement('button');b.type='button';b.className='bt-weapon';b.dataset.weapon=key;b.textContent=name;b.onclick=()=>{pick(key);play('ui');};dialog.querySelector('.bt-weapons').appendChild(b);buttons.push(b);}
 confirm.onclick=()=>{if(stage!=='ready')return;const loadout=makeClownLoadout(weapon,fromVictory);if(fromVictory){try{sessionStorage.setItem(STORAGE,JSON.stringify(loadout));}catch(e){console.warn('Clown loadout storage unavailable',e);}}dialog.dispatchEvent(new CustomEvent('oibung:clown-weapon-selected',{bubbles:true,detail:{...loadout,preview:!fromVictory}}));selection.textContent=WEAPON_NAMES[weapon]+' 선택 확정 · 광대전 로딩 중입니다.';confirm.disabled=true;play('ui');};
 function close(){if(!active)return;active=false;cancelAnimationFrame(frameId);nameBinding?.restore();nameBinding=null;entrance?.dispose();entrance=null;audio.ambience(false);dialog.close();if(fromVictory)change.click();}
 back.onclick=close;
 dialog.addEventListener('cancel',e=>{e.preventDefault();if(stage==='ready')close();});
 dialog.addEventListener('keydown',e=>{e.stopPropagation();if(stage==='ready'&&['1','2','3','4'].includes(e.key)){e.preventDefault();pick(Object.keys(WEAPON_NAMES)[Number(e.key)-1]);play('ui');}});
 function frame(now){if(!active)return;const dt=last?(now-last)/1000:0;last=now;time=advanceTransition(time,dt,document.hidden);const p=transitionPose(time);dialog.dataset.stage=p.stage;
 if(stage!==p.stage){stage=p.stage;if(stage==='declare')play('victory');else if(stage==='bind')play('stagger');else if(stage==='pull')play('boss-slam');else if(stage==='enter')play('ui');else if(stage==='bow')note.textContent='광대 오슬우가 관객에게 인사합니다.';else if(stage==='reveal')play('ui');else if(stage==='ready'){note.textContent='무기를 선택하면 광대 오슬우 전투가 시작됩니다.';choice.hidden=false;back.hidden=false;buttons.find(b=>b.dataset.weapon===weapon)?.focus();}}
 title.style.opacity=String(p.title);shade.style.opacity=String(.15+.85*p.entry);canvas.style.opacity=String(p.entry);
 nameBinding?.update(p.bind,p.pull);next.style.opacity=String(p.ui);
 if(p.entry>0){if(!entrance){try{entrance=buildEntrance(canvas);}catch(e){console.error(e);note.textContent='3D 입장 장면을 불러오지 못했습니다.';}}entrance?.render(p,time);}
 frameId=requestAnimationFrame(frame);
 }
 function start(victory){if(active)return;fromVictory=victory;active=true;time=0;last=0;stage='';back.hidden=true;choice.hidden=true;note.textContent='다음 공연이 시작됩니다.';let saved=null;if(victory){try{const v=JSON.parse(sessionStorage.getItem(STORAGE)||'null');if(v?.bossId==='clown'&&v.unlocked)saved=v.weapon;}catch(e){saved=null;}}pick(chooseWeapon(menu.querySelector('.weapon.selected')?.dataset.weapon,saved));try{dialog.showModal();if(victory)nameBinding=bindBossName(document.getElementById('boss-hud'),true,dialog);}catch(e){active=false;console.error(e);return;}if(victory)result.hidden=true;frameId=requestAnimationFrame(frame);}
 const observer=new MutationObserver(()=>{if(!active&&shouldStartTransition(!result.hidden,document.getElementById('result-kicker').textContent))start(true);});observer.observe(result,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true});
 const preview=document.createElement('button');preview.type='button';preview.textContent='보스 전환 연출 미리보기';preview.style.marginTop='10px';preview.onclick=()=>start(false);menu.querySelector('.menu-panel').appendChild(preview);
 if(shouldStartTransition(!result.hidden,document.getElementById('result-kicker').textContent))start(true);
 return {start:()=>start(false),dispose(){close();observer.disconnect();preview.remove();dialog.remove();}};
}

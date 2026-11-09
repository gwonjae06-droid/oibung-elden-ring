import * as THREE from 'three';
import {renderJourneyArt} from './journey-art.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';
import {audioChannelGain} from './audio-preferences.mjs';

// One continuous, unskippable return to the five red seals, then morning.
export function playJourneyFinale(doc,win){
 const d=doc.createElement('dialog');d.className='journey-transition od-final';
 d.setAttribute('aria-label','다섯 문양과 아침으로 이어지는 복도');
 d.innerHTML=`<style>.od-final{position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#08090b;color:#e8ddc9;overflow:hidden}.od-final canvas{position:absolute;inset:0;width:100%;height:100%}.od-slab{position:absolute;inset:0;will-change:transform}.od-slab.left{clip-path:polygon(0 0,50% 0,49% 27%,51% 46%,48% 69%,50% 100%,0 100%)}.od-slab.right{clip-path:polygon(50% 0,100% 0,100% 100%,50% 100%,48% 69%,51% 46%,49% 27%)}.od-final .mural-grooves{opacity:1!important}.od-final [data-emblem=mirror] .mural-grooves{opacity:var(--last-seal,0)!important}.od-final .j-scene{display:block;position:absolute;inset:0;opacity:1}.od-final .j-wall-wide{width:100%;height:100%}.od-final .j-wall-tall,.od-final .j-backdrop-tall{display:none}.od-final .j-wall-backdrop{position:absolute;inset:0;width:100%;height:100%}.od-final-title,.od-final-credits{position:absolute;inset:0;display:grid;place-content:center;text-align:center;pointer-events:none;opacity:0}.od-final-title{font:clamp(32px,7vw,88px) Georgia,serif;letter-spacing:.17em;color:#594626}.od-final-credits{font:18px/2 Georgia,serif;background:#090b10}.od-final-credits small{font:14px/2 system-ui;color:#b5a992}.od-final-light{position:absolute;inset:0;background:#fff4da;opacity:0;pointer-events:none}</style><canvas></canvas><div class="od-slab left">${renderJourneyArt('end-left')}</div><div class="od-slab right">${renderJourneyArt('end-right')}</div><div class="od-final-light"></div><div class="od-final-title">ODEN RING</div><div class="od-final-credits">ODEN RING<br><small>다섯 소망. 하나의 서약.<br>Music · Original musical recordings<br>The Greatest Show of My Life<br>끝까지 함께해 주셔서 감사합니다.</small></div>`;
 doc.body.appendChild(d);d.showModal();d.addEventListener('cancel',e=>e.preventDefault());
 d.addEventListener('keydown',e=>e.stopPropagation());
 const canvas=d.querySelector('canvas'),scene=new THREE.Scene();scene.background=new THREE.Color(0x090b10);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(1.5,win.devicePixelRatio||1));
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;const camera=new THREE.PerspectiveCamera(55,1,.1,90);
 const stone=new THREE.MeshStandardMaterial({color:0x35343b,roughness:.95});
 const gold=new THREE.MeshStandardMaterial({color:0x957b49,metalness:.74,roughness:.5});
 const iron=new THREE.MeshStandardMaterial({color:0x52535a,metalness:.8,roughness:.45});
 const paper=new THREE.MeshStandardMaterial({color:0xcbc3ad,roughness:1,side:THREE.DoubleSide});
 const surface=doc.createElement('canvas');surface.width=surface.height=256;const paint=surface.getContext('2d');
 let seed=6203;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 paint.fillStyle='#77736c';paint.fillRect(0,0,256,256);
 for(let i=0;i<14000;i++){const shade=70+Math.floor(random()*85);paint.fillStyle=`rgba(${shade},${shade},${shade},.2)`;const size=1+random()*6;paint.fillRect(random()*256,random()*256,size,size);}
 paint.strokeStyle='#393832';paint.lineWidth=2;
 for(let row=0;row<4;row++){paint.beginPath();paint.moveTo(0,row*64);paint.lineTo(256,row*64);paint.stroke();for(let col=0;col<3;col++){const x=col*128+(row%2)*64;paint.beginPath();paint.moveTo(x,row*64);paint.lineTo(x,row*64+64);paint.stroke();}}
 const texture=new THREE.CanvasTexture(surface);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,4);texture.colorSpace=THREE.SRGBColorSpace;stone.map=texture;stone.bumpMap=texture;stone.bumpScale=.07;
 scene.add(new THREE.HemisphereLight(0xf9e4ba,0x10121b,1.8));
 const sun=new THREE.PointLight(0xffe0a0,85,65,1.2);sun.position.set(0,4,-31);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0003;scene.add(sun);
 const box=(x,y,z,w,h,l,mat=stone)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;scene.add(m);return m;};
 box(0,-.2,-12,9,.4,50);box(-4.5,3,-12,.5,6,50);box(4.5,3,-12,.5,6,50);box(0,6,-12,9,.5,50);
 for(let i=0;i<9;i++){const z=5-i*4;for(const side of [-1,1])box(side*4.1,2.7,z,.32,5.4,.55);box(0,5.6,z,8.2,.3,.55);}
 const relics=[];
 // Embedded sword, stopped mask, fractured die, fallen red wings, last sheet.
 const sword=box(-2.6,1.2,1,.12,2.4,.25,iron);box(-2.6,2.2,1,1.05,.14,.25,gold);box(-2.6,2.55,1,.16,.6,.25,gold);relics.push(sword);
 const mask=new THREE.Mesh(new THREE.SphereGeometry(.65,36,24),paper);mask.scale.set(.7,1,.25);mask.position.set(2.7,1.1,-5);mask.rotation.x=.6;scene.add(mask);relics.push(mask);
 for(const x of [-.2,.2]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.09,16,12),iron);eye.position.set(2.7+x,1.2,-4.85);scene.add(eye);}
 const die=box(-2.5,.6,-11,1.1,1.1,1.1,gold);die.rotation.set(.14,.48,.2);relics.push(die);
 for(let i=0;i<3;i++)box(-2.9+i*.29,.65,-10.4,.035,.9,.04,iron).rotation.z=.25;
 const red=new THREE.MeshStandardMaterial({color:0x381820,roughness:.76});
 for(const side of [-1,1])for(let i=0;i<7;i++){
  const feather=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.09,.15],[.13,.6],[.07,1.3],[0,1.7]].map(p=>new THREE.Vector2(...p)),20),red);
  feather.position.set(2.4+side*i*.12,.1,-17+i*.07);feather.rotation.set(Math.PI/2,0,side*(.4+i*.12));scene.add(feather);
 }
 const sheet=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.2,6,8),paper);sheet.rotation.x=-Math.PI/2;sheet.position.set(-1.6,.02,-23);scene.add(sheet);relics.push(sheet);
 for(let i=0;i<7;i++)box(-1.6,.026,-23.4+i*.13,.65,.008,.015,iron);
 const light=new THREE.Mesh(new THREE.PlaneGeometry(7,6),new THREE.MeshBasicMaterial({color:0xffedc8}));light.position.set(0,3,-34);scene.add(light);
 const left=d.querySelector('.left'),right=d.querySelector('.right'),flash=d.querySelector('.od-final-light'),title=d.querySelector('.od-final-title'),credits=d.querySelector('.od-final-credits');
 const music=new Audio(new URL('../assets/music/gyuwoncoda.mp3',import.meta.url).href);music.preload='auto';
 let done=false,raf=0,last=null,t=0,resolve,viewWidth=0,viewHeight=0;const finished=new Promise(r=>resolve=r);
 const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
 function visibility(){last=null;}doc.addEventListener('visibilitychange',visibility);
 function end(ok){if(done)return;done=true;doc.removeEventListener('visibilitychange',visibility);win.cancelAnimationFrame(raf);music.pause();music.removeAttribute('src');music.load();renderer.dispose();disposeScene(scene);d.close();d.remove();resolve(ok);}
 function frame(now){if(done)return;try{const dt=last===null?0:Math.max(0,(now-last)/1000);last=now;
  if(!doc.hidden)t+=dt;
  if(doc.hidden)music.pause();else if(t>3&&music.paused&&!music.ended&&t<19){try{music.muted=win.localStorage?.getItem('oibung-muted')==='1';}catch{music.muted=true;}music.volume=.18*audioChannelGain('music');try{music.play()?.catch(()=>{});}catch{}}
  d.style.setProperty('--last-seal',ease((t-.8)/1.2));
  const open=ease((t-2.4)/3.4);left.style.transform=`translateX(${-open*90}%)`;right.style.transform=`translateX(${open*90}%)`;
  left.style.opacity=right.style.opacity=String(1-ease((t-5)/1.5));
  camera.position.set(0,2.3,9-ease((t-5)/8)*40);camera.lookAt(0,2.2,-35);
  const w=win.innerWidth,h=win.innerHeight;if(viewWidth!==w||viewHeight!==h){viewWidth=w;viewHeight=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  flash.style.opacity=String(ease((t-12)/1.8));title.style.opacity=String(ease((t-13.5)/1));credits.style.opacity=String(ease((t-15.5)/1));
  renderer.render(scene,camera);if(t>=19){end(true);return;}raf=win.requestAnimationFrame(frame);
 }catch(error){console.error('Journey finale failed',error);end(false);}}
 try{raf=win.requestAnimationFrame(frame);}catch{end(false);}
 return {finished,watchdogMilliseconds:120000,dispose:()=>end(false)};
}

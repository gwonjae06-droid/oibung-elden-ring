import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {diceArmorPlan,buildDiceArmor,DICE_ARMOR_STYLE} from '../src/dice-armor.mjs';
import {diceDecorations} from '../src/dice-decoration-data.mjs';
import {buildDiceDecorations,buildDiceFire} from '../src/dice-decoration-renderer.mjs';
import * as photo from '../src/dice-photo-data.mjs';
test('12 thick edges, eight cubic caps, 20 red inlays',()=>{const p=diceArmorPlan(12);assert.equal(p.beams.length,12);assert.equal(p.caps.length,8);assert.equal(p.panels.length,20);for(const b of p.beams){assert.equal(b.size.filter(v=>v===12).length,1);assert.equal(b.position.filter(v=>Math.abs(v)===6).length,2);}assert.equal(new Set(p.caps.map(p=>p.position.join(','))).size,8);assert.ok(p.caps.every(p=>p.size.every(v=>v===1.26)));});
test('photo face remains clear and all 20 pips fit inside inlays and gold',()=>{const p=diceArmorPlan(12);assert.ok(p.panels.every(p=>p.position[0]<=6));const faces=diceDecorations(12).filter(f=>f.face!==photo.DICE_PHOTO_FACE);assert.equal(faces.reduce((n,f)=>n+f.points.length,0),20);for(const f of faces)for(const [x,y]of f.points){const reach=Math.max(Math.abs(x),Math.abs(y))+f.radius*.7;assert.ok(reach<12*.34);assert.ok(reach<6-12*.105/2);}for(const a of p.panels){const k=a.size.indexOf(.004);assert.ok(Math.abs(a.position[k])+a.size[k]/2<6.008);}});
test('invalid sizes rejected and ornament proportions scale',()=>{for(const v of [0,-1,NaN,Infinity])assert.throws(()=>diceArmorPlan(v));const a=diceArmorPlan(8),b=diceArmorPlan(12);assert.equal(b.beams[0].size[0]/a.beams[0].size[0],1.5);});
function doubles(){
 const resources=[];
 class V{constructor(...v){this.set(...v);}set(x=0,y=0,z=0,w){Object.assign(this,{x,y,z,w});return this;}copy(v){return this.set(v.x,v.y,v.z);}multiplyScalar(n){this.x*=n;this.y*=n;this.z*=n;return this;}setFromUnitVectors(){return this;}}
 class Group{constructor(){this.children=[];this.position=new V();this.quaternion=new V();this.scale=new V(1,1,1);this.rotation={};}add(...o){this.children.push(...o);}traverse(fn){fn(this);for(const o of this.children)o.traverse?o.traverse(fn):fn(o);}}
 class Resource{constructor(...args){this.args=args;this.disposals=0;resources.push(this);}dispose(){this.disposals++;}}
 class Geometry extends Resource{setFromPoints(){return this;}}
 class Material extends Resource{constructor(p){super(p);Object.assign(this,p);this.color={value:p.color,setHex(v){this.value=v;}};}}
 class Mesh extends Group{constructor(g,m){super();this.geometry=g;this.material=m;}}
 class Sprite extends Group{constructor(m){super();this.material=m;}}
 class Light extends Group{constructor(c,i){super();this.intensity=i;}}
 return {resources,THREE:{Group,Vector3:V,BoxGeometry:Geometry,CircleGeometry:Geometry,BufferGeometry:Geometry,MeshStandardMaterial:Material,LineBasicMaterial:Material,SpriteMaterial:Material,CanvasTexture:Resource,Mesh,Line:Mesh,Sprite,PointLight:Light}};
}
test('ornaments share one geometry and two materials',()=>{const {THREE}=doubles(),root=new THREE.Group();buildDiceArmor(THREE,root,12);assert.equal(root.children.length,40);assert.equal(new Set(root.children.map(m=>m.geometry)).size,1);assert.equal(new Set(root.children.map(m=>m.material)).size,2);});
test('actor integration uses real decoration/fire factories with Three and DOM doubles',async()=>{
 const {THREE,resources}=doubles(),source=readFileSync(new URL('../src/dice-actor.mjs',import.meta.url),'utf8');
 const mock={THREE,R:{edge:12},DICE_BOARD:[],...photo,H:{},diceCrackPaths:()=>[{points:[[0,0,0],[1,1,1]]}],diceTelegraphView:()=>null,buildDiceDecorations,buildDiceFire,buildGroundSpikeVisuals:()=>({update(){}}),squareDiscArgs:()=>[],frenzyShake:()=>({x:0,z:0}),buildDiceArmor,DICE_ARMOR_STYLE};
 const oldImage=globalThis.Image,oldDocument=globalThis.document;
 globalThis.__diceArmorTest=mock;
 globalThis.document={createElement:()=>({getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){},drawImage(){}})})};
 globalThis.Image=class{constructor(){this.naturalWidth=640;this.naturalHeight=480;}set src(v){queueMicrotask(()=>this.onload());}};
 try{
  const code=`const {${Object.keys(mock).join(',')}}=globalThis.__diceArmorTest;\n`+source.replace(/^import .*;\n/gm,'').replaceAll('import.meta.url',JSON.stringify(new URL('../src/dice-actor.mjs',import.meta.url).href));
  const mod=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  const a=mod.createDiceActor();assert.equal(await a.ready,true);
  const all=[];a.root.traverse(o=>all.push(o));
  const pips=all.filter(o=>o.name==='recessed-dice-pip');assert.equal(pips.length,20);
  const face=all.find(o=>o.name==='dice-decoration-face-0');assert.equal(face.children.length,0);
  const body=a.root.children[0];assert.deepEqual(body.geometry.args,[12,12,12]);assert.equal(body.material.length,6);assert.ok(pips.every(p=>p.material.map===body.material[0].map));
  assert.equal(all.filter(o=>o.name==='dice-solid-gold-edge').length,12);assert.equal(all.filter(o=>o.name==='dice-gold-corner-cap').length,8);assert.equal(all.filter(o=>o.name==='hellfire-flame').length,20);
  a.update({dice:{pose:{x:0,y:6,z:0,rotation:[0,0,0,1]}}});assert.ok(all.every(o=>[o.position.x,o.position.y,o.position.z].every(Number.isFinite)));assert.deepEqual([a.root.scale.x,a.root.scale.y,a.root.scale.z],[1,1,1]);assert.equal(body.material[1].color.value,DICE_ARMOR_STYLE.black);
  a.dispose();a.dispose();assert.ok(resources.every(r=>r.disposals===1));
  const before=resources.length,b=mod.createDiceActor();b.dispose();assert.equal(await b.ready,false);assert.ok(resources.slice(before).every(r=>r.disposals===1));
 }finally{globalThis.Image=oldImage;globalThis.document=oldDocument;delete globalThis.__diceArmorTest;}
});

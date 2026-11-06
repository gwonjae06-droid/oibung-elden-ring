import {loft,plate,beam,addMesh,mergeRigid} from './player-geometry.mjs';

export function buildPlayerWeapons(T,m){
 const weapons={},details={};
 const make=id=>{const g=new T.Group();g.name='player-weapon-'+id;weapons[id]=g;return g;};
 const put=(g,geo,mat,name,x=0,y=0,z=0)=>addMesh(T,g,geo,mat,name,x,y,z);
 const sword=make('sword');
 put(sword,loft(T,[[-.18,.025,.025],[-.12,.052,.045],[-.04,.052,.045],[0,.035,.035],[.24,.035,.035]],10,'z'),m.leather,'sword-wrapped-grip');
 for(let i=0;i<7;i++)put(sword,loft(T,[[i*.035,.039,.039],[i*.035+.008,.04,.04]],8,'z'),m.gold,'sword-grip-binding');
 const guard=plate(T,[[-.38,-.06],[-.32,.035],[-.13,.06],[-.06,.10],[.06,.10],[.13,.06],[.32,.035],[.38,-.06],[.29,-.025],[.10,.005],[-.10,.005],[-.29,-.025]],.08);
 put(sword,guard,m.gold,'sword-swept-quillons',0,0,.27);
 const blade=loft(T,[[.3,.07,.035],[.43,.12,.037],[.64,.105,.028],[1.45,.072,.024],[1.73,.049,.018],[1.96,.001,.001]],4,'z');
 put(sword,blade,m.steel,'sword-forged-diamond-blade');
 put(sword,loft(T,[[.48,.012,.002],[1.50,.009,.002],[1.76,.001,.001]],4,'z'),m.etched,'sword-recessed-fuller',0,.028,0);
 put(sword,plate(T,[[-.07,0],[0,.10],[.07,0],[0,-.08]],.06),m.gold,'sword-pommel',0,0,-.19);
 put(sword,plate(T,[[-.025,0],[0,.04],[.025,0],[0,-.04]],.01),m.gem,'sword-pommel-seal',0,.0,-.225);
 details.sword={tip:1.96,root:.38};mergeRigid(T,sword);

 const hammer=make('hammer');
 put(hammer,loft(T,[[-.2,.045,.045],[.08,.049,.049],[.75,.045,.045],[1.27,.052,.052],[1.54,.07,.07]],10,'z'),m.leather,'hammer-oak-wrapped-haft');
 for(let i=0;i<11;i++)put(hammer,loft(T,[[i*.044,.052,.052],[i*.044+.012,.055,.055]],8,'z'),m.gold,'hammer-haft-binding');
 // Broad, bevelled striking faces with a recessed reliquary at the centre.
 const head=loft(T,[[-.46,.20,.20],[-.39,.26,.26],[-.30,.25,.25],[.30,.25,.25],[.39,.26,.26],[.46,.20,.20]],8,'y');head.rotateZ(Math.PI/2);
 put(hammer,head,m.steel,'hammer-bevelled-head',0,0,1.50);
 const belt=loft(T,[[-.10,.27,.27],[.10,.27,.27]],8);belt.rotateZ(Math.PI/2);put(hammer,belt,m.gold,'hammer-gilded-band',0,0,1.50);
 const seal=plate(T,[[-.10,0],[0,.15],[.10,0],[0,-.15]],.04);seal.rotateX(Math.PI/2);put(hammer,seal,m.gem,'hammer-ember-reliquary',0,.28,1.50);
 details.hammer={tip:1.76,root:.75,support:[0,0,.56]};mergeRigid(T,hammer);

 const bow=make('bow'),bowPath=[];
 for(let i=0;i<=20;i++){const u=i/20,y=(u-.5)*1.82,t=Math.abs(u-.5)*2,z=.16+.29*Math.sin(t*Math.PI*.85)-.29*t*t;bowPath.push([0,y,z,.035+.027*(1-t),.025+.012*(1-t)]);}
 put(bow,beam(T,bowPath,10),m.wood,'bow-sculpted-recurve-limbs');
 for(const side of [-1,1]){
  const path=bowPath.filter((p,i)=>side<0?i<=7:i>=13).map(p=>[p[0],p[1],p[2]+.018,p[3]*.33,p[4]*.5]);put(bow,beam(T,path,6),m.gold,'bow-limb-inlay');
 }
 put(bow,loft(T,[[-.15,.052,.05],[.15,.052,.05]],8),m.leather,'bow-leather-grip',0,0,.16);
 const stringGeo=new T.BufferGeometry(),stringArray=new Float32Array(9);stringGeo.setAttribute('position',new T.BufferAttribute(stringArray,3));
 const string=new T.Line(stringGeo,m.string);string.name='bow-dynamic-string';bow.add(string);
 const arrow=new T.Group();arrow.name='bow-nocked-arrow';bow.add(arrow);
 put(arrow,loft(T,[[-.35,.012,.012],[.80,.012,.012]],6,'z'),m.wood,'arrow-cedar-shaft');
 put(arrow,loft(T,[[.8,.035,.018],[.98,.001,.001]],4,'z'),m.steel,'arrow-bodkin');
 for(let i=0;i<3;i++){const f=put(arrow,plate(T,[[0,0],[.06,.12],[.045,.26],[0,.29]],.006),m.ivory,'arrow-feather',0,0,-.30);f.rotation.x=Math.PI/2;f.rotation.z=i*Math.PI*2/3;}
 details.bow={string,stringArray,arrow,tips:[bowPath[0],bowPath.at(-1)]};mergeRigid(T,bow);mergeRigid(T,arrow);

 const cards=make('cards'),fan=[];
 for(let i=0;i<5;i++){
  const card=new T.Group();card.name='player-engraved-card-'+i;card.position.set((i-2)*.085,0,.29);card.rotation.y=(i-2)*.23;cards.add(card);fan.push(card);
  const outline=[[-.125,-.19],[-.11,-.205],[.11,-.205],[.125,-.19],[.125,.19],[.11,.205],[-.11,.205],[-.125,.19]];
  const g=plate(T,outline,.012);g.rotateX(-Math.PI/2);put(card,g,m.ivory,'card-ivory-face');
  const symbol=plate(T,[[0,.085],[.055,0],[0,-.085],[-.055,0]],.006);symbol.rotateX(-Math.PI/2);put(card,symbol,i%2?m.cardRed:m.etched,'card-inlaid-suit',0,.013,0);
  const border=[[-.107,.018,-.185,.006],[-.107,.018,.185,.006],[.107,.018,.185,.006],[.107,.018,-.185,.006],[-.107,.018,-.185,.006]];
  put(card,beam(T,border,4),m.gold,'card-filigree-border');mergeRigid(T,card);
 }
 details.cards={fan};
 return {weapons,details};
}

// Applied to the actual held weapon mesh in every boss arena. Sword hit
// reach is changed by the same forge rank in the encounter physics.
export function syncWeaponSpecializationVisuals(parts,game){
 const rigs=parts?.weaponRigs;if(!rigs||!game)return;
 if(rigs.sword)rigs.sword.scale.z=game.weapon==='sword'&&game.evolutions?.includes('charged-blade')?2:1;
 if(rigs.hammer)rigs.hammer.visible=game.weapon==='hammer'&&!game.projectiles?.some(q=>q.kind==='hammer-throw'&&q.life>0);
}

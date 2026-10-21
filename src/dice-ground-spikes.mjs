export const GROUND_SPIKES=Object.freeze({warning:.9,active:.65,radius:3.1,damage:32});
export function beginGroundSpikes(g,board,count){
 const d=g.dice,n=Math.max(1,Math.min(6,Math.trunc(count)||1));
 const cells=[...board].sort((a,b)=>(a.x-g.player.x)**2+(a.z-g.player.z)**2-((b.x-g.player.x)**2+(b.z-g.player.z)**2)||a.index-b.index).slice(0,n).map(({index,x,z})=>({index,x,z}));
 d.state='spike-warning';d.t=0;d.telegraph=null;d.groundSpikes={cells,hit:false};g.events.push({type:'dice-spike-warning',cells:cells.map(c=>({...c})),radius:GROUND_SPIKES.radius,duration:GROUND_SPIKES.warning});
}
// The engine owns time and freeze handling; call after incrementing d.t.
export function stepGroundSpikes(g){
 const d=g.dice;if(!['spike-warning','spikes'].includes(d.state))return false;
 if(g.status!=='playing'){d.groundSpikes=null;return true;}
 if(d.state==='spike-warning'){if(d.t<GROUND_SPIKES.warning)return true;d.state='spikes';d.t=0;g.events.push({type:'dice-spike-erupt'});}
 if(d.t>=GROUND_SPIKES.active){d.state='recovery';d.t=0;d.groundSpikes=null;return true;}
 const wave=d.groundSpikes;if(!wave||wave.hit||g.player.invuln>0)return true;
 if(wave.cells.some(c=>Math.hypot(g.player.x-c.x,g.player.z-c.z)<=GROUND_SPIKES.radius+.42)){wave.hit=true;const amount=Math.min(g.player.hp,GROUND_SPIKES.damage);g.player.hp-=amount;g.events.push({type:'player-hit',source:'dice-spikes',amount});if(g.player.hp===0){g.status='lost';d.groundSpikes=null;g.events.push({type:'death'});}}
 return true;
}
export function buildGroundSpikeVisuals(THREE,root){
 const group=new THREE.Group();group.name='dice-ground-spikes';root.add(group);
 const mat=new THREE.MeshBasicMaterial({color:0xff431b,transparent:true,opacity:.4,depthWrite:false}),hot=new THREE.MeshStandardMaterial({color:0xffa143,emissive:0xff3a0a,emissiveIntensity:1.2,metalness:.5,roughness:.5}),disc=new THREE.CircleGeometry(GROUND_SPIKES.radius+.42,48).rotateX(-Math.PI/2),cone=new THREE.ConeGeometry(.7,4,10),slots=[];
 for(let i=0;i<6;i++){const mark=new THREE.Mesh(disc,mat),spikes=new THREE.Group();mark.position.y=.1;for(const [x,z]of [[0,0],[-1,-1],[-1,1],[1,-1],[1,1]]){const m=new THREE.Mesh(cone,hot);m.position.set(x,2,z);m.castShadow=true;spikes.add(m);}group.add(mark,spikes);slots.push({mark,spikes});}
 return {update(g){const d=g.dice,wave=d.groundSpikes;group.visible=g.status==='playing'&&Boolean(wave)&&['spike-warning','spikes'].includes(d.state);for(let i=0;i<slots.length;i++){const s=slots[i],c=wave?.cells[i];s.mark.visible=Boolean(c)&&group.visible;s.spikes.visible=s.mark.visible&&d.state==='spikes';if(!c)continue;s.mark.position.set(c.x,.1,c.z);s.spikes.position.set(c.x,0,c.z);s.spikes.scale.y=Math.max(.01,Math.min(1,d.t/.12));}}};
}

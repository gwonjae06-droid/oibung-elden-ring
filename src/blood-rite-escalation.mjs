// Each blood spell gains one additional, deliberately delayed counter-beat.
// These are genuine rendered collision hazards, NOT invisible instant damage.
// Keep the original pattern pool, release timing and dodge windows unchanged.
export const BLOOD_RITE_ACCENTS=Object.freeze({
 wave:{type:'circle',warn:2.65,r:3.5,offset:6},
 fountain:{type:'ring',warn:2.85,r:7,width:1.1},
 burst:{type:'ring',warn:2.05,r:7,width:1.0},
 orbs:{type:'circle',warn:2.65,r:3.0,offset:5.3},
 chain:{type:'cone',warn:3.12,r:14,arc:.38,offset:.65},
 orbit:{type:'cone',warn:2.45,r:13,arc:.41,offset:-.66},
 vortex:{type:'ring',warn:2.55,r:8,width:1.2},
 lances:{type:'circle',warn:3.85,r:3.4,offset:5.7},
 cross:{type:'circle',warn:3.65,r:3.3,offset:6.0},
 bloodScissors:{type:'circle',warn:3.5,r:3.6,offset:0},
 heartCage:{type:'ring',warn:4.25,r:9,width:1.15},
 reverseFlow:{type:'cone',warn:4.3,r:16,arc:.37,offset:.55},
 bloodStatues:{type:'circle',warn:3.9,r:3.8,offset:-6},
 dive:{type:'ring',warn:2.45,r:6.5,width:1.1},
 eclipse:{type:'circle',warn:3.5,r:3.6,offset:6},
 rain:{type:'circle',warn:3.65,r:3.5,offset:0},
 wing:{type:'cone',warn:2.15,r:18,arc:.44,offset:.85},
 pulse:{type:'cone',warn:3.25,r:16,arc:.42,offset:-.75},
 pursuit:{type:'circle',warn:3.1,r:4,offset:5},
 tide:{type:'ring',warn:3.65,r:10,width:1.25},
 judgement:{type:'ring',warn:3.65,r:9,width:1.1},
 ritual:{type:'circle',warn:5.4,r:4.2,offset:5},
 wingShear:{type:'cone',warn:4.05,r:20,arc:.36,offset:.6},
 rosary:{type:'ring',warn:4.7,r:8.5,width:1.15},
 wingGenesis:{type:'circle',warn:4.75,r:4.2,offset:-6},
 heartFeast:null, // Breaking the sacramental nodes must remain an effective counter.
 requiem:null // The paired tsunami wall has its own explicit safe boss corridor.
});
export function addBloodRiteAccent(g,id,spawn){
 const a=BLOOD_RITE_ACCENTS[id];if(!a)return null;
 const s=g.blood,b=g.boss,p=s.target||g.player;
 const side=(s.index%2)*2-1,angle=Math.atan2(p.x-b.x,p.z-b.z);
 const rad=Math.max(3,g.bloodArenaRadius||32)-4;
 const locate=(x,z)=>{
  const d=Math.hypot(x,z),factor=d>rad?rad/d:1;
  return {x:x*factor,z:z*factor};
 };
 const base={...locate(p.x+side*(a.offset||0),p.z),warn:a.warn,
  life:.48,damage:b.phase===2?23:19,visual:'blood-counterbeat'};
 if(a.type==='circle')return spawn('circle',{...base,r:a.r});
 if(a.type==='ring')return spawn('ring',{...base,r:a.r,width:a.width,
  // During the active interval the halo travels several metres, not an
  // entire unfair arena-wide shockwave.
  grow:b.phase===2?3.8:2.8,life:.62});
 if(a.type==='cone')return spawn('cone',{...base,x:b.x,z:b.z,
  yaw:angle+(a.offset||0)*side,r:a.r,arc:a.arc,life:.55});
 return null;
}

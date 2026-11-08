import {createGyuwonGame,damageGyuwon,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {GYUWON_YEAR_SIGNATURES} from '../src/gyuwon-year-signatures.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
const output=[];const random=Math.random;Math.random=()=>.5;
try{for(const weapon of ['sword','hammer','bow','cards'])for(const [label,dps]of [['expert',150],['normal',60],['cautious',30]]){
 const g=createGyuwonGame(weapon,{yearMode:true,seed:811});g.player.invuln=1e7;const signatures=new Set(),years=new Set();let t=0;
 for(;t<1200&&g.status==='playing';t+=.05){years.add(g.gyuwon.years.year);damageGyuwon(g,dps*.05);stepGyuwon(g,.05);for(const e of g.events)if(e.type==='gyuwon-warning'&&Object.values(GYUWON_YEAR_SIGNATURES).some(id=>e.pattern==='year-'+id))signatures.add(e.pattern.slice(5));g.events.length=0;}
 output.push({weapon,label,dps,seconds:+g.time.toFixed(2),year:g.gyuwon.years.year,status:g.status,signatures:signatures.size,hpDriven:true,allYears:years.size===11});
}}finally{Math.random=random;}
mkdirSync('qa-output/gyuwon-overhaul',{recursive:true});writeFileSync('qa-output/gyuwon-overhaul/pacing.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output));

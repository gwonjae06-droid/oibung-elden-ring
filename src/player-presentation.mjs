import {samplePlayerMotion} from './player-motion-data.mjs';
export const PLAYER_COLORS={sword:0x8cdeff,hammer:0xffb76c,bow:0xb9ef9a,cards:0xdba6ff};
export function playerPose(g,phase=0,speed=0,context={}){return samplePlayerMotion(g,phase,speed,context);}
export function findPlayerParts(scene){
 if(!scene||!Array.isArray(scene.children))return null;
 for(const rig of scene.children){const parts=rig.presentationParts;if(parts&&parts.rig===rig&&rig.parent===scene)return parts;}
 return null;
}
export function playerSoundRecipe(key,weapon='sword'){
 if(key==='step')return [['n',340,160,.055,.025],['t',75,45,.06,.012]];
 if(key==='roll')return [['n',850,250,.22,.035]];
 if(key==='heal')return [['t',440,660,.22,.025],['t',660,880,.2,.02]];
 if(key==='swing')return weapon==='hammer'?[['n',550,180,.24,.035]]:[['n',1900,600,.15,.03]];
 if(key==='shot')return weapon==='bow'?[['t',380,210,.16,.03],['n',2600,1700,.05,.025]]:[['n',3400,2100,.08,.025]];
 if(key==='hit')return weapon==='hammer'?[['t',85,32,.24,.05],['n',800,220,.12,.03]]:weapon==='sword'?[['t',950,380,.08,.025],['n',2100,900,.07,.025]]:[['t',560,180,.09,.025]];
 return [];
}

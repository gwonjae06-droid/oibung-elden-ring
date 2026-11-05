export const CIRCUS_LIGHTING=Object.freeze({height:24.4,spacing:3,spotIntensity:18,spotDistance:60,spotAngle:.2,beamOpacity:.012,ambientScale:.26,directionalScale:.3,bulbScale:.4});
const sat=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
const floorTarget=p=>{let x=Number.isFinite(p?.x)?p.x:0,z=Number.isFinite(p?.z)?p.z:0;const d=Math.hypot(x,z);if(d>22){x*=22/d;z*=22/d;}return {x,y:.12,z};};
export function circusSpotTarget(time=0,phase=1,g=null,index=0){
 const c=g?.clown,photograph=c?.showKey==='headReturn'&&c.stageKey==='photo',show=c?.state==='pattern'&&(c.name==='spotlightSweep'||photograph);
 const zones=show?(c.zones||[]).filter(z=>z.state==='warn'&&z.shape==='circle'&&Number.isFinite(z.x)&&Number.isFinite(z.z)):[];
 if(zones.length)return floorTarget(zones[index%zones.length]);
 if(phase===2&&g)return floorTarget(index%2?g.player:g.boss);
 const t=Number.isFinite(time)?time:0,a=t*.24+index*Math.PI;return floorTarget({x:Math.sin(a)*13,z:Math.cos(a)*13});
}
export function createCircusLighting(scene){
 const entries=[];scene?.traverse?.(l=>{const ratio=l.isHemisphereLight||l.isAmbientLight?CIRCUS_LIGHTING.ambientScale:l.isDirectionalLight?CIRCUS_LIGHTING.directionalScale:null;if(ratio!==null&&Number.isFinite(l.intensity))entries.push({l,ratio,base:l.intensity,last:null});});
 function dim(silence=0){for(const e of entries){if(e.last===null||Math.abs(e.l.intensity-e.last)>1e-8)e.base=e.l.intensity;e.last=Math.max(0,e.base*e.ratio*(1-.35*sat(silence)));e.l.intensity=e.last;}}
 function restore(){for(const e of entries){if(e.last!==null&&Math.abs(e.l.intensity-e.last)<1e-8)e.l.intensity=e.base;e.last=null;}}
 return {dim,restore};
}

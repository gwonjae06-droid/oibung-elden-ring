// Authored visual action vocabulary for nightmare ensemble performers.
// Logical attack warnings live in the deterministic combat module; this
// module provides visual timing for rig pose/props without altering damage.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:0));
const smooth=x=>{const a=clamp(x);return a*a*(3-2*a)};
const DANCE=Object.freeze([
 ['baton',/directorBatonRake/i],
 ['veil',/directorVelvetStep/i],
 ['cackle',/directorCackle/i],
 ['lash',/directorStringLash/i],
 ['hoop',/directorInfernalRing/i],
 ['hunt',/directorStalkingRush/i],
 ['verdict',/directorFinalVerdict/i],
 ['finale',/allCast|grandFinale|requiem|finale/i],
 ['juggle',/juggle|relay|knife/i],
 ['hush',/synchronizedHush/i],
 ['sing',/mouthless|lament/i],
 ['drum',/drum|percussion|march/i],
 ['vault',/tightrope|trapeze|stampede|acrobat/i],
 ['trapdoor',/trapdoor|maskedTrapdoor/i],
 ['mirror',/mirror|double|twin|ghost/i],
 ['hoop',/hoop|fire|carousel|ember/i],
 ['sing',/choir|chorus|candle|requiem|song/i],
 ['strings',/marionette|puppet|gallows/i],
 ['cannon',/cannon|maskedCannonade/i],
 ['curtain',/curtain|voices|nightmare/i],
 ['finale',/finale|requiem|allCast/i]
]);
export function circusPerformanceMode(key){
 for(const [name,re]of DANCE)if(re.test(String(key||'')))return name;
 return null;
}
export function ringmasterActMotion(key,elapsed=0,active=false){
 const mode=active?circusPerformanceMode(key):null;
 const t=Math.max(0,Number.isFinite(elapsed)?elapsed:0);
 const intro=smooth(t/.50),exit=1-smooth((t-(mode==='verdict'?7.1:mode==='lash'||mode==='hoop'?5.25:4.35))/.75),weight=mode?intro*exit:0;
 const beat=Math.sin(t*(mode==='drum'?8.6:mode==='sing'||mode==='finale'?5.3:3.8));
 return {mode,weight,beat,
  left:weight*(mode==='drum'?.80:mode==='mirror'?.67:mode==='curtain'?.95:['cackle','verdict','lash'].includes(mode)?1:.5),
  right:weight*(['juggle','cannon','baton','verdict','lash'].includes(mode)?1:mode==='sing'||mode==='finale'?.94:.68)};
}
export function troupeBeatMotion(member,time=0){
 const routine=member?.routine;
 if(!routine||member?.down)return {pose:null,weight:0,beat:0,elapsed:0,wind:0};
 const now=Number.isFinite(time)?time:0;
 if(now>=routine.until)return {pose:null,weight:0,beat:0,elapsed:0,wind:0};
 const elapsed=Math.max(0,now-routine.start);
 const duration=Math.max(.1,routine.until-routine.start);
 const weight=smooth(elapsed/.18)*(1-smooth((elapsed-(duration-.30))/.30));
 const beat=Math.sin(elapsed*(routine.pose==='drum'?13:
  routine.pose==='sing'?7.4:routine.pose==='juggle'?10:5.2));
 return {pose:routine.pose,weight,beat,elapsed,wind:routine.wind||1.3};
}
export const ENSEMBLE_DISPLAY_STYLE=Object.freeze({
 juggle:{lift:.12,lean:.04},drum:{lift:0,lean:.12},
 vault:{lift:.42,lean:.37},strings:{lift:0,lean:-.12},
 sing:{lift:.08,lean:-.10},hoop:{lift:.04,lean:-.22},
 mirror:{lift:.05,lean:.26},cannon:{lift:.06,lean:.55},
 crush:{lift:0,lean:-.32},slash:{lift:.08,lean:-.18},
 trapdoor:{lift:.02,lean:.13},curtain:{lift:.03,lean:-.18},
 finale:{lift:.08,lean:-.09},hush:{lift:0,lean:-.03}
});

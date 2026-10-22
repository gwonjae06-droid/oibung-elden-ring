export const FRENZY_WINDUP=3;
export function advanceFrenzyWindup(d,dt){if(d.state!=='frenzy-windup'||!Number.isFinite(dt)||dt<=0)return false;d.t=d.t+dt>=FRENZY_WINDUP-1e-9?FRENZY_WINDUP:d.t+dt;return d.t>=FRENZY_WINDUP;}
export function frenzyShake(d){if(d.state!=='frenzy-windup')return {x:0,z:0};const t=Number.isFinite(d.t)?Math.max(0,d.t):0,a=.04+.14*Math.min(1,t/FRENZY_WINDUP);return {x:Math.sin(t*74)*a,z:Math.sin(t*91)*a*.8};}

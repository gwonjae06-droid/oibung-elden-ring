export function qualityPixelRatio(cap=1.75){
 let low=false;try{low=globalThis.localStorage?.getItem('oibung.quality')==='low';}catch{}
 return Math.min(globalThis.devicePixelRatio||1,low?1:cap);
}
export function reducedMotion(){
 try{if(globalThis.localStorage?.getItem('oibung.motion')==='reduced')return true;}catch{}
 return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

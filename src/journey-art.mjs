const asset=name=>new URL('../assets/art/'+name,import.meta.url).href;
export const MURAL_SEALS=[
 {id:'spider',boss:'kwon',x:800,y:125},
 {id:'clown',boss:'clown',x:1265,y:435},
 {id:'dice',boss:'dice',x:1125,y:785},
 {id:'blood',boss:'blood',x:480,y:785},
 {id:'mirror',boss:'mirror',x:340,y:435},
];
// Keep the exported lookup compatible without moving seals away from wall sockets.
export const MURAL_PORTRAIT_SEALS=Object.freeze(Object.fromEntries(
 MURAL_SEALS.map(({id,x,y})=>[id,Object.freeze({x,y,scale:1})])
));
// Wall and reliefs share one viewBox and one meet transform in every orientation.
// Letterboxing is intentional: never crop the wall or independently fit the seals.
export function renderJourneyArt(scope='home'){
 const content=mode=>{
  const clip='stone-seal-clip-'+scope+'-'+mode;
  const ember='stone-crimson-fire-'+scope+'-'+mode;
  const defs=`<defs><clipPath id="${clip}"><circle cx="500" cy="500" r="485"/></clipPath>
   <filter id="${ember}" color-interpolation-filters="sRGB" x="-6%" y="-6%" width="112%" height="112%">
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 .18  0 0 0 0 .085  10 2 -12 0 -.5"/>
    <feComponentTransfer><feFuncA type="gamma" amplitude="1" exponent="1.5" offset="0"/></feComponentTransfer>
    <feGaussianBlur stdDeviation=".55"/>
   </filter></defs>`;
  const wallpaper=`<image class="j-stone-wall" href="${asset('temple-wall-v1.jpg')}" x="0" y="0" width="1600" height="1000" preserveAspectRatio="xMidYMid meet"/>`;
  const seal=(item,i)=>`<g class="j-emblem j-relief" data-emblem="${item.id}" data-boss="${item.boss}" style="--seal-delay:${-i*2.3}s" transform="translate(${item.x} ${item.y})"><g transform="translate(-105 -105) scale(.21)"><image class="j-relief-photo" href="${asset('seal-'+item.id+'-v1.jpg')}" width="1000" height="1000" clip-path="url(#${clip})"/><g class="mural-grooves"><image class="groove-inlay" href="${asset('seal-'+item.id+'-v1.jpg')}" width="1000" height="1000" clip-path="url(#${clip})" filter="url(#${ember})"/></g></g></g>`;
  return defs+wallpaper+MURAL_SEALS.map(seal).join('');
 };
 const mural=mode=>`<svg class="j-wall-${mode} j-relief-layer" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid meet">${content(mode)}</svg>`;
 return `<div class="j-scene j-temple j-photographic" aria-hidden="true">${mural('wide')}${mural('tall')}<div class="j-light-shafts"></div><div class="j-haze"></div><div class="j-embers"></div><div class="j-ash"></div></div>`;
}
export const JOURNEY_ART=renderJourneyArt('home');

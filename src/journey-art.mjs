const asset=name=>new URL('../assets/art/'+name,import.meta.url).href;
// Each boss relief shares its carved artwork with the filtered victory emission layer.
export const MURAL_SEALS=[
  {
    "id": "spider",
    "boss": "kwon",
    "x": 800,
    "y": 110
  },
  {
    "id": "clown",
    "boss": "clown",
    "x": 1265,
    "y": 435
  },
  {
    "id": "dice",
    "boss": "dice",
    "x": 1125,
    "y": 785
  },
  {
    "id": "blood",
    "boss": "blood",
    "x": 480,
    "y": 785
  },
  {
    "id": "mirror",
    "boss": "mirror",
    "x": 340,
    "y": 435
  }
];
// Stable, seam-free mural: one SVG photo layer, no duplicated CSS wallpaper.
// "slice" covers the viewport instead of letterboxing and revealing a white
// left/right border. Each SVG owns its unique clipping ID.
export function renderJourneyArt(scope='home'){
 const content=mode=>{
  const clip='stone-seal-clip-'+scope+'-'+mode;
  const ember='stone-crimson-fire-'+scope+'-'+mode;
  // Restore the original photographic inlay extraction, now crimson instead
  // of an unfiltered glitter duplicate. Both clip and filter IDs are scoped
  // to the SVG instance so home/transition and wide/tall cannot collide.
  const defs=`<defs><clipPath id="${clip}"><circle cx="500" cy="500" r="485"/></clipPath>
   <filter id="${ember}" color-interpolation-filters="sRGB" x="-6%" y="-6%" width="112%" height="112%">
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 .18  0 0 0 0 .085  10 2 -12 0 -.5"/>
    <feComponentTransfer><feFuncA type="gamma" amplitude="1" exponent="1.5" offset="0"/></feComponentTransfer>
    <feGaussianBlur stdDeviation=".55"/>
   </filter></defs>`;
  const seal=(item,i)=>`<g class="j-emblem j-relief" data-emblem="${item.id}" data-boss="${item.boss}" style="--seal-delay:${-i*2.3}s" transform="translate(${item.x} ${item.y})"><g transform="translate(-105 -105) scale(.21)"><image class="j-relief-photo" href="${asset('seal-'+item.id+'-v1.jpg')}" width="1000" height="1000" clip-path="url(#${clip})"/><g class="mural-grooves"><image class="groove-inlay" href="${asset('seal-'+item.id+'-v1.jpg')}" width="1000" height="1000" clip-path="url(#${clip})" filter="url(#${ember})"/></g></g></g>`;
  return defs+`<image class="j-stone-wall" href="${asset('temple-wall-v1.jpg')}" width="1600" height="1000"/>`+MURAL_SEALS.map(seal).join('');
 };
 return `<div class="j-scene j-temple j-photographic" aria-hidden="true"><svg class="j-wall-wide" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">${content('wide')}</svg><svg class="j-wall-tall" viewBox="560 0 480 1000" preserveAspectRatio="xMidYMid slice">${content('tall')}</svg><div class="j-light-shafts"></div><div class="j-haze"></div><div class="j-embers"></div><div class="j-ash"></div></div>`;
}
export const JOURNEY_ART=renderJourneyArt('home');

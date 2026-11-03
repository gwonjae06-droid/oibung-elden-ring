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
const defs='<defs><clipPath id="stone-seal-clip"><circle cx="500" cy="500" r="485"/></clipPath><filter id="stone-hot-inlay" color-interpolation-filters="sRGB" x="-10%" y="-10%" width="120%" height="120%"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 .38  0 0 0 0 .045  10 2 -12 0 -.5"/><feComponentTransfer><feFuncA type="gamma" amplitude="1" exponent="1.8" offset="0"/></feComponentTransfer><feGaussianBlur stdDeviation=".6" result="hot"/><feGaussianBlur in="hot" stdDeviation="4" result="halo"/><feMerge><feMergeNode in="halo"/><feMergeNode in="hot"/></feMerge></filter></defs>';
const sheen='<linearGradient id="stone-passing-light" x1="0" y1="0" x2="1" y2=".35" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#e7d2a7" stop-opacity="0"/><stop offset=".46" stop-color="#e7d2a7" stop-opacity="0"/><stop offset=".52" stop-color="#e7d2a7" stop-opacity=".14"/><stop offset=".62" stop-color="#e7d2a7" stop-opacity="0"/><stop offset="1" stop-color="#e7d2a7" stop-opacity="0"/></linearGradient>';
const seal=(s,i)=>`<g class="j-emblem j-relief" data-emblem="${s.id}" data-boss="${s.boss}" style="--seal-delay:${-i*2.3}s" transform="translate(${s.x} ${s.y})"><g transform="translate(-105 -105) scale(.21)"><image href="${asset('seal-'+s.id+'-v1.jpg')}" width="1000" height="1000" clip-path="url(#stone-seal-clip)"/><g class="mural-grooves"><image class="groove-inlay" href="${asset('seal-'+s.id+'-v1.jpg')}" width="1000" height="1000" filter="url(#stone-hot-inlay)" clip-path="url(#stone-seal-clip)"/></g><g clip-path="url(#stone-seal-clip)"><rect class="j-relief-sheen" width="1000" height="1000" fill="url(#stone-passing-light)"/></g></g></g>`;
const content=defs+`<defs>${sheen}</defs><image class="j-stone-wall" href="${asset('temple-wall-v1.jpg')}" width="1600" height="1000"/>`+MURAL_SEALS.map(seal).join('');
export const JOURNEY_ART=`<div class="j-scene j-temple j-photographic" aria-hidden="true"><svg class="j-wall-wide" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid meet">${content}</svg><svg class="j-wall-tall" viewBox="560 0 480 1000" preserveAspectRatio="xMidYMid meet">${content}</svg><div class="j-light-shafts"></div><div class="j-haze"></div><div class="j-embers"></div><div class="j-ash"></div></div>`;

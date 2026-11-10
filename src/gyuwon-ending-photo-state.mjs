export const GYUWON_ENDING_WATCHED='oibung.gyuwon.ending-watched';
export const GYUWON_ENDING_PHOTO='oibung.gyuwon.ensemble-photo';
export const GYUWON_ENDING_PHOTO_FALLBACK=new URL('../assets/art/gyuwon-ensemble-thanks.jpg',import.meta.url).href;
let completedHere=false,photoHere=null;
const validPhoto=image=>typeof image==='string'&&image.startsWith('data:image/jpeg;base64,')&&image.length>100&&image.length<900000;
export function completeGyuwonEnding(storage,image){
 completedHere=true;
 if(validPhoto(image)){photoHere=image;try{storage?.setItem(GYUWON_ENDING_PHOTO,image);}catch{}}
 // A quota failure for the large image must not discard the small completion
 // record. The shipped real-cast portrait repairs earlier missing photographs.
 try{storage?.setItem(GYUWON_ENDING_WATCHED,'1');}catch{}
}
export function readGyuwonEndingPhoto(storage){
 let watched=false,image=null;
 try{watched=storage?.getItem(GYUWON_ENDING_WATCHED)==='1';image=storage?.getItem(GYUWON_ENDING_PHOTO);}catch{}
 if(!watched&&!completedHere)return null;
 return validPhoto(image)?image:photoHere||GYUWON_ENDING_PHOTO_FALLBACK;
}

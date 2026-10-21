export const DICE_PHOTO_FACE=4;
export const DICE_PHOTO_PATH='../sungwon.jpg';
export function fitDicePhoto(width,height,size=512){if(![width,height,size].every(v=>Number.isFinite(v)&&v>0))throw Error('Invalid photo dimensions');const scale=Math.min(size/width,size/height),w=width*scale,h=height*scale;return {x:(size-w)/2,y:(size-h)/2,width:w,height:h};}

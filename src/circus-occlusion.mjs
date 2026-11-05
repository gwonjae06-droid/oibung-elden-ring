import {createCameraVisibility} from './camera-visibility.mjs';
export function createCircusOcclusion(scene,root){return createCameraVisibility(scene,{roots:[root]});}

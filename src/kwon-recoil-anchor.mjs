// Kwon's authored boss root is at (0,0,0) inside the locomotion parent.
// Visual hit recoil is an additive per-frame offset, never actual boss motion.
// Always restore the local model origin before the next frame's additive recoil,
// including after a developer damage shortcut or during hitstop.
export function anchorKwonVisualModel(model,baseY=0){
 if(!model?.position) return;
 model.position.set(0,Number.isFinite(baseY)?baseY:0,0);
}

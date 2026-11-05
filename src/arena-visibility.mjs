import {findOpenBattle} from './battle-dialogs.mjs';
// A modal encounter owns the entire screen. The first arena can keep its
// session and frame clock alive without drawing an invisible second 3D scene.
export function arenaCovered(doc){
 const journey=doc.getElementById('journey');
 return Boolean(doc.hidden||journey?.open&&!journey.hidden||findOpenBattle(doc));
}

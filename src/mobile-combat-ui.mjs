export const MOBILE_COMBAT_CSS=`
@media (max-width:760px),(pointer:coarse){
 #arena[data-combat-translucent] #player-hud{opacity:.74}
 #arena[data-combat-translucent] .brand{opacity:.55}
 #arena[data-combat-translucent] .top-actions{opacity:.7}
 #arena[data-combat-translucent] #controls{opacity:.55}
 #arena[data-combat-translucent] #touch{opacity:.64}
 #arena[data-combat-translucent] #notice.visible{opacity:.82}
 #arena[data-combat-translucent] #reticle{opacity:.85}
 #arena[data-combat-translucent] #touch:focus-within,#arena[data-combat-translucent] #touch:active,#arena[data-combat-translucent] .top-actions:focus-within{opacity:.94}
}
`;
const installed=new WeakSet();
export function createMobileCombatUi(doc=globalThis.document){
 let arena=null;
 function clear(){arena?.removeAttribute('data-combat-translucent');arena=null;}
 function update(g){if(!doc)return;const root=g.clown?doc.getElementById('clown-battle')?.firstElementChild?.shadowRoot:doc;if(!root){clear();return;}const next=root.getElementById('arena');if(arena!==next){clear();arena=next;}if(!arena)return;if(!installed.has(root)){const s=doc.createElement('style');s.dataset.mobileCombat='true';s.textContent=MOBILE_COMBAT_CSS;(root.head||root).appendChild(s);installed.add(root);}const menu=root.getElementById('menu'),pause=root.getElementById('pause-screen'),result=root.getElementById('result');const active=g.status==='playing'&&(!menu||menu.hidden)&&(!pause||pause.hidden)&&(!result||result.hidden);if(active)arena.setAttribute('data-combat-translucent','');else arena.removeAttribute('data-combat-translucent');}
 return {update,clear};
}

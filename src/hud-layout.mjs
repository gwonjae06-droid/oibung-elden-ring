const CSS = `
#arena .boss-hud{top:auto!important;bottom:64px!important;left:50%;width:min(1080px,82vw)!important;padding:10px 16px;background:linear-gradient(90deg,transparent,#080b10aa 15%,#080b10aa 85%,transparent);z-index:8}
#arena .boss-hud .boss-line{justify-content:space-between;align-items:end;margin-bottom:8px;gap:12px}
#arena .boss-hud .boss-line h2{font-size:clamp(18px,1.7vw,28px);margin:2px 0}
#arena .boss-hud #phase-label,#arena .boss-hud #boss-value{display:block;font-size:13px;line-height:1.5;color:#eee4cc}
#arena .boss-hud #boss-value{white-space:nowrap;font-variant-numeric:tabular-nums}
#arena .boss-hud .meter.boss{height:20px;border:1px solid #d8bc795c;box-shadow:0 2px 10px #0009}
@media(min-width:900px) and (pointer:fine){
 #arena .hud{top:100px;left:28px;width:clamp(320px,28vw,440px);padding:12px 16px;background:#0b110eb3}
 #arena .hud .player-line{font-size:16px;margin-bottom:8px}
 #arena .hud .player-line strong{display:inline}
 #arena .hud .stat{gap:8px;margin:6px 0}
 #arena .hud .stat>span{position:static;width:32px;height:auto;overflow:visible;clip-path:none;white-space:normal;font-size:13px}
 #arena .hud .stat b{display:block;min-width:36px;font-size:14px}
 #arena .hud .meter{height:13px}
 #arena .hud #skill-hud{padding:8px;margin-top:10px}
 #arena .hud .skill-line{font-size:13px;gap:8px}
 #arena .hud .skill-line strong{font-size:16px}
 #arena .hud .skill-line>span:first-child,#arena .hud #skill-text,#arena .hud .flask-line>span,#arena .hud #lock-label{display:block}
 #arena .hud #skill-text{font-size:12px;line-height:1.5;margin-top:4px}
 #arena .hud .flask-line{font-size:14px;gap:8px;margin-top:8px}
 #arena .hud .flask-line>span{font-size:12px}
 #arena .top-actions{top:24px;right:28px;gap:10px}
 #arena .top-actions button,#arena .pause-settings button{min-height:48px;font-size:15px;padding:10px 18px}
 #arena .brand strong{font-size:24px}
 #arena .brand svg{width:40px;height:40px}
 #arena .menu-panel{width:min(600px,100%);padding:36px}
 #arena .small-panel{width:min(540px,100%);padding:36px}
 #arena .menu-panel button,#arena .small-panel button{min-height:50px;font-size:16px}
 #arena .weapon strong{font-size:19px}
 #arena .weapon small{font-size:13px}
 #arena #controls:not([hidden]){display:flex!important;bottom:16px;left:20px;right:20px;gap:8px 18px;font-size:12px;line-height:1.6;padding:5px 10px;background:#080b1077}
 #arena #notice{font-size:16px}
}
@media(pointer:coarse){
 #arena .boss-hud{top:auto!important;bottom:176px!important;width:86vw!important;padding:6px 10px}
 #arena .boss-hud .meter.boss{height:12px}
 #arena .boss-hud .boss-line h2{font-size:16px}
 #arena .boss-hud #phase-label,#arena .boss-hud #boss-value{font-size:10px}
}
@media(pointer:coarse) and (orientation:landscape){
 #arena .boss-hud{bottom:max(8px,env(safe-area-inset-bottom))!important;width:min(620px,48vw)!important;padding:4px 8px}
 #arena .boss-hud .boss-line{display:flex;margin-bottom:3px;gap:6px}
 #arena .boss-hud .boss-line h2{font-size:12px}
 #arena .boss-hud #phase-label{display:none}
 #arena .boss-hud .meter.boss{height:10px}
}
@media(pointer:fine) and (max-height:650px){
 #arena .hud{top:70px;padding:6px 10px}
 #arena .hud #skill-hud{margin-top:4px;padding:4px}
 #arena .boss-hud{bottom:48px!important;padding:5px 12px}
 #arena .boss-hud .boss-line h2{font-size:18px}
 #arena .boss-hud .meter.boss{height:16px}
 #arena #controls:not([hidden]){bottom:8px;font-size:11px}
}
`;
export function installHudLayout(root){
 const doc=root.ownerDocument||root;
 const target=root.head||root;
 if(!doc.createElement||typeof target?.appendChild!=='function')return ()=>{};
 const style=doc.createElement('style');
 if(style.dataset)style.dataset.odenringHudLayout='1';
 else style.setAttribute?.('data-odenring-hud-layout','1');
 style.textContent=CSS;
 target.appendChild(style);
 return ()=>style.remove();
}

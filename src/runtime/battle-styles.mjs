export function loadBattleStyles(root,doc,urls) {
  let disposed=false;
  const pending=new Set(),links=[];
  const ready=Promise.all(urls.map(url=>new Promise(resolve=>{
    let link;
    const finish=ok=>{if(!pending.delete(finish))return;if(link)link.onload=link.onerror=null;resolve(ok);};
    pending.add(finish);
    try {
      link=doc.createElement('link');links.push(link);
      link.rel='stylesheet';link.href=String(url);
      link.onload=()=>finish(true);link.onerror=()=>finish(false);
      root.prepend(link);
    } catch { finish(false); }
  }))).then(results=>!disposed&&results.every(Boolean));
  return {ready,dispose(){
    if(disposed)return;disposed=true;
    for(const finish of [...pending])finish(false);
    for(const link of links){link.onload=link.onerror=null;link.remove();}
    links.length=0;
  }};
}

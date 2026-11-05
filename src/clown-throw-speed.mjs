export const CLOWN_THROW_SLOW=1.1;
export function slowClownThrow(c,q,factor=CLOWN_THROW_SLOW){
 if(!c||!q||!['head','ball'].includes(q.kind)||!(q.fly>=.3)||!(q.warn>=q.fly))return false;
 const oldWarn=q.warn;q.fly*=factor;q.warn*=factor;
 const z=(c.zones||[]).find(z=>z.id===q.zone);
 if(z&&z.state==='warn'&&Math.abs(z.warn-oldWarn)<1e-6)z.warn=q.warn;
 return true;
}

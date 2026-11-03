export function eligibleEncounter(state,bossId,ready=true,expectedId){return Boolean(ready&&state&&Number.isSafeInteger(state.encounterId)&&state.encounterId>0&&state.bossId===bossId&&state.status==='won'&&state.outcome==='won'&&(expectedId===undefined||state.encounterId===expectedId));}
export function createProgressionGate(bossId,read){
 if(!['kwon','clown'].includes(bossId)||typeof read!=='function')throw new TypeError('Invalid progression gate');
 let active=null,lastId=null,serial=0;
 function begin(ready=true){const state=read();if(active||!eligibleEncounter(state,bossId,ready))return null;const ticket=Object.freeze({encounterId:state.encounterId,bossId,weapon:state.weapon,attempt:++serial});active=ticket;lastId=state.encounterId;return ticket;}
 function automatic(ready=true){const state=read();if(!eligibleEncounter(state,bossId,ready)||state.encounterId===lastId)return null;return begin(ready);}
 function valid(ticket,ready=true){return Boolean(ticket&&active===ticket&&eligibleEncounter(read(),bossId,ready,ticket.encounterId));}
 function end(ticket){if(active===ticket)active=null;}
 return Object.freeze({begin,automatic,valid,end});
}

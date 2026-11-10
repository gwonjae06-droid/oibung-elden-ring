// Only coarse summaries reach the server. A modified browser can omit or
// fabricate them: this is a review signal, NOT proof of AI or an anti-cheat.
const number=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function classifyEventRisk(input){
 const {durationMs,events,untrusted,rapid,cadence}=input||{};
 if(!number(durationMs,15000,120000)||!number(events,12,2000)||
    !number(untrusted,0,events)||!number(rapid,0,events)||
    !number(cadence,0,events))return null;
 const flags=[];
 let delta=0;
 if(untrusted>=25&&untrusted>=events*.7){delta+=35;flags.push('synthetic_action_majority');}
 else if(untrusted>=8&&untrusted>=events*.4){delta+=20;flags.push('synthetic_action_cluster');}
 // Sub-12 ms consecutive actions / mechanically steady repeating input.
 if(rapid>=10&&events>=30){delta+=20;flags.push('sub_12ms_action_burst');}
 if(cadence>=10&&events>=30){delta+=20;flags.push('near_perfect_action_cadence');}
 return {delta:Math.min(45,delta),flags};
}
export function riskLevel(score,hold=false){
 if(hold||score>=85)return 'hold';
 if(score>=60)return 'verify';
 if(score>=35)return 'observe';
 return 'normal';
}
export function nextEventRisk(currentScore,report,existingFlags=[]){
 const evidence=classifyEventRisk(report);
 if(!evidence)return null;
 const score=Math.min(100,Math.max(0,Number(currentScore)||0)+evidence.delta);
 const flags=[...new Set([...(Array.isArray(existingFlags)?existingFlags:[]),...evidence.flags])].slice(0,12);
 return {score,flags,hold:score>=85,level:riskLevel(score,score>=85),delta:evidence.delta};
}

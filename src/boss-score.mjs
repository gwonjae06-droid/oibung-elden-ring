export const MUSIC_LOOP=128;
export function musicTempo(boss,phase=1){return boss==='dice'?(phase===2?144:132):boss==='clown'?(phase===2?138:116):(phase===2?108:84);}
const hz=n=>440*2**((n-69)/12);
export function score(boss,phase,tick){
 if(!['kwon','clown','dice'].includes(boss)||!Number.isFinite(tick))return [];
 const b=((Math.floor(tick)%MUSIC_LOOP)+MUSIC_LOOP)%MUSIC_LOOP,bar=Math.floor(b/8),s=b%8,p=phase===2?2:1,u=30/musicTempo(boss,p),notes=[];
 const add=(voice,n,length,vol,at=0)=>notes.push({voice,f:hz(n),dur:length*u,vol,at:at*u});
 if(boss==='dice'){
  // Original upbeat swing: walking bass, syncopated piano shells and brass call-and-response.
  const roots=[48,48,45,45,50,55,48,55,53,54,48,45,50,55,48,55],r=roots[bar],minor=[2,3,4,11,12].includes(bar),third=minor?3:4,seventh=[5,7,9,13,15].includes(bar)?10:11;
  const swing=s%2?.33:0;
  if(s%2===0)add('bass',r-12+[0,third,7,9][s/2],1.7,.12);
  if([1,4,7].includes(s)){add('piano',r+12+third,1.2,.047,swing);add('piano',r+12+seventh,1.2,.037,swing);add('piano',r+19,1.2,.025,swing);}
  if(s===0||s===4)add('kick',36,.65,.065);
  if(s===2||s===6)add('snare',60,.45,.028);
  add('cymbal',84,.38,s%2?.013:.019,swing);
  const hook=[12,16,19,21,19,16,14,11];
  if(bar%4<2&&[0,3,4,6].includes(s))add('trumpet',r+hook[(bar%2)*4+[0,3,4,6].indexOf(s)],.85,.045,swing);
  if(bar%4>=2&&[1,4,7].includes(s))add('trombone',r+12+[third,7,seventh][[1,4,7].indexOf(s)],1,.045,swing);
 }else if(boss==='kwon'){

  const roots=[50,46,53,45,50,43,46,45,50,53,55,46,43,46,45,50],thirds=[3,4,4,4,3,3,4,4,3,4,3,4,3,4,4,3],r=roots[bar],third=thirds[bar],arp=[0,7,12,12+third,7,12,19,12+third];
  if(p===2||s%2===0)add('piano',r+arp[s],p===2?1.7:2.5,s%4===0?.095:.065);
  if(s===0)add('piano',r-12,6,.09);
  const melody=[74,77,76,72,70,69,72,73,74,81,79,77,76,73,69,73,77,81,79,76,75,72,70,69,70,74,73,69,73,76,81,73,74,76,77,81,79,77,76,72,79,82,81,77,76,74,73,70,72,75,74,70,73,76,79,77,76,73,69,73,74,77,76,74];
  if(s%2===0&&!(bar%4===3&&s===6))add('violin',melody[b/2]+(p===2&&bar>=8?12:0),s===4?3.4:1.8,.082);
  if(bar%4===3&&s>=4&&s%2===0)add('piano',r+24+(s===4?7:third),1.6,.075);
  if(p===2&&s===0)add('violin',r+12,6,.035);
 }else{
  const roots=[48,53,55,48,56,51,50,55],r=roots[bar%8],theme=[72,76,79,76,74,77,81,77,79,83,81,77,76,74,72,67,80,79,77,75,79,75,72,70,74,77,76,73,71,74,77,79];
  if(s===0||s===4)add('kick',36,.85,.13);
  if(s===2||s===6)add('snare',60,.65,.06);
  if(s%2===0){add('trombone',r+(s%4===2?7:0),1.15,.075);if(s%4===2)add('trombone',r+16,1,.03);}
  if(bar%4<2&&s%2===0)add('trumpet',theme[(bar%8)*4+s/2]+(bar>=8?12:0),.95,.08);
  if(bar%4>=2&&(s===1||s===4||s===7))add('trombone',r+24+[0,7,4][s===1?0:s===4?1:2],1,.068,.1);
  if(s===0&&bar%4===0)add('cymbal',84,2.8,.025);
  if(bar%4===3&&s>=6){add('snare',60,.45,.035,.25);add('tom',43,.7,.06,.65);}
  if(b%16===14)add('voice',p===2?r+18:r+12,1.8,.032);
  if(p===2&&s%2===1){add('snare',60,.45,.027,.15);if(s===7)add('trumpet',r+25,.8,.045,.2);}
 }
 return notes;
}

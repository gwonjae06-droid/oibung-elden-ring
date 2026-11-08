// Spoken dialogue is optional. When Korean speech synthesis is missing,
// the complete authored line is still displayed as in-world subtitle.
// No pattern instructions or telegraph timing are spoken.
export function createGyuwonMusicalNarrator(win=globalThis.window){
 const synth=win?.speechSynthesis;let disposed=false;
 function speak(line,{muted=false,sad=false}={}){
  if(disposed||muted||!synth||typeof win.SpeechSynthesisUtterance!=='function')return false;
  try{
   synth.cancel();
   const utterance=new win.SpeechSynthesisUtterance(String(line));
   utterance.lang='ko-KR';utterance.rate=sad?.79:.94;utterance.pitch=sad?.93:1.12;
   utterance.volume=sad?.72:.63;
   const voice=synth.getVoices?.().find(v=>v.lang?.toLowerCase().startsWith('ko'));
   if(voice)utterance.voice=voice;
   synth.speak(utterance);return true;
  }catch{return false;}
 }
 function stop(){try{synth?.cancel?.();}catch{}}
 return {speak,stop,dispose(){disposed=true;stop();}};
}

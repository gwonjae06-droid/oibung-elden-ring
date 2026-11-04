export function createBossSecret(){
 const sequence=['KeyO','KeyD','KeyE','KeyN'];let index=0,lastKey=-Infinity,taps=0,lastTap=-Infinity;
 return {key(code,time){if(time-lastKey>1800)index=0;lastKey=time;
  index=code===sequence[index]?index+1:code===sequence[0]?1:0;
  if(index===sequence.length){index=0;return true;}return false;
 },tap(time){taps=time-lastTap<=1000?taps+1:1;lastTap=time;if(taps>=5){taps=0;return true;}return false;},reset(){index=taps=0;lastKey=lastTap=-Infinity;}};
}

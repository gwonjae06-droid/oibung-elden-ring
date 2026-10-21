export function shouldStartDice(open,visible,kicker){return Boolean(open&&visible)&&String(kicker).trim()==='승리';}
export function diceWeapon(value){return ['sword','hammer','bow','cards'].includes(value)?value:'sword';}
export function createDiceGate(){let seen=false,active=false;return {observe(open,visible,kicker){if(!visible){seen=false;return false;}if(seen||active||!shouldStartDice(open,visible,kicker))return false;seen=true;return true;},begin(){if(active)return false;active=true;return true;},end(){active=false;}};}

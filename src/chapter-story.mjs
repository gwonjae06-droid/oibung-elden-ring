export const KWON_MEMORY=Object.freeze({id:'kwon',title:'검사가 되지 못한 자',oath:'강함과 자존',last:'그는 마침내 검을 쥐었으나, 그것을 쥔 자신을 잃었다.',text:'그는 자신의 손을 내려다보았다. 아무리 노력해도 검은 그에게 어울리지 않았다. 그럼에도 그는, 검을 놓지 않았다.'});
export const CHAPTER_MEMORIES=Object.freeze({kwon:KWON_MEMORY,
 clown:Object.freeze({id:'clown',title:'영원한 마지막 공연',oath:'인정과 외로움',last:'그는 마지막까지 웃음을 원했다. 그러나 마지막에 남은 것은 침묵이었다.',text:'공연이 끝난 뒤 아무도 남아 있지 않은 객석이 가장 두려웠다. 서약은 관객을 남겼지만, 그들의 얼굴과 진정한 웃음을 앗아 갔다.'}),
 dice:Object.freeze({id:'dice',title:'운명의 마지막 판돈',oath:'선택과 자유의지',last:'그는 운명을 손에 넣으려 했다. 그러나 마지막까지, 자신의 눈금 하나 고르지 못했다.',text:'그는 동전을 던지기 전부터 결과를 알고 싶었다. 언제나 이기는 선택을 원했던 자는, 끝내 누군가가 던지는 주사위가 되었다.'})});
export function rememberBoss(profile,id,firstClear=new Date().toISOString()){
 if(!Object.hasOwn(CHAPTER_MEMORIES,id))return;
 profile.memories??=[];if(!profile.memories.some(m=>m.id===id))profile.memories.push({id,firstClear});
}
export function rememberKwon(profile,firstClear=new Date().toISOString()){rememberBoss(profile,'kwon',firstClear);}

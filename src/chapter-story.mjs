export const KWON_MEMORY=Object.freeze({id:'kwon',title:'검사가 되지 못한 자',oath:'강함과 자존',last:'그는 마침내 검을 쥐었으나, 그것을 쥔 자신을 잃었다.',text:'그는 자신의 손을 내려다보았다. 아무리 노력해도 검은 그에게 어울리지 않았다. 그럼에도 그는, 검을 놓지 않았다.'});
export function rememberKwon(profile){profile.memories??=[];if(!profile.memories.some(m=>m.id==='kwon'))profile.memories.push({id:'kwon',firstClear:new Date().toISOString()});}

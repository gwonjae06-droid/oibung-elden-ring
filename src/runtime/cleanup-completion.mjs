export function checkCleanupTimeout(ms){if(!Number.isFinite(ms)||ms<=0)throw new RangeError('cleanupTimeoutMs must be positive and finite');}
export function combineCleanupReports(reports){const result={errors:[],timeouts:[]};for(const report of reports){if(Array.isArray(report?.errors))result.errors.push(...report.errors);if(Array.isArray(report?.timeouts))result.timeouts.push(...report.timeouts);}return result;}
export function settleCleanup(fn,label,{timeoutMs=2000,schedule=(fn,ms)=>globalThis.setTimeout(fn,ms),cancel=id=>globalThis.clearTimeout(id)}={}){
 checkCleanupTimeout(timeoutMs);
 return new Promise(resolve=>{
  let done=false,timer=null;
  function finish(report){if(done)return;done=true;if(timer!==null){try{cancel(timer);}catch(error){report.errors.push({label:label+':cancel deadline',error});}timer=null;}resolve(report);}
  function failed(error){finish({errors:[{label,error}],timeouts:[]});}
  function normalize(value){const report={errors:[],timeouts:[]};if(Array.isArray(value?.errors))for(const error of value.errors)report.errors.push(error&&typeof error.label==='string'&&'error' in error?error:{label,error});if(Array.isArray(value?.timeouts))report.timeouts.push(...value.timeouts);return report;}
  try{const value=fn();if(!value||typeof value.then!=='function'){finish(normalize(value));return;}const pending=Promise.resolve(value);pending.then(value=>{if(done)return;try{finish(normalize(value));}catch(error){failed(error);}},error=>{if(!done)failed(error);});timer=schedule(()=>finish({errors:[],timeouts:[{label,timeoutMs}]}),timeoutMs);}catch(error){failed(error);}
 });
}

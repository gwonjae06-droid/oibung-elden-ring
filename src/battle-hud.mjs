// Shared meter contract, including accessibility values when only the maximum changes.
export function renderBattleMeter(element,value,max,{round=Math.ceil}={}) {
  const ratio=Number.isFinite(value)&&Number.isFinite(max)&&max>0
    ?Math.max(0,Math.min(1,value/max)):0;
  const transform='scaleX('+ratio+')';
  if(element.style.transform!==transform)element.style.transform=transform;
  const now=String(round(value)),limit=String(max),meter=element.parentElement;
  if(meter.getAttribute('aria-valuenow')!==now)meter.setAttribute('aria-valuenow',now);
  if(meter.getAttribute('aria-valuemax')!==limit)meter.setAttribute('aria-valuemax',limit);
}

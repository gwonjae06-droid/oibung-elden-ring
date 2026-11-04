// Low-quality and reduced-motion modes are intentionally unsupported (docs/boss-design-rules.md, rule E1).
// The exports remain so existing callers keep working; they never switch to a reduced mode.
export function qualityPixelRatio(cap=1.75){return Math.min(globalThis.devicePixelRatio||1,cap);}
export function reducedMotion(){return false;}

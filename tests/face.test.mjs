import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSS_FACE as F} from '../src/boss-face.mjs';
import {spanAt,faceSize,bladeSize,facePolygon,bladePolygon,drawFace,drawBlade} from '../src/face.mjs';

function jpegSize(b64){
  const b=Buffer.from(b64,'base64');
  assert.equal(b[0],0xff);assert.equal(b[1],0xd8,'not a JPEG');
  let i=2;
  while(i<b.length){
    assert.equal(b[i],0xff);
    const m=b[i+1],len=b.readUInt16BE(i+2);
    if(m===0xc0||m===0xc2)return {h:b.readUInt16BE(i+5),w:b.readUInt16BE(i+7)};
    i+=2+len;
  }
  throw new Error('no SOF marker');
}
test('embedded photo is a small valid JPEG matching the declared size',()=>{
  const s=jpegSize(F.jpeg);
  assert.deepEqual(s,{w:F.w,h:F.h});
  assert.ok(F.jpeg.length<20000,'photo data should stay small, got '+F.jpeg.length);
});
test('silhouette rows are complete, ordered and inside the image',()=>{
  assert.equal(F.rows.length,Math.ceil(F.h/F.step));
  for(const [l,r] of F.rows){assert.ok(l>=0&&r<=F.w&&r>l,'bad row '+l+','+r);}
  assert.ok(F.chin>F.h*0.6&&F.chin<F.h,'chin start must be in the lower part');
});
test('the chin narrows toward its tip (sword shape source)',()=>{
  const [l0,r0]=spanAt(F,F.chin),[l1,r1]=spanAt(F,F.h-1);
  assert.ok((r1-l1)*3<(r0-l0),'tip '+(r1-l1)+' base '+(r0-l0));
});
test('the mask covers the face down to the chin line only; the blade is the stretched rest',()=>{
  assert.deepEqual(faceSize(F),{w:F.w,h:F.chin});
  const b=bladeSize(F,16);
  assert.ok(b.h>(F.h-F.chin)*15&&b.h/b.w>3,'blade '+b.w+'x'+b.h);
});
test('the face polygon follows the photo silhouette exactly and ends on the chin line',()=>{
  const poly=facePolygon(F),n=poly.length/2;
  assert.equal(poly[0][1],0);assert.equal(poly[n-1][1],F.chin);
  for(let i=0;i<n;i++){
    const [l,r]=spanAt(F,Math.min(F.h-.5,poly[i][1]));
    assert.ok(Math.abs(poly[i][0]-l)<1e-9&&Math.abs(poly[poly.length-1-i][0]-r)<1e-9,'row '+i);
  }
});
test('polygons stay inside their canvases',()=>{
  for(const [poly,size] of [[facePolygon(F),faceSize(F)],[bladePolygon(F,16),bladeSize(F,16)]]){
    for(const [x,y] of poly){assert.ok(x>=0&&x<=size.w&&y>=0&&y<=size.h,'out of bounds '+x+','+y);}
  }
});
test('blade is wide at its base and pointed at the far end',()=>{
  const poly=bladePolygon(F,16);
  const n=poly.length/2;
  const width=i=>poly[poly.length-1-i][0]-poly[i][0];
  assert.ok(width(0)>40);
  assert.ok(width(n-1)*5<width(0),'tip '+width(n-1)+' base '+width(0));
});
test('the blade continues exactly where the face stops (same width at the join)',()=>{
  const face=facePolygon(F),blade=bladePolygon(F,16);
  const fn=face.length/2;
  const faceBottom=face[face.length-1-(fn-1)][0]-face[fn-1][0];
  const bladeTop=blade[blade.length-1][0]-blade[0][0];
  assert.ok(Math.abs(faceBottom-bladeTop)<3,'face bottom '+faceBottom+' blade base '+bladeTop);
});
function fakeCtx(){
  const calls=[];
  return {calls,imageSmoothingQuality:'',save(){calls.push('save');},restore(){calls.push('restore');},beginPath(){calls.push('begin');},
    moveTo(){calls.push('move');},lineTo(){},closePath(){calls.push('close');},clip(){calls.push('clip');},
    translate(x,y){calls.push(['translate',x,y]);},scale(x,y){calls.push(['scale',x,y]);},
    drawImage(...a){calls.push(['draw',...a]);}};
}
test('drawFace clips to the silhouette and copies only the part above the chin line',()=>{
  const c=fakeCtx(),img={width:F.w*2,height:F.h*2};
  drawFace(c,img,F);
  const draws=c.calls.filter(x=>x[0]==='draw');
  assert.equal(draws.length,1);
  assert.ok(c.calls.indexOf('clip')<c.calls.indexOf(draws[0]));
  const [,,,,,sh,,dy,,dh]=draws[0];
  assert.equal(sh,F.chin*2);assert.equal(dy,0);assert.equal(dh,F.chin);
  assert.equal(c.calls.filter(x=>x==='save').length,c.calls.filter(x=>x==='restore').length);
});
test('drawBlade flips vertically so the chin tip ends up at the top',()=>{
  const c=fakeCtx(),img={width:F.w,height:F.h};
  drawBlade(c,img,F,16);
  const size=bladeSize(F,16);
  assert.deepEqual(c.calls.find(x=>x[0]==='translate'),['translate',0,size.h]);
  assert.deepEqual(c.calls.find(x=>x[0]==='scale'),['scale',1,-1]);
  const draw=c.calls.find(x=>x[0]==='draw');
  assert.equal(draw[3],F.chin*1);
  assert.equal(draw[9],size.h);
});
test('the blade silhouette follows the stretch along its whole length',()=>{
  const k=16,size=bladeSize(F,k),poly=bladePolygon(F,k),n=poly.length/2;
  for(const frac of [.25,.5,.75]){
    const y=size.h*frac,i=poly.slice(0,n).findIndex(p=>p[1]>=y);
    const w=poly[poly.length-1-i][0]-poly[i][0];
    const [l,r]=spanAt(F,F.chin+(F.h-F.chin)*frac);
    assert.ok(Math.abs(w-(r-l))<4,'at '+frac+': poly '+w+' vs source '+(r-l));
  }
});

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
test('sizes: face chin is stretched, blade is extremely long',()=>{
  assert.equal(faceSize(F,1).h,F.h);
  assert.ok(faceSize(F,2.2).h>F.h*1.1);
  const b=bladeSize(F,16);
  assert.ok(b.h>(F.h-F.chin)*15&&b.h/b.w>3,'blade '+b.w+'x'+b.h);
});
test('polygons stay inside their canvases and keep the upper face unstretched',()=>{
  for(const [poly,size] of [[facePolygon(F,2.2),faceSize(F,2.2)],[bladePolygon(F,16),bladeSize(F,16)]]){
    for(const [x,y] of poly){assert.ok(x>=0&&x<=size.w&&y>=0&&y<=size.h,'out of bounds '+x+','+y);}
  }
  const p1=facePolygon(F,1),p2=facePolygon(F,3);
  const at=(p,y)=>p.find(q=>q[1]===y);
  assert.deepEqual(at(p1,40),at(p2,40));
});
test('blade is wide at its base and pointed at the far end',()=>{
  const poly=bladePolygon(F,16);
  const n=poly.length/2;
  const width=i=>poly[poly.length-1-i][0]-poly[i][0];
  assert.ok(width(0)>40);
  assert.ok(width(n-1)*5<width(0),'tip '+width(n-1)+' base '+width(0));
});
function fakeCtx(){
  const calls=[];
  return {calls,imageSmoothingQuality:'',save(){calls.push('save');},restore(){calls.push('restore');},beginPath(){calls.push('begin');},
    moveTo(){calls.push('move');},lineTo(){},closePath(){calls.push('close');},clip(){calls.push('clip');},
    translate(x,y){calls.push(['translate',x,y]);},scale(x,y){calls.push(['scale',x,y]);},
    drawImage(...a){calls.push(['draw',...a]);}};
}
test('drawFace clips to the silhouette and draws the lower face stretched',()=>{
  const c=fakeCtx(),img={width:F.w*2,height:F.h*2};
  drawFace(c,img,F,2.2);
  const draws=c.calls.filter(x=>x[0]==='draw');
  assert.equal(draws.length,2);
  assert.ok(c.calls.indexOf('clip')<c.calls.indexOf(draws[0]));
  const [,,,,,sh,,dy,,dh]=draws[1];
  assert.equal(sh,(F.h-F.chin)*2);
  assert.equal(dy,F.chin);
  assert.ok(dh>(F.h-F.chin)*2,'destination must be taller than source');
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

test('the silhouette follows the stretch: a point halfway down the stretched chin has the width of the halfway source row',()=>{
  const k=2.2,size=faceSize(F,k),poly=facePolygon(F,k),n=poly.length/2;
  const yMid=F.chin+(size.h-F.chin)/2;
  const i=poly.slice(0,n).findIndex(p=>p[1]>=yMid);
  const w=poly[poly.length-1-i][0]-poly[i][0];
  const [l,r]=spanAt(F,F.chin+(F.h-F.chin)/2);
  assert.ok(Math.abs(w-(r-l))<4,'poly width '+w+' vs source '+(r-l));
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

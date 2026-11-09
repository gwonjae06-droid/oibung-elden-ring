import test from 'node:test';
import assert from 'node:assert/strict';
import {
 GYUWON_ARMY_DOODLE_WIDTH,GYUWON_ARMY_DOODLE_HEIGHT,
 gyuwonArmyDoodleFrame,gyuwonArmyDoodleSample,
 gyuwonArmyInkAlpha,createGyuwonArmyDoodle
} from '../src/gyuwon-army-doodle.mjs';

test('living pencil has Act V-style alternating 8Hz strokes and bounded sampling',()=>{
 assert.equal(gyuwonArmyDoodleFrame(0),0);
 assert.equal(gyuwonArmyDoodleFrame(.126),1);
 assert.equal(gyuwonArmyDoodleFrame(.26),0);
 assert.equal(gyuwonArmyDoodleFrame(.26,true),0);
 assert.equal(gyuwonArmyDoodleSample(.13),1);
 assert.equal(gyuwonArmyDoodleSample(.26,true),1);
 assert.ok(GYUWON_ARMY_DOODLE_WIDTH*GYUWON_ARMY_DOODLE_HEIGHT<=60000);
 assert.equal(gyuwonArmyInkAlpha(0,1),0);
 assert.ok(gyuwonArmyInkAlpha(.15,.6)>gyuwonArmyInkAlpha(.03,.6));
});
function makeDoc(tainted=false){
 const canvases=[];
 return {canvases,createElement(){
  const canvas={width:0,height:0,getContext(){
   if(this.ctx)return this.ctx;
   const ctx={calls:[],globalAlpha:1,globalCompositeOperation:'source-over',stack:[],
    clearRect(){},fillRect(){this.calls.push('fillRect');},
    fill(){},stroke(){},beginPath(){},moveTo(){},lineTo(){},
    save(){this.stack.push([this.globalAlpha,this.globalCompositeOperation]);},
    restore(){[this.globalAlpha,this.globalCompositeOperation]=this.stack.pop();},
    drawImage(){this.calls.push('drawImage');},
    createPattern(){this.calls.push('createPattern');return {tile:true};},
    getImageData(x,y,w,h){if(tainted)throw Error('SecurityError');const data=new Uint8ClampedArray(w*h*4);
     for(let i=0;i<data.length;i+=4){const n=(i/4)%w>w/2?220:70;data[i]=data[i+1]=data[i+2]=n;data[i+3]=255;}return {data};},
    createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},
    putImageData(){this.calls.push('putImageData');}
   };
   this.ctx=ctx;return ctx;
  }};
  canvases.push(canvas);return canvas;
 }};
}
test('paper pattern is static and ink sampling occurs only every eighth second',()=>{
 const doc=makeDoc(),doodle=createGyuwonArmyDoodle(doc),stage=makeDoc().createElement().getContext();
 const source={width:1280,height:720};
 doodle.draw(source,stage,{time:0,scale:1,ratio:1});
 doodle.draw(source,stage,{time:.11,scale:1,ratio:1});
 assert.equal(doodle.stats().inkFrames,1);
 doodle.draw(source,stage,{time:.13,scale:1,ratio:1});
 assert.equal(doodle.stats().inkFrames,2);
 assert.equal(stage.calls.filter(x=>x==='createPattern').length,1);
 assert.equal(stage.globalAlpha,1);
 assert.equal(stage.globalCompositeOperation,'source-over');
 assert.equal(doodle.stats().sampleWidth,320);
 doodle.dispose();assert.equal(doc.canvases[0].width,0);
});
test('pixel readback may fail without breaking paper rendering',()=>{
 const d=createGyuwonArmyDoodle(makeDoc(true)),c=makeDoc().createElement().getContext();
 assert.doesNotThrow(()=>d.draw({},c,{time:1,scale:1,ratio:1}));
 assert.equal(d.stats().active,false);
 assert.ok(c.calls.includes('fillRect'));
 d.dispose();
});

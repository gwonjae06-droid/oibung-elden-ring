import test from 'node:test';
import assert from 'node:assert/strict';
import {GYUWON_PERFORMANCE_ROUTE as ROUTE,gyuwonDisplayYear,gyuwonNextPerformance,gyuwonPerformanceProgress,gyuwonCurtainBridge} from '../src/gyuwon-musical-route.mjs';
import {createGyuwonGame,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {createGyuwonMusicalScore} from '../src/gyuwon-musical-score.mjs';
import {GYUWON_SONGS} from '../src/gyuwon-song-data.mjs';
import {curtainDanceAt} from '../src/gyuwon-curtain-ensemble.mjs';

test('the live route has continuous labels and retains each original recording identity',()=>{
 assert.deepEqual(ROUTE,[5,6,8,9,11]);
 assert.deepEqual(ROUTE.map(y=>gyuwonDisplayYear(y)),[5,6,7,8,9]);
 assert.equal(gyuwonDisplayYear(11,{finishing:true}),10);
 assert.deepEqual(ROUTE.map(gyuwonNextPerformance),[6,8,9,11,'ending']);
 for(let i=0;i<ROUTE.length-1;i++)assert.equal(gyuwonPerformanceProgress(ROUTE[i],1),gyuwonPerformanceProgress(ROUTE[i+1],0));
});

test('native ended events traverse retained songs without constructing or preloading army/shooter audio',()=>{
 const media=[];let now=0;
 const score=createGyuwonMusicalScore(url=>{const a={url,paused:true,currentTime:0,duration:180,ended:false,play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;},removeAttribute(){},load(){}};media.push(a);return a;},()=>now);
 const g=createGyuwonGame('sword',{yearMode:true,seed:732});g.gyuwon.years.year=5;g.boss.hp=6000;g.player.invuln=1e6;stepGyuwon(g,.01);
 for(const year of ROUTE){
  assert.equal(g.gyuwon.years.year,year);score.update(g);
  const audio=media.find(a=>!a.paused);assert.ok(decodeURIComponent(audio.url).endsWith(GYUWON_SONGS[year].source));
  audio.currentTime=179.99;score.update(g);stepGyuwon(g,.01);assert.equal(g.gyuwon.years.year,year,'a layout duration must not skip music');
  audio.ended=true;audio.onended();
  for(let i=0;i<76;i++){now+=1/60;score.update(g);stepGyuwon(g,1/60);}
  assert.equal(g.boss.hp,GYUWON_SONGS[year].target);
 }
 assert.equal(g.gyuwon.years.musical.finishing,true);
 assert.equal(media.length,6);assert.ok(media.every(a=>!a.url.includes('Army')&&!a.url.includes('Shooting')));
 score.dispose();
});

test('the outgoing curtain holds through settling and opens again for dedication on the same model',()=>{
 const m={year:9,time:179,clock:{duration:180}};
 assert.ok(gyuwonCurtainBridge(m).cover>0);m.songEnded=true;assert.equal(gyuwonCurtainBridge(m).cover,1);
 Object.assign(m,{year:11,fromYear:9,time:0,songEnded:false});assert.equal(gyuwonCurtainBridge(m).cover,1);
 m.time=2.5;assert.equal(gyuwonCurtainBridge(m).cover,0);
 Object.assign(m,{finishing:true,songEnded:true,time:0});assert.equal(gyuwonCurtainBridge(m).cover,1);
 m.time=8;assert.equal(gyuwonCurtainBridge(m).cover,0,'the previous songEnded flag cannot cover the entire final song');
});

test('ensemble steps follow the retained finale tempo while staying camera-facing',()=>{
 const period=16/(GYUWON_SONGS[11].bpm/60),a=curtainDanceAt(1),b=curtainDanceAt(1+period);
 for(const key of ['step','arm','kick'])assert.ok(Math.abs(a[key]-b[key])<1e-10);
 for(let t=0;t<180;t+=.13){const p=curtainDanceAt(t);assert.ok(Math.abs(p.turn)<.09);assert.ok(Number.isFinite(p.arm));}
});

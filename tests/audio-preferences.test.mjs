import test from 'node:test';
import assert from 'node:assert/strict';
import {AUDIO_CHANNELS,readAudioVolume,writeAudioVolume,audioChannelGain,clampVolume} from '../src/audio-preferences.mjs';

test('five independent audio channels default to unity gain and preserve master multiplier',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 assert.deepEqual(AUDIO_CHANNELS,['master','music','effects','ambient','ui']);
 for(const channel of AUDIO_CHANNELS)assert.equal(readAudioVolume(channel,storage),1);
 assert.equal(writeAudioVolume('music',.35,storage),true);
 assert.equal(writeAudioVolume('effects',.7,storage),true);
 assert.equal(writeAudioVolume('master',.5,storage),true);
 assert.equal(audioChannelGain('music',storage),.175);
 assert.equal(audioChannelGain('effects',storage),.35);
 assert.equal(audioChannelGain('ambient',storage),.5);
 assert.equal(audioChannelGain('master',storage),.5);
 assert.equal(writeAudioVolume('unknown',.2,storage),false);
});
test('audio volumes clamp and tolerate unavailable browser storage',()=>{
 const storage={getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')}};
 assert.equal(readAudioVolume('effects',storage),1);
 assert.equal(writeAudioVolume('effects',.5,storage),false);
 assert.equal(clampVolume(-4),0);assert.equal(clampVolume(4),1);
 assert.equal(clampVolume('invalid'),1);
});

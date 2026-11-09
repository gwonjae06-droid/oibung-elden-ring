// Durations are error fallbacks, never deadlines for successfully playing media.
export const GYUWON_SONGS=Object.freeze({
 5:{source:'Welcome to My World!.mp3',file:'gyuwon5.mp3',duration:48,bpm:136,target:5300},
 6:{source:'Run Into Tomorrow!.mp3',file:'gyuwon6.mp3',duration:44,bpm:164,target:4600},
 7:{source:'My Little Army!.mp3',file:'gyuwon7.mp3',duration:48,bpm:128,target:3900},
 8:{source:'Dance Until the Morning!.mp3',file:'gyuwon8.mp3',duration:48,bpm:120,target:3200},
 9:{source:'Give Me One More Round!.mp3',file:'gyuwon9.mp3',duration:44,bpm:154,target:2500},
 10:{source:'A Million Shooting Stars!.mp3',file:'gyuwon10.mp3',duration:48,bpm:158,target:1800},
 11:{source:'The Greatest Show of My Life.mp3',file:'gyuwon11.mp3',duration:70,bpm:142,target:800},
 ending:{source:'When the Music Ends.mp3',file:'gyuwonending.mp3',duration:45,bpm:68,target:0}
});
export const gyuwonSongKey=m=>m?.finishing?'ending':m?.year;

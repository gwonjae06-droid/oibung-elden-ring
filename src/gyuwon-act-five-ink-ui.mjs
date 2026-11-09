// Only paint the existing controls. Their DOM, handlers, focus and hit areas
// stay intact; none of the irregular ink borders intercept pointer events.
export const ACT_FIVE_INK_UI=`
[data-ink-ui="on"] :is(#player-hud,#boss-hud,.gy-dday-clock,.gy-dday-subject){border:2px solid #34303d;border-radius:8px 15px 6px 13px;background:#efe0bce8;color:#272b39;box-shadow:3px 3px #141b2a88;text-shadow:none}
[data-ink-ui="on"] .gy-musical-layer,[data-ink-ui="on"] #pause-screen{font-family:"Segoe Print","Comic Sans MS","Malgun Gothic",sans-serif;color:#f9eed5}
[data-ink-ui="on"] :is(.gy-musical-title,.gy-musical-info,.gy-turn-points,.gy-party-card,.gy-turn-target,.gy-turn-queue>div,.gy-musical-actions button,#pause,.gy-musical-audio-retry){border:2px solid #211e2e;border-radius:9px 16px 7px 13px / 12px 7px 14px 8px;box-shadow:3px 3px 0 #090e18c9;background:#f7e6bd;color:#242032;text-shadow:none}
[data-ink-ui="on"] :is(.gy-party-card,.gy-turn-target,.gy-musical-actions button,.gy-musical-title,.gy-turn-points)::after{content:"";position:absolute;inset:2px 3px;pointer-events:none;border:1px solid currentColor;border-radius:13px 7px 15px 8px / 7px 14px 8px 11px;opacity:.35;transform:rotate(-.6deg)}
[data-ink-ui="on"] .gy-musical-title{position:relative;background:#f3be6b;font-weight:900}
[data-ink-ui="on"] .gy-musical-info{background:#e6f0e0;font-weight:800}
[data-ink-ui="on"] .gy-party-card{background:linear-gradient(105deg,#f6e9ce 70%,var(--party));border-color:#292838;font-size:12px;color:#191b28}
[data-ink-ui="on"] .gy-party-card:nth-child(even){border-radius:15px 6px 12px 8px / 8px 14px 7px 11px}
[data-ink-ui="on"] .gy-party-card .portrait{color:#35435a;text-shadow:1px 1px var(--party)}
[data-ink-ui="on"] .gy-party-card small{color:#3c4350;font-weight:700}
[data-ink-ui="on"] .gy-party-card .energy{background:#22364b;color:#fff3d6;border-style:dashed;box-shadow:1px 2px #171d28}
[data-ink-ui="on"] .gy-party-card.ready .energy{background:#f5b856;color:#201b29;border-color:#302434;box-shadow:0 0 0 2px #f9e5a6}
[data-ink-ui="on"] .gy-party-card.active{outline:3px solid #f8c65e;outline-offset:2px;box-shadow:4px 4px #0c1222}
[data-ink-ui="on"] :is(.gy-party-card .hp,.gy-turn-target .hp,.gy-turn-target .tough){border:1px solid #302b37;border-radius:2px 5px 3px 4px;background:#26313c;overflow:hidden}
[data-ink-ui="on"] .gy-party-card .hp i{background:repeating-linear-gradient(100deg,#17847b 0 6px,#61beb0 7px 10px)}
[data-ink-ui="on"] .gy-turn-target{background:#253750ee;border-color:#c2d8e3;color:#fff4d3;min-height:44px}
[data-ink-ui="on"] .gy-turn-target.selected{background:#f4c56d;color:#282135;border:2px solid #211b2b;outline:2px solid #ffe7a2;outline-offset:2px}
[data-ink-ui="on"] .gy-turn-target .weak{color:#81d0e5}
[data-ink-ui="on"] .gy-turn-target.selected .weak{color:#304d6b}
[data-ink-ui="on"] .gy-turn-target .hp i{background:repeating-linear-gradient(100deg,#d87262 0 7px,#efb591 8px 11px)}
[data-ink-ui="on"] .gy-turn-target .tough i{background:#a1d5e0}
[data-ink-ui="on"] .gy-turn-queue>div{background:#e4e8de;color:#252836;box-shadow:2px 2px #131923}
[data-ink-ui="on"] .gy-turn-queue .enemy{background:#e9a18e;color:#402735}
[data-ink-ui="on"] .gy-turn-queue .current{background:#f5cf76;border:3px solid #242335;outline:2px solid #f3e0a0}
[data-ink-ui="on"] .gy-turn-points{background:#284c5b;color:#f7df9b;border-color:#efd7a5;letter-spacing:.21em}
[data-ink-ui="on"] .gy-musical-actions button{background:#f6d5a2;color:#252337;border-color:#292133;font-weight:900;font-family:inherit}
[data-ink-ui="on"] .gy-musical-actions button:nth-child(2){background:#bcd8d7}
[data-ink-ui="on"] .gy-musical-actions button:nth-child(3){background:#d8c2e0}
[data-ink-ui="on"] .gy-musical-actions kbd{color:#324254;font-weight:800}
[data-ink-ui="on"] button:disabled{filter:saturate(.65);opacity:.72;box-shadow:1px 1px #171c2a}
[data-ink-ui="on"] button:focus-visible{outline:3px dashed #fff5b9;outline-offset:4px}
[data-ink-ui="on"] .gy-theater-progress{background:#1b2c40e8;border:2px solid #edc688;border-radius:4px 12px 7px 9px;padding:7px 12px;filter:none;box-shadow:3px 3px #080d18aa}
[data-ink-ui="on"] .gy-theater-heading{color:#f9d49d;font-family:inherit;letter-spacing:.09em}
[data-ink-ui="on"] .gy-theater-meter{border:1px solid #efddb7;border-radius:3px 8px 4px 6px;background:#151d2d}
[data-ink-ui="on"] .gy-theater-fill{background:repeating-linear-gradient(102deg,#e19b55 0 7px,#f2cc8e 8px 11px)}
[data-ink-ui="on"] .gy-theater-song{color:#f1e9d0;font-family:inherit}
[data-ink-ui="on"] .gy-musical-dialogue{background:#fff0d4ed;border:2px solid #2a2434;border-radius:5px 13px 8px 11px;padding:5px 14px;width:max-content;max-width:min(65vw,800px);bottom:31%;filter:none;text-shadow:none;box-shadow:3px 3px #0e1525a8}
[data-ink-ui="on"] .gy-lyric-en{color:#3a3b4c;font-family:inherit;font-weight:700}
[data-ink-ui="on"] .gy-lyric-ko{color:#201e30;font-family:inherit;font-weight:800}
[data-ink-ui="on"] #pause{font-family:inherit;background:#f5dcad;min-height:44px}
[data-ink-ui="on"] #pause-screen .small-panel{border:3px solid #e2b779;background:#182b3ff5;box-shadow:5px 5px #0d1422;border-radius:12px 6px 17px 8px;color:#fff0d6}
[data-ink-ui="on"] #pause-screen button{border:2px solid #312b3b;border-radius:7px 14px 9px 6px;background:#f2dfb9;color:#252435;box-shadow:2px 2px #070e1b;font-family:inherit}
@media(max-height:500px){
 [data-ink-ui="on"] .gy-theater-progress{padding:3px 8px;left:43%;width:45%;max-width:none;box-sizing:border-box}
 [data-ink-ui="on"] .gy-musical-top{left:77%;top:3%;max-width:25%;gap:3px}
 [data-ink-ui="on"] .gy-musical-title{font-size:10px;padding:4px 9px}
 [data-ink-ui="on"] .gy-musical-info{font-size:9px;padding:3px 6px}
 [data-ink-ui="on"] .gy-party-card{font-size:9px;min-width:0;height:60px}
 [data-ink-ui="on"] .gy-musical-dialogue{bottom:31%;padding:3px 8px;max-width:67vw}
 [data-ink-ui="on"] .gy-lyric-en{font-size:10px;line-height:1.3}
 [data-ink-ui="on"] .gy-lyric-ko{font-size:12px;line-height:1.35}
 [data-ink-ui="on"] .gy-turn-target{width:82px;font-size:9px;padding:3px 5px;min-height:44px}
 [data-ink-ui="on"] #pause{top:5px;right:6px;font-size:10px;padding:5px 8px}
}
[data-reference-turn="on"] .gy-musical-dialogue{top:14%;bottom:auto;max-width:min(62vw,760px);padding:3px 10px}
@media(max-height:500px){[data-reference-turn="on"] .gy-musical-dialogue{top:16%;bottom:auto;max-width:58vw;padding:2px 7px}}
`;

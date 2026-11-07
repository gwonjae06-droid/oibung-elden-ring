# 오슬우 악몽의 서커스 — 기존 녹음 효과음 연결 상태

2026-11-07 기준 GitHub `assets/sfx/` 디렉터리에는 다음 공포 효과음이 실제 업로드되어 있습니다. 이 파일들은 임시 이름만 예약한 것이 아니라 현재 전투에서 재생하도록 연결되어 있습니다.

| 녹음 파일 | 공연 활용 |
| --- | --- |
| `childfunny.mp3` | 가짜 단장과 관객의 불길한 웃음 |
| `reversedclap.mp3` | 북 행진·뒤집힌 박수 |
| `maskcrack.mp3` | 분신·가면 파열 |
| `bodycreak.mp3` | 인형사·곡예사의 관절/현 삐걱임 |
| `clothbreath.mp3` | 장막 개폐와 뒤틀린 커튼콜 |
| `audiencewhisper.mp3` | 객석의 속삭임 |
| `voidsmile.mp3` | 가면/입 관련 오래된 공포 패턴 |
| `facesplit.mp3` | 가면 벗기기 |
| `circuswarp.mp3` | 함정문·무대 왜곡 |
| `nightmaretransition.mp3` | 3막 진입 및 악몽의 진혼곡 |
| `womanvoice.mp3` | 촛불 합창단·서커스 진혼곡 |
| `bell.mp3` | 무대 종소리·곡예 공연 시작 |
| `dragon-studio-sharpening-blade-393850.mp3` | 칼 저글링 |
| `dragon-studio-hard-heavy-impact-515256.mp3` | 인간 대포 |
| `yodguard-fire-magic-5-378639.mp3` | 화염 고리 |

재생 연결: `src/clown-ensemble-recordings.mjs`, `src/clown-nightmare-sfx.mjs`, `src/clown-stage-recordings.mjs`, `src/boss-foley-map.mjs` 및 `src/clown-battle.mjs`. 효과음은 사용자가 음소거하면 중단되고, 동시 재생 수·반복 간격·음량이 제한됩니다. 8비트 신시사이저를 대체음으로 재생하지 않습니다.

공격 설명 텍스트나 임의 위험 히트박스를 생성하지 않습니다. 각 공연의 피해 판정은 반드시 원래 전투 엔진의 지연 경고를 거칩니다.

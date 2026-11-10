# 참가자 실력·성장 분석

2026-11-11부터 새 클라이언트로 플레이한 **이벤트 등록 참가자의 이벤트 전투**를 수집한다. 일반 플레이와 미등록 방문자는 개인 식별·추적하지 않는다. 기존 기록으로 과거 피격이나 도전 횟수를 복원하지 않는다. 재접속 시 같은 참가 토큰이면 같은 사람으로 연결된다. 다른 기기/등록은 자동 합치지 않는다.

## 저장과 신뢰 범위

`oden_skill_attempts`: 도전별 UUID, 서버 최초 수신/최종 수신 시각, 누적 revision, 보스·무기·강화·입력 방식·게임 빌드, 결과, 전투/뮤지컬 시간, 피해·피격·회복·일반공격 적중, 최고 도달 단계, 패턴별 피격 집계. 입력 방식은 touch 또는 keyboard-mouse 범주이며 하드웨어/브라우저 지문이 아니다. 게임 이벤트 이외의 키 입력·화면 좌표·채팅·개인정보는 보내지 않는다.

시작, 30초 주기, 탭 숨김, 패배/승리/메뉴 종료에서 누적 스냅샷을 보낸다. 중복/순서 역전은 revision과 복합 기본키로 방어한다. 최종 결과는 수정되지 않는다. 실패한 전송은 참가자별 localStorage에 최근 50개 도전까지 보관하고 15초 이후/재접속/온라인 복귀 시 재시도한다. 강제 종료·저장소 삭제·오프라인에서는 기록이 누락될 수 있다. 2분 이상 갱신이 없는 playing은 disconnected로 표시하며 패배로 간주하지 않는다. 최초 수신 시각은 서버 시각이라 장기 오프라인 기록은 실제 시작보다 늦게 정렬될 수 있다.

서버 함수는 기존 참가 토큰을 검증한 뒤에만 저장한다. 참가자 ID/event ID는 서버가 결정한다. 브라우저 역할의 테이블·뷰 접근은 모두 차단되며 관리자 SQL/연결 도구로 조회한다. 참가자 통계는 클라이언트 신고값이므로 조작 불가능한 증거가 아니다. 상품 승인·AI 판정·자동 차단에 사용하지 않는다.

## 지표 해석

- 일반공격 적중률: 실제 발사/휘두름이 발생한 기본 공격 중 유효타가 1회 이상 확인된 공격의 비율. 한 번 발사한 3장 카드가 세 번 맞아도 성공 1회. 취소된 준비 동작/스킬/도트 피해/뮤지컬 점수는 적중률 분모에 넣지 않는다. 페이즈 무적에 막힌 공격은 유효타가 아니다.
- confirmed_hits는 기존 게임의 적중 집계이므로 다중 투사체·특수 기믹 타격을 포함할 수 있다. 적중률 분자로 직접 사용하지 않는다.
- 피해량은 게임의 실제 누적 피해 통계이며 최규원의 음악 종료에 따른 자동 HP 정산은 DPS로 취급하지 않는다. 최규원은 combat_dps를 NULL로 반환한다.
- 시간은 일시정지 동안 멈추는 시뮬레이션 시간을 기준으로 하며 페이즈 전환 시간은 제외한다. 뮤지컬 구간은 performance_seconds/단계별 score로 구분한다. 프레임 간 긴 관측 공백은 과대 계산하지 않는다.
- 최고 도달 수는 내부 녹음 ID 대신 화면상의 단계로 변환한다. 내부 8/9/11 녹음은 각각 화면의 7/8/9수다. 마지막 엔딩은 별도 year-ending 구간이다.
- 피격 사유는 판정 코드의 source 또는 현재 시전 패턴에서 가져온다. 알 수 없는 경우 unknown으로 남긴다. 시각적으로 추정한 패턴명을 기록하지 않는다.
- 성장 비교는 동일 보스/무기/강화/입력 방식/룰/빌드 내 최근 5회와 이전 5회의 완료 도전(10초 이상)을 비교한다. 10회 미만이면 enough_for_comparison=false. 중도 이탈은 승률 분모에서 제외한다.
- 성장 수치는 참고 자료이며, 도달 단계·패턴 노출 시간이 다르므로 피격/분 감소 하나만으로 실력이 높아졌다고 단정하지 않는다. 현재 기록 수가 적으면 전체 실력 순위를 만들지 않는다.

## 관리자 조회

SQL Editor 또는 연결된 관리자 도구로 다음 뷰를 조회한다. 공개 웹페이지에 서비스 키를 넣지 않는다.

```sql
-- 현재 참가자별 도전/승률/도달 구간/피격/적중률
select * from public.oden_skill_player_boss
where event_id='oden-ending-2026-live-1110'
order by nickname,boss;

-- 최근 성장(닉네임은 participant_id로 참가자 테이블과 조인)
select p.nickname,g.* from public.oden_skill_growth g
join public.oden_event_participants p on p.id=g.participant_id
where g.event_id='oden-ending-2026-live-1110';

-- 전체가 막히는 보스와 자주 사망하는 패턴
select * from public.oden_skill_boss_bottlenecks
where event_id='oden-ending-2026-live-1110';
select * from public.oden_skill_pattern_failures
where event_id='oden-ending-2026-live-1110' order by deaths desc;

-- 최규원 단계별 피격/음악 점수(일반 보스 페이즈도 포함)
select * from public.oden_skill_phase_stats
where event_id='oden-ending-2026-live-1110';
```

스키마 재현 소스: `supabase/sql/skill-analytics.sql` (운영에는 create_oden_skill_analytics_v1 마이그레이션으로 적용). API: 기존 oden-event 함수의 인증된 `action: attempt`. 등록·진행·상품 인증 동작과 독립된 큐를 사용한다.

# GitHub Actions 운영 가이드

## 자동 실행
- `Fast core checks`: `main` 푸시와 PR 중 게임 소스, 테스트, 스크립트, HTML, package.json, 워크플로가 변경될 때만 실행됩니다.
- 중복된 `Fast core checks` 작업은 동일 ref의 새 작업이 시작되면 기존 실행을 취소합니다.
- 브라우저/WebGL 스크린샷, 보스별 전문 회귀 검사, 전체 `npm test`는 **매 커밋 자동 실행하지 않습니다**.
- GitHub에서 관리하는 **pages build and deployment**는 GitHub Pages 설정에 따라 별도로 실행됩니다. 이 저장소의 워크플로 YAML 변경만으로 Pages의 자동 실행을 중단하거나 취소 정책을 설정할 수는 없습니다.

## 전문 회귀 검사 수동 실행
GitHub 저장소 → **Actions** → 원하는 전문 워크플로 선택 → **Run workflow** → 브랜치 선택 → 실행.
원래 테스트 명령, 스크린샷 저장 로직 및 파일은 그대로 보존했습니다. 병합 전에 시각적 품질을 검토하거나 특정 보스를 수정한 경우 관련 워크플로를 한 번 실행하세요.

예: `Node regression tests`(전체 테스트/브라우저 스모크), `Actual arena startup WebGL gate`, `Kwon range pressure and fair sword patterns`, `Three boss phase environment regression`, `Clown nightmare horror redesign regressions`.

`Apply boss rules (one shot)`은 본래의 경로 조건이 붙은 별도 자동 변경 작업이므로 이번 재설정에서 변경하지 않았습니다.

## Pages 배포 실패 시
- API 오류 `API rate limit exceeded for installation`은 테스트 성공 여부와 무관하게 GitHub 측 설치 앱 API 호출 한도에 걸린 것입니다.
- API 한도가 회복된 뒤, **가장 최신** `pages build and deployment` 실행만 `Re-run failed jobs`로 재시도합니다. 과거 취소/실패된 실행을 일괄 재실행하지 않습니다.
- 자주 커밋하면 GitHub Pages 배포가 연속 취소되거나 대기할 수 있으므로 변경 사항을 묶어서 `main`에 병합하세요.
- `Fast core checks` 성공은 실제 Pages 게시 성공을 뜻하지 않습니다. Pages 작업이 별도로 `Success`인지 확인하세요.

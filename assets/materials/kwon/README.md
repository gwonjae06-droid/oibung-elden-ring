# 이권재 전장 실사 석재

Poly Haven의 CC0 자료를 원본 1K JPEG 그대로 포함합니다. 각 파일 출처와 MD5 검증값은 sources.json에 있습니다. 런타임에서는 외부 재질 서버에 접속하지 않습니다.

- 바닥: https://polyhaven.com/a/cobblestone_floor_03
- 신전 석조: https://polyhaven.com/a/castle_brick_broken_06
- 라이선스: https://polyhaven.com/license
- 6장 합계 약 2.7MB. 색상 / OpenGL 노멀 / 거칠기 맵을 각각 사용합니다.

kwon-visuals.mjs가 이권재 장면에만 재질, 달빛, 보조광, 반사 환경, 갑각 요철, 미세 먼지를 적용합니다. 기존 얼굴·턱·동작·피격 판정은 유지합니다. 새로 제작한 리깅 GLB 모델을 적용한 단계는 아닙니다.

PC 기본 그림자 2048, 저사양 또는 터치 환경 1024, 먼지 입자 100/32개로 구분합니다. 모션 감소에서는 먼지가 정지합니다. 재질 로딩이 늦게 끝나도 종료된 장면에 쓰지 않으며 이미지 요청과 GPU 자원을 장면과 함께 정리합니다.

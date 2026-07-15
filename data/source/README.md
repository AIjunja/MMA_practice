# 원본 데이터 출처

## 경기도 시군구 행정경계

- 파일: `gyeonggi-sigungu-2020.svg`
- 원본: [statgarten/maps](https://github.com/statgarten/maps)
- 기초 데이터: 통계청 SGIS 오픈 API의 2020년 행정구역 경계
- 저장소 라이선스: MIT
- 처리: 여러 일반구로 나뉜 시는 하나의 선택 영역으로 묶고, 화면 표시용 SVG 경로와 라벨 좌표만 `src/data/gyeonggi-map.json`으로 추출

`npm run prepare:map`을 실행하면 화면용 지도 데이터를 다시 생성할 수 있습니다.

## 시설 사진

시설 사진의 원본 주소, 저작자, 라이선스와 시설명 매핑은 `src/data/facility-photos.json`에 기록합니다. 사진은 Wikimedia Commons의 1,280px 미리보기 URL을 사용하며, 앱 상세 화면에서 원본과 라이선스로 이동할 수 있습니다.

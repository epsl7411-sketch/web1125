---
version: alpha
name: "레스토랑 랜딩페이지 레퍼런스"
description: "첨부 이미지에서 추출한 색상, 사진 구도, 섹션 구성과 화면 구현 지침"
colors:
  primary: "#2C2F34"
  surface: "#FFFFFF"
  surface-warm: "#F9F6EF"
  surface-soft: "#F9F9F9"
  ink: "#262421"
  muted: "#605A53"
  border: "#8B8379"
  food-accent: "#A13022"
typography:
  display:
    fontFamily: "Noto Sans KR"
    fontSize: 44px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.025em
  heading:
    fontFamily: "Noto Sans KR"
    fontSize: 26px
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Noto Sans KR"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Noto Sans KR"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
spacing:
  small: 8px
  field-gap: 16px
  column-gap: 24px
  section: 72px
  content-max: 1120px
  mobile-gutter: 20px
rounded:
  control: 2px
  plate: 9999px
motion:
  slide-change:
    duration: 180ms
    timingFunction: ease-out
components:
  outlined-button:
    textColor: "{colors.ink}"
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.control}"
    typography: "{typography.label}"
  hero:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.display}"
---

# 레스토랑 랜딩페이지 디자인

## Overview

어두운 식탁 위 음식 사진과 흰색·아이보리 배경을 번갈아 배치한다. 넓은 사진에서는 음식과 식기가 먼저 보이고, 밝은 영역에서는 메뉴명과 안내를 빠르게 읽을 수 있다. 검은 원형 접시가 메인 배너, 메뉴 썸네일, 식재료 소개를 시각적으로 연결한다.

이 문서의 관찰 근거는 첨부된 293 × 708px 캡처다. 흰색·아이보리·밝은 회색은 캡처의 배경에서 샘플링했고, 차콜은 검은 접시의 그림자 영역에서 대표색을 골랐다. 나머지 토큰, 글꼴, 간격, 화면 크기별 규칙은 구현용 제안이다. 작은 원문 카피와 실제 상호·폰트는 이미지에서 정확히 식별하기 어렵다. 하단의 **사이트 방문** 버튼과 확대 아이콘은 캡처 뷰어의 조작 요소로 보인다. [DESIGN.md 공개 형식 명세](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md)

## Colors

| 용도 | 토큰 | 적용 |
|---|---|---|
| 사진과 맞닿는 어두운 면 | `primary` | 메인 배너의 배경, 식재료 소개의 사진 쪽 면 |
| 기본 배경 | `surface` | 헤더, 메뉴 목록, 문의 양식 |
| 따뜻한 보조 배경 | `surface-warm` | 식재료 설명 면과 일부 섹션의 비정형 배경 |
| 옅은 보조 배경 | `surface-soft` | 밝은 영역 사이의 완만한 면 전환 |
| 글자와 경계 | `ink`, `muted`, `border` | 제목, 설명, 입력 필드와 버튼 테두리 |
| 음식의 따뜻한 색 | `food-accent` | 소스, 고추, 조리 재료에서 보이는 붉은색의 대표값 |

사진 위 글자는 흰색으로 두고, 밝은 피사체가 문구 아래 들어오면 해당 영역의 사진을 어둡게 처리한다. 밝은 배경에는 어두운 글자를 쓴다.

## Typography

캡처에는 짧은 배너 제목, 중앙 정렬된 섹션 제목, 작은 메뉴 설명이 보인다. 한글 산세리프 한 계열에서 굵기와 크기로 위계를 만든다. 구현 시 메인 배너 제목은 데스크톱 44px, 모바일 30~32px를 시작값으로 사용한다. 카드의 설명과 예약 안내는 줄 길이를 제한하고, 입력 필드의 라벨을 값이나 자리표시자와 구분한다.

## Layout

| 화면 순서 | 캡처에서 보이는 구성 |
|---|---|
| 헤더 | 얇은 흰색 바에 왼쪽 로고, 오른쪽 탐색 메뉴 |
| 메인 배너 | 화면 폭을 채우는 어두운 음식 사진, 왼쪽 문구, 중앙에서 오른쪽에 걸친 접시, 양쪽 슬라이드 화살표 |
| 대표 메뉴 | 중앙 제목 아래 원형 음식 사진 4개를 한 줄에 배치. 메뉴명과 짧은 설명은 각 사진 아래, 추가 탐색 버튼은 줄 아래 중앙 |
| 식재료·조리 소개 | 아이보리색 설명 패널과 차콜색 사진 패널을 좌우로 분할. 짧은 본문과 선형 아이콘을 왼쪽에 두고 접시를 두 면의 경계에 겹침 |
| 매장 안내 | 매장 내부 사진과 어두운 안내 사진을 두 열로 배치. 문구는 각 사진 위에 겹쳐 표시 |
| 예약·문의 | 좁은 예약 영역, 넓은 음식 사진 배너, 하단 문의 양식 순서 |

구현에서는 배너를 전체 폭으로 펼치고 메뉴·소개·양식을 최대 1,120px의 중앙 영역에 넣는다. 데스크톱에서 대표 메뉴는 4열, 매장 안내는 2열로 시작한다. 모바일에서는 메뉴를 2열로 줄이고 소개·매장 안내·양식을 한 열로 쌓는다. 메인 이미지가 좁아질 때는 문구와 음식이 겹치지 않도록 자르는 위치를 조정한다.

## Elevation & Depth

깊이감은 접시와 식기가 드리우는 실제 그림자, 어두운 사진과 밝은 배경의 대비, 사진이 패널 경계에 겹치는 구성에서 생긴다. 메뉴 카드와 양식은 평평한 면과 가는 구분선으로 정리한다. 아이보리색 곡선 면은 섹션의 가장자리에 넓게 깔아 문구와 조작 요소에 여백을 남긴다.

## Shapes

접시와 메뉴 썸네일은 원형으로 반복한다. 패널과 매장 사진, 버튼, 입력 필드는 모서리가 거의 직각인 직사각형을 사용한다. 식재료 소개에는 얇고 단순한 선형 아이콘을 쓴다.

## Motion & Micro-interaction

배너의 좌우 화살표는 캡처에서 확인되며, 자동 재생 여부와 전환 효과는 확인할 수 없다. 구현 시 사용자가 직접 장면을 전환할 수 있도록 키보드로 조작 가능한 이전·다음 버튼을 제공한다. 전환을 넣을 경우에는 180ms를 시작값으로 사용하고, 모션 줄이기 설정에서는 즉시 전환한다.

## Voice & Content Strategy

한 화면에서 사진이 한 가지 이야기를 전달하도록 제목과 설명을 짧게 유지한다. 메뉴 카드에는 이름과 핵심 설명을 우선하고, 버튼에는 **메뉴 보기**, **예약하기**, **문의 보내기**처럼 다음 행동을 적는다.

## Components

| 컴포넌트 | 구현 지침 |
|---|---|
| 메인 배너 | 위에서 내려다본 음식 사진을 사용한다. 왼쪽에는 문구가 읽힐 만큼 여백과 명암을 확보하고, 접시와 식기는 중앙에서 오른쪽에 둔다. |
| 메뉴 카드 | 정사각형 사진을 원형으로 잘라 같은 크기로 배치한다. 카드마다 빛의 방향과 접시 크기를 맞추고, 이름과 설명은 사진 아래에서 왼쪽 정렬한다. |
| 식재료 소개 패널 | 밝은 면의 설명과 어두운 면의 사진에 각각 충분한 폭을 준다. 접시가 경계에 걸쳐도 본문과 아이콘을 가리지 않게 한다. |
| 테두리 버튼 | 얇은 테두리, 짧은 라벨, 거의 직각인 모서리를 사용한다. 시각적으로 간결한 크기를 유지하면서 모바일 조작 영역은 충분히 확보한다. |
| 예약·문의 양식 | 연한 배경 위에 어두운 라벨과 얇은 경계의 필드를 배치한다. 키보드 포커스와 입력 오류를 글자와 경계로 구분한다. |

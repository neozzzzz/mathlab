# UI/UX 통일 명세 — 3개 설정 페이지

## 1. 통일 기준

**Golden Standard: `/calc` (일반 연산 2수 페이지)**
- 가장 정돈된 구조, 카드 안 서브카드 그룹핑, slate 컬러 시스템

## 2. 공통 레이아웃 구조

```
<PageWrapper>           min-h-[100dvh] bg-slate-100/80 px-4 py-8
  <BackButton>          router.back() + fallback "/"
  <PageTitle>           text-2xl font-black text-slate-900 text-center mb-6
  <MainCard>            max-w-[600px] mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)] p-6 md:p-7
    <SectionLabel>      block font-bold text-sm mb-2
    <SectionCard>       rounded-xl border border-slate-200/80 bg-white p-3 mb-5
      <SubLabel>        text-xs text-slate-500 font-bold mb-2
      ...inputs
    <PreviewCard>       p-4 bg-slate-50 rounded-xl border border-slate-200/70
    <GenerateButton>    w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold
  <Toast>               fixed top-6 center bg-slate-900 text-white rounded-xl font-semibold
```

## 3. 공통 컴포넌트 (추출 대상)

| 컴포넌트 | 용도 |
|----------|------|
| `PageWrapper` | 페이지 전체 래퍼 (배경, 패딩) |
| `BackButton` | ← 메인으로 (router.back + fallback) |
| `MainCard` | 설정 영역 카드 |
| `SectionCard` | 그룹핑 서브카드 |
| `TypeButton` | 연산 유형 선택 버튼 |
| `RangeInput` | 숫자 범위 입력 (min ~ max) |
| `PreviewCard` | 미리보기 영역 |
| `GenerateButton` | 문제 생성 버튼 |
| `Toast` | 토스트 알림 |

## 4. 페이지별 변경사항

### `/match` (짝맞추기)
- 컨테이너: `max-w-[600px] p-8` → PageWrapper 적용
- 카드: `rounded-2xl p-7 shadow-md` → MainCard
- 컬러: gray → slate 전체 교체
- 뒤로가기: Link → BackButton 컴포넌트
- 연산 유형 버튼: `bg-[#ddd]/50` → `bg-slate-900/5`
- 입력 필드: `border-gray-200 focus:border-gray-900` → `border-slate-200 focus:border-slate-400`
- 토스트: `bg-gray-900 font-bold` → `bg-slate-900 font-semibold`
- 생성 버튼: `bg-gray-900 font-black` → `bg-slate-900 font-bold`
- 섹션 구조: flat → SectionCard로 그룹핑 (연산유형, 레이아웃/문제수, 수범위, 미리보기)

### `/calc3` (일반연산 3수)
- match와 동일한 변경 적용
- 연산 유형: 2개 그룹(더하기/빼기, 곱하기/나누기) → calc와 동일한 2열 카드 구조
- 숫자 범위: 3열 구조 유지하되 SectionCard로 감싸기
- 문제수/장수: SectionCard 내 grid 구조로

## 5. 컬러/스타일 토큰

| 토큰 | 값 |
|------|------|
| bg-page | `bg-slate-100/80` |
| bg-card | `bg-white` |
| border-card | `border-slate-200/80` |
| shadow-card | `shadow-[0_8px_40px_rgba(15,23,42,0.06)]` |
| radius-card | `rounded-3xl` |
| radius-section | `rounded-xl` |
| text-title | `text-slate-900` |
| text-label | `text-sm font-bold` |
| text-sublabel | `text-xs text-slate-500 font-bold` |
| btn-primary-bg | `bg-slate-900 hover:bg-slate-800` |
| btn-type-active | `border-slate-900 bg-slate-900/5 text-slate-900` |
| btn-type-inactive | `border-slate-200 bg-white hover:border-slate-400` |
| input-border | `border-slate-200` |
| input-focus | `focus:border-slate-400` |
| toast-bg | `bg-slate-900` |

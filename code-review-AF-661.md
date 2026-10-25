# 코드리뷰 — 세로셈(vertical) 신규 페이지 [AF-661]

## 검토 대상
현재 `dev` 브랜치의 미추적(untracked) 신규 파일. 모두 이번 리뷰 실행 이전부터 존재.

- `src/app/vertical/page.tsx` (설정 페이지)
- `src/app/vertical/preview/page.tsx` (미리보기·인쇄·공유)
- `src/app/vertical-grid-demo/page.tsx` (3x3 그리드 데모)
- `tests/*.js` 8개 (소스 문자열 매칭 테스트)
- `logs/` (런타임 서버 로그)

## 검증
- `npm test` — 통과 (24/24)
- `npx tsc --noEmit` — vertical 파일 관련 오류 없음. `.next/types/validator.ts`의 `handtrack/page.js` 참조 오류 1건은 stale 생성물이며 이번 변경과 무관.

---

## 지적 사항

### 1. (버그·높음) "결과값 범위" 설정이 문제 생성에 전혀 반영되지 않음
`src/app/vertical/page.tsx:87`, `src/lib/math-generator.ts:173-214`, `:434`

설정 페이지는 사용자의 결과값 범위를 `answerAddMin`/`answerAddMax`로 담아 `encodeCalcParams`에 넘긴다(`vertical/page.tsx:100-101`). 그런데 두 곳에서 값이 유실된다.

- `encodeCalcParams`(`math-generator.ts:185-214`)는 `mixed_addition`을 위한 분기가 없다. `add_sub`/`mul`/`mul_div` 분기에 걸리지 않고, 마지막 `else if (params.answerMin !== undefined && params.answerMax !== undefined)`(`:211`)만 남는데 vertical 페이지는 `answerMin`/`answerMax`를 설정하지 않는다. 결과적으로 `answerAddMin`/`answerAddMax`는 URL에 인코딩되지 않고 조용히 버려진다.
- 설령 인코딩되어(`amnA`/`amxA`) 파싱까지 도달해도, `generateCalcSheet`의 `mixed_addition` 분기(`:434`)는 `answerMin`/`answerMax`로만 답 범위를 거른다. `answerAddMin`/`answerAddMax`는 참조하지 않는다.

재현: 결과값 범위를 20~50으로 지정해도 `a`,`b`가 각각 10~99이므로 합이 최대 198인 문제가 그대로 생성된다. 즉 이 컨트롤은 동작하지 않는다. 반면 `generate()`(`vertical/page.tsx:87-90`)는 이 범위를 검증까지 하므로, 사용자에겐 적용되는 것처럼 보이지만 실제로는 무시된다.

수정 방향(둘 다 필요):
- `encodeCalcParams`에 `mixed_addition` 분기를 추가해 `answerAddMin`/`answerAddMax`를 인코딩(예: `amnA`/`amxA`)하거나, vertical 페이지가 `answerMin`/`answerMax`로 넘기도록 통일.
- `generateCalcSheet`의 `mixed_addition` 필터가 실제로 넘어오는 필드(`answerAddMin`/`answerAddMax` 또는 `answerMin`/`answerMax`)를 거르도록 일치.

### 2. (설계·중간) 데모 페이지가 공개 라우트로 노출
`src/app/vertical-grid-demo/page.tsx`

`vertical-grid-demo`는 셀 배치 확인용 스크래치 페이지로 보이는데, `src/app` 아래 있어 프로덕션에서 `/vertical-grid-demo`로 접근 가능하다. 제품 기능이 아니라면 배포 대상에서 제외하거나(개발 전용 처리), 실제로 필요한 화면이면 진입 경로와 목적을 문서화하는 편이 좋다.

### 3. (위생·중간) 런타임 로그 디렉터리가 형상관리에 포함될 준비 상태
`logs/server.err.log`, `logs/server.out.log`

LaunchAgent 런타임 로그가 미추적 상태로 작업트리에 남아 있다. 커밋되면 안 되는 산출물이므로 `.gitignore`에 `logs/`를 추가하는 편이 좋다.

### 4. (품질·낮음) 테스트가 동작이 아니라 소스 문자열을 검사
`tests/vertical-*.test.js`, `tests/vertical-mixed-addition-layout.test.js`

신규 테스트는 소스 파일에서 정확한 스타일 문자열·정규식 존재 여부를 매칭한다(예: `gridTemplateColumns:\s*"12px 2.2ch 2.2ch"`). 포매팅만 바뀌어도 깨지고, 실제 렌더링·생성 동작은 검증하지 않는다. 그 결과 위 1번 같은 실제 버그를 잡지 못했다(24개 모두 통과). 최소한 `generateCalcSheet`의 답 범위 반영을 데이터 레벨에서 검증하는 테스트를 권장.

### 5. (UX·낮음) 숫자 입력을 비울 수 없음
`src/app/vertical/page.tsx:10-37`

`NumberInput`은 `value`가 number인 제어 컴포넌트라, 사용자가 필드를 지우면 `parseNumericInput`이 `0`을 돌려 즉시 `0`이 표시된다. 값을 지우고 새로 입력하는 흐름이 어색하다. 포커스 시 `el.select()`로 완화되어 있으나, 빈 문자열 허용 또는 문자열 상태 관리로 개선 여지가 있다.

### 6. (사소) 범위 유효성 안내가 필드를 특정하지 않음
`src/app/vertical/page.tsx:63-68`, `:77-80`

`normalizeRange`는 blur 시 `max < min`만 교정하고, 10~99 제약은 `generate()`에서만 검사한다. 범위를 벗어나면 "10~99 내에서 입력해주세요" 토스트만 뜨고 어느 필드가 문제인지 알려주지 않는다.

---

## 참고 — 잘 된 점
- 타이머(`toastTimeoutRef` 등)를 언마운트 시 정리(`vertical/page.tsx:59-61`, `preview/page.tsx:115-118`).
- `generateCalcAllSheets` 결과 수를 기대치와 비교해 부족분을 사용자에게 안내(`preview/page.tsx:252-259`).
- 공유 저장 중복 클릭 가드(`preview/page.tsx:151`)와 저장 실패 토스트 처리.

## 커밋 관련
이번 실행에서 소스를 변경하지 않았다. 대상 파일은 실행 시작 시점에 이미 미추적으로 존재했고 다른 실행이 만든 것이므로 커밋 범위 정책에 따라 stage·commit하지 않았다. 이 리뷰의 산출물은 피드백 자체다.

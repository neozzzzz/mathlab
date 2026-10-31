# math-lab 개발 지침

## 클릭 반응성(INP) — 이벤트 핸들러에서 메인 스레드를 막지 않기

Vercel Speed Insights 가 INP(Interaction to Next Paint)를 잰다. 클릭 핸들러가 끝나고
화면이 다시 그려질 때까지 걸린 시간이 그대로 잡히므로, 핸들러 안에서 메인 스레드를
오래 막는 코드는 넣지 않는다. (AF-1052: 인쇄 버튼의 `window.print()` 가 인쇄 대화상자가
열려 있는 13.7초 동안 화면 갱신을 막아 INP 경고가 났다.)

- `window.print()` 를 직접 부르지 않는다. 인쇄 버튼은 `@/lib/print` 의
  `printAfterPaint()` 를 쓴다. 클릭 직후 화면을 먼저 그린 뒤 인쇄 대화상자를 연다.
- `alert()`·`confirm()`·`prompt()` 처럼 대화상자가 닫힐 때까지 멈추는 브라우저 API 는
  쓰지 않는다. 안내는 토스트나 화면 안 메시지로 보여 준다.
- 문제지 생성처럼 무거운 계산은 클릭 핸들러에서 바로 돌리지 않는다. 버튼 상태(로딩 표시 등)를
  먼저 그린 뒤 `startTransition`, `setTimeout`, 또는 다음 페이지의 렌더링으로 넘긴다.
- `tests/print-button-inp.test.js` 가 `src` 전체에서 위 API 의 직접 호출을 찾아 실패시킨다.
  새 화면을 만들 때도 이 테스트(`npm test`)를 통과해야 한다.

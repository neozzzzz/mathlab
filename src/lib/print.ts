/**
 * 클릭 직후의 화면 갱신(paint)이 먼저 일어나도록 미룬 뒤 인쇄 대화상자를 연다.
 *
 * window.print()는 대화상자가 닫힐 때까지 메인 스레드를 막는다. 클릭 핸들러 안에서
 * 바로 부르면 대화상자에 머문 시간 전체가 INP(Interaction to Next Paint)로 잡힌다.
 * requestAnimationFrame 은 다음 paint 직전에, 그 안의 setTimeout 은 paint 직후에
 * 실행되므로 인쇄 호출이 클릭 상호작용의 다음 paint 이후로 밀린다.
 */
export function printAfterPaint(): void {
  if (typeof window === "undefined") return;
  requestAnimationFrame(() => {
    setTimeout(() => window.print(), 0);
  });
}

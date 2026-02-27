// GA Event Catalog — 새 이벤트 추가 시 여기에 정의
export const GA_EVENTS = {
  // 메인
  SELECT_MENU: 'select_menu',
  // 문제 생성
  GENERATE: 'generate',
  // 미리보기
  PRINT: 'print',
  SHARE_CREATE: 'share_create',
  SHARE_COPY: 'share_copy',
  // 공유 페이지
  SHARED_VIEW: 'shared_view',
  SHARED_PRINT: 'shared_print',
  SHARED_HOME: 'shared_home',
  // 네비게이션
  NAV_HOME: 'nav_home',
  NAV_BACK: 'nav_back',
} as const;

export type GAEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS];

export type GAEventParams = Record<string, string | number | boolean | undefined>;

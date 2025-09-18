export type AnalyticsEvent = {
  type: 'pageview' | 'event';
  path?: string;
  referrer?: string;
  ts?: string;
  ua?: string;
  lang?: string;
  screen?: string;
  dpr?: number;
  uuid?: string | null;
  tz?: string | null;
  dnt?: boolean;
  data?: Record<string, any>;
};

const getBase = (): string => {
  const env = (import.meta as any).env;
  return env?.VITE_ANALYTICS_BASE_URL || 'https://tubox.de/TUBOX/server/api/analytics';
};

const getUUID = (): string => {
  try {
    const k = 'anon_uuid';
    const ex = localStorage.getItem(k);
    if (ex) return ex;
    const id = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    localStorage.setItem(k, id);
    return id;
  } catch {
    return '';
  }
};

const commonPayload = (overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent => {
  const nav: any = typeof navigator !== 'undefined' ? navigator : {};
  const scr: any = typeof window !== 'undefined' ? window.screen : {};
  return {
    type: 'pageview',
    ts: new Date().toISOString(),
    ua: nav.userAgent || '',
    lang: nav.language || '',
    screen: scr && scr.width && scr.height ? `${scr.width}x${scr.height}` : '',
    dpr: typeof window !== 'undefined' && (window as any).devicePixelRatio ? (window as any).devicePixelRatio : 1,
    uuid: getUUID(),
    tz: Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || null,
    dnt: nav.doNotTrack === '1' || nav.msDoNotTrack === '1' || (window as any).doNotTrack === '1',
    ...overrides,
  };
};

export const sendEvent = (evt: AnalyticsEvent) => {
  try {
    const url = `${getBase()}/collect.php`;
    const body = JSON.stringify(evt);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, mode: 'cors', body });
  } catch {}
};

export const trackPageview = (path: string) => {
  try {
    const ref = typeof document !== 'undefined' ? (document.referrer || '') : '';
    const payload = commonPayload({ type: 'pageview', path, referrer: ref });
    // Respect DNT: server also checks, but short-circuit client if desired
    if (payload.dnt) return;
    sendEvent(payload);
  } catch {}
};

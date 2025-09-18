export type AnalyticsEvent = {
  type: 'pageview' | 'event' | 'heartbeat';
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
  device?: 'mobile' | 'tablet' | 'desktop' | 'other';
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
};

const getBase = (): string => {
  const env = (import.meta as any).env;
  return env?.VITE_ANALYTICS_BASE_URL || 'https://tubox.de/TUBOX/server/api/analytics';
};

const getUUID = (): string => {
  try {
    const k = 'anon_uuid';
    const existing = localStorage.getItem(k);
    if (existing) return existing;
    const id = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(k, id);
    return id;
  } catch {
    return '';
  }
};

// Heartbeat session fallback UUID (if localStorage is blocked, use sessionStorage)
const getSessionHeartbeatUUID = (): string => {
  try {
    const k = 'hb_uuid';
    const existing = sessionStorage.getItem(k);
    if (existing) return existing;
    const id = (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)) + '-hb';
    sessionStorage.setItem(k, id);
    return id;
  } catch {
    // last resort ephemeral id
    return 'ephem-' + Math.random().toString(36).slice(2);
  }
};

const commonPayload = (overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent => {
  const nav: any = typeof navigator !== 'undefined' ? navigator : {};
  const scr: any = typeof window !== 'undefined' ? window.screen : {};
  const uaStr: string = nav.userAgent || '';
  // Device detection (enhanced): UA-CH, iPadOS on Safari (Macintosh + touch)
  // UA Client Hints
  // @ts-ignore
  const uaData = (nav as any).userAgentData;
  const chMobile = uaData && typeof uaData.mobile === 'boolean' ? uaData.mobile : undefined;
  // iPadOS masquerades as Macintosh with touch
  const isIpadOS = /Macintosh/.test(uaStr) && typeof (navigator as any).maxTouchPoints === 'number' && (navigator as any).maxTouchPoints > 1;
  const isIpad = /iPad/.test(uaStr) || isIpadOS;
  const isTablet = /Tablet|Android(?!.*Mobile)/.test(uaStr) || isIpad;
  const isMobileByUA = /Mobi|Android/.test(uaStr) && !isTablet;
  const isMobile = chMobile === true || (chMobile === undefined && isMobileByUA);
  const device: AnalyticsEvent['device'] = isMobile ? 'mobile' : (isTablet ? 'tablet' : (uaStr ? 'desktop' : 'other'));
  // UTM capture
  let utm: AnalyticsEvent['utm'] = undefined;
  try {
    const usp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const source = usp.get('utm_source') || undefined;
    const medium = usp.get('utm_medium') || undefined;
    const campaign = usp.get('utm_campaign') || undefined;
    const term = usp.get('utm_term') || undefined;
    const content = usp.get('utm_content') || undefined;
    if (source || medium || campaign || term || content) {
      utm = { source, medium, campaign, term, content };
    }
  } catch {}
  return {
    type: 'pageview',
    ts: new Date().toISOString(),
    ua: uaStr,
    lang: nav.language || '',
    screen: scr && scr.width && scr.height ? `${scr.width}x${scr.height}` : '',
    dpr: typeof window !== 'undefined' && (window as any).devicePixelRatio ? (window as any).devicePixelRatio : 1,
    uuid: getUUID(),
    tz: Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || null,
    dnt: nav.doNotTrack === '1' || nav.msDoNotTrack === '1' || (window as any).doNotTrack === '1',
    device,
    utm,
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
    // Entry detection: first pageview in this session
    let entry = false;
    try {
      const key = 'pv_seen';
      const seen = sessionStorage.getItem(key);
      if (!seen) {
        entry = true;
        sessionStorage.setItem(key, '1');
      }
    } catch {}
    const payload = commonPayload({ type: 'pageview', path, referrer: ref, data: { entry } });
    // Respect DNT: server also checks, but short-circuit client if desired
    if (payload.dnt) return;
    sendEvent(payload);
  } catch {}
};

let heartbeatTimer: number | null = null;
export const startHeartbeat = () => {
  try {
    if (heartbeatTimer !== null) return; // already running
    const send = () => {
      const hb = commonPayload({ type: 'heartbeat' });
      // Heartbeat ist anonym und dient nur der Live-Anzeige -> auch bei DNT senden
      hb.dnt = false;
      if (!hb.uuid) {
        hb.uuid = getSessionHeartbeatUUID();
      }
      sendEvent(hb);
    };
    send();
    heartbeatTimer = (setInterval(send, 60_000) as unknown) as number;
  } catch {}
};

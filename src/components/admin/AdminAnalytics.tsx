import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Globe2, MousePointerClick, Smartphone, Monitor, Tablet, Link2 } from 'lucide-react';

type Stats = {
  range: { from: string; to: string };
  kpis: { pageviews: number; visitors: number; onlineNow: number };
  timeseries: { date: string; pv: number }[];
  topPaths: { path: string; count: number }[];
  countries: { country: string; count: number }[];
  browsers: { browser: string; count: number }[];
  referrers: { referrer: string; count: number }[];
  devices: { device: string; count: number }[];
  utmSources: { source: string; count: number }[];
  utmMediums: { medium: string; count: number }[];
  utmCampaigns: { campaign: string; count: number }[];
};

const BASE = (import.meta as any).env?.VITE_ANALYTICS_BASE_URL || 'https://tubox.de/TUBOX/server/api/analytics';

export const AdminAnalytics = () => {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagMessage, setDiagMessage] = useState<string | null>(null);

  // Helpers to render country name + flag
  const regionNames = typeof Intl !== 'undefined' && (Intl as any).DisplayNames
    ? new (Intl as any).DisplayNames(['de', 'en'], { type: 'region' })
    : null;
  const countryName = (code: string) => {
    try { return (regionNames && code) ? regionNames.of(code) || code : code; } catch { return code; }
  };
  const countryFlag = (code: string) => {
    try {
      if (!code) return '';
      const cc = code.toUpperCase();
      return String.fromCodePoint(...[...cc].map(c => 127397 + c.charCodeAt(0)));
    } catch { return ''; }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/stats.php?days=${days}`, { cache: 'no-store', mode: 'cors' });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.message || `HTTP ${res.status}`);
      setStats(j.data);
    } catch (e: any) {
      setError(e?.message || 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [days]);
  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => {
      load();
    }, 30000);
    return () => clearInterval(id);
  }, [days]);

  const maxTS = stats ? Math.max(1, ...stats.timeseries.map(d => d.pv)) : 1;
  const maxPath = stats ? Math.max(1, ...stats.topPaths.map(p => p.count)) : 1;
  const maxCountry = stats ? Math.max(1, ...stats.countries.map(c => c.count)) : 1;
  const maxBrowser = stats ? Math.max(1, ...stats.browsers.map(b => b.count)) : 1;
  const maxRef = stats ? Math.max(1, ...stats.referrers.map(r => r.count)) : 1;
  const maxDevice = stats && stats.devices && stats.devices.length > 0 ? Math.max(1, ...stats.devices.map(d => d.count)) : 1;
  const maxUtmSource = stats && stats.utmSources && stats.utmSources.length > 0 ? Math.max(1, ...stats.utmSources.map(u => u.count)) : 1;
  const maxUtmMedium = stats && stats.utmMediums && stats.utmMediums.length > 0 ? Math.max(1, ...stats.utmMediums.map(u => u.count)) : 1;
  const maxUtmCampaign = stats && stats.utmCampaigns && stats.utmCampaigns.length > 0 ? Math.max(1, ...stats.utmCampaigns.map(u => u.count)) : 1;
  const sumDevice = stats && stats.devices ? Math.max(1, stats.devices.reduce((a,c)=>a+c.count,0)) : 1;
  const sumUtmSource = stats && stats.utmSources ? Math.max(1, stats.utmSources.reduce((a,c)=>a+c.count,0)) : 1;
  const sumUtmMedium = stats && stats.utmMediums ? Math.max(1, stats.utmMediums.reduce((a,c)=>a+c.count,0)) : 1;
  const sumUtmCampaign = stats && stats.utmCampaigns ? Math.max(1, stats.utmCampaigns.reduce((a,c)=>a+c.count,0)) : 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background to-muted/40">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative p-6 sm:p-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Analyse</h2>
              <p className="text-sm text-muted-foreground">Zeitraum {stats?.range.from} bis {stats?.range.to} • Server: {BASE}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={days} onChange={(e)=>setDays(parseInt(e.target.value,10))} className="rounded-md border px-3 py-2 bg-background/70">
              <option value={7}>7 Tage</option>
              <option value={30}>30 Tage</option>
              <option value={90}>90 Tage</option>
            </select>
            <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Lade…' : 'Aktualisieren'}</Button>
          </div>
        </div>
      </div>

      {error && <div className="text-destructive">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="border-0 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Pageviews</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats?.kpis.pageviews ?? '—'}</CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Besucher</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats?.kpis.visitors ?? '—'}</CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Online</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold flex items-center gap-2">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            {stats?.kpis.onlineNow ?? '—'}
          </CardContent>
        </Card>
        <Card className="hidden sm:block border-0 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><Globe2 className="h-4 w-4" /> Länder</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats?.countries.reduce((a,c)=>a+c.count,0) ?? '—'}</CardContent>
        </Card>
        <Card className="hidden sm:block border-0 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><Link2 className="h-4 w-4" /> Referrer</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats?.referrers.reduce((a,c)=>a+c.count,0) ?? '—'}</CardContent>
        </Card>
      </div>

      {/* Timeseries (mini bars) */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-background to-muted/40">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Pageviews nach Tag</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-[6px] h-28">
            {stats?.timeseries.map((d, i) => (
              <div key={d.date} className="relative group flex-1 min-w-[4px] h-full">
                <div className="h-full w-full bg-muted rounded">
                  <div className="w-full bg-primary rounded-b" style={{ height: `${(d.pv / maxTS) * 100}%` }} />
                </div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all text-[10px] bg-background/90 border px-2 py-1 rounded shadow">
                  {d.date}: {d.pv}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">{stats?.timeseries[0]?.date} – {stats?.timeseries.at(-1)?.date}</div>
        </CardContent>
      </Card>

      {/* Top Seiten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow bg-gradient-to-br from-background to-muted/40">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top Seiten</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats?.topPaths.map((p) => (
              <div key={p.path} className="flex items-center gap-2">
                <div className="text-xs w-28 truncate" title={p.path}>{p.path}</div>
                <div className="flex-1 h-2 bg-muted rounded">
                  <div className="h-2 bg-primary rounded" style={{ width: `${(p.count / maxPath) * 100}%` }} />
                </div>
                <div className="w-10 text-right text-xs">{p.count}</div>
              </div>
            ))}
            {(!stats || stats.topPaths.length === 0) && <div className="text-sm text-muted-foreground">Keine Daten</div>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow bg-gradient-to-br from-background to-muted/40">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Länder</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats?.countries.map((c) => (
              <div key={c.country} className="flex items-center gap-2">
                <div className="text-xs w-36 flex items-center gap-2">
                  <span className="text-base leading-none">{countryFlag(c.country)}</span>
                  <span className="truncate" title={`${countryName(c.country)} (${c.country})`}>{countryName(c.country)}</span>
                </div>
                <div className="flex-1 h-2 bg-muted rounded">
                  <div className="h-2 bg-primary rounded" style={{ width: `${(c.count / maxCountry) * 100}%` }} />
                </div>
                <div className="w-10 text-right text-xs">{c.count}</div>
              </div>
            ))}
            {(!stats || stats.countries.length === 0) && <div className="text-sm text-muted-foreground">Keine Daten</div>}
          </CardContent>
        </Card>
      </div>

      {/* Browser & Referrer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow bg-gradient-to-br from-background to-muted/40">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Browser</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats?.browsers.map((b) => (
              <div key={b.browser} className="flex items-center gap-2">
                <div className="text-xs w-24">{b.browser}</div>
                <div className="flex-1 h-2 bg-muted rounded">
                  <div className="h-2 bg-primary rounded" style={{ width: `${(b.count / maxBrowser) * 100}%` }} />
                </div>
                <div className="w-10 text-right text-xs">{b.count}</div>
              </div>
            ))}
            {(!stats || stats.browsers.length === 0) && <div className="text-sm text-muted-foreground">Keine Daten</div>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow bg-gradient-to-br from-background to-muted/40">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Referrer</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats?.referrers.map((r) => (
              <div key={r.referrer} className="flex items-center gap-2">
                <div className="text-xs w-40 truncate" title={r.referrer}>{r.referrer}</div>
                <div className="flex-1 h-2 bg-muted rounded">
                  <div className="h-2 bg-primary rounded" style={{ width: `${(r.count / maxRef) * 100}%` }} />
                </div>
                <div className="w-10 text-right text-xs">{r.count}</div>
              </div>
            ))}
            {(!stats || stats.referrers.length === 0) && <div className="text-sm text-muted-foreground">Keine Daten</div>}
          </CardContent>
        </Card>
      </div>

      {/* Devices & UTM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow bg-gradient-to-br from-background to-muted/40">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Geräte</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats?.devices?.map((d) => (
              <div key={d.device} className="flex items-center gap-2">
                <div className="text-xs w-24 flex items-center gap-2 capitalize">
                  {d.device === 'mobile' && <Smartphone className="h-3.5 w-3.5" />}
                  {d.device === 'tablet' && <Tablet className="h-3.5 w-3.5" />}
                  {d.device === 'desktop' && <Monitor className="h-3.5 w-3.5" />}
                  {d.device}
                </div>
                <div className="flex-1 h-2 bg-muted rounded">
                  <div className="h-2 bg-primary rounded" style={{ width: `${(d.count / maxDevice) * 100}%` }} />
                </div>
                <div className="w-16 text-right text-[11px] tabular-nums">{Math.round((d.count / sumDevice) * 100)}% · {d.count}</div>
              </div>
            ))}
            {(!stats || !stats.devices || stats.devices.length === 0) && <div className="text-sm text-muted-foreground">Keine Daten</div>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow bg-gradient-to-br from-background to-muted/40">
          <CardHeader className="pb-2"><CardTitle className="text-sm">UTM (Source/Medium/Campaign)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-2">Source</div>
              <div className="space-y-2">
                {stats?.utmSources?.map((u) => (
                  <div key={u.source} className="flex items-center gap-2">
                    <div className="text-xs w-28 truncate" title={u.source}>{u.source}</div>
                    <div className="flex-1 h-2 bg-muted rounded">
                      <div className="h-2 bg-primary rounded" style={{ width: `${(u.count / maxUtmSource) * 100}%` }} />
                    </div>
                    <div className="w-16 text-right text-[11px] tabular-nums">{Math.round((u.count / sumUtmSource) * 100)}% · {u.count}</div>
                  </div>
                ))}
                {(!stats || !stats.utmSources || stats.utmSources.length === 0) && <div className="text-xs text-muted-foreground">–</div>}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Medium</div>
              <div className="space-y-2">
                {stats?.utmMediums?.map((u) => (
                  <div key={u.medium} className="flex items-center gap-2">
                    <div className="text-xs w-28 truncate" title={u.medium}>{u.medium}</div>
                    <div className="flex-1 h-2 bg-muted rounded">
                      <div className="h-2 bg-primary rounded" style={{ width: `${(u.count / maxUtmMedium) * 100}%` }} />
                    </div>
                    <div className="w-16 text-right text-[11px] tabular-nums">{Math.round((u.count / sumUtmMedium) * 100)}% · {u.count}</div>
                  </div>
                ))}
                {(!stats || !stats.utmMediums || stats.utmMediums.length === 0) && <div className="text-xs text-muted-foreground">–</div>}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Campaign</div>
              <div className="space-y-2">
                {stats?.utmCampaigns?.map((u) => (
                  <div key={u.campaign} className="flex items-center gap-2">
                    <div className="text-xs w-28 truncate" title={u.campaign}>{u.campaign}</div>
                    <div className="flex-1 h-2 bg-muted rounded">
                      <div className="h-2 bg-primary rounded" style={{ width: `${(u.count / maxUtmCampaign) * 100}%` }} />
                    </div>
                    <div className="w-16 text-right text-[11px] tabular-nums">{Math.round((u.count / sumUtmCampaign) * 100)}% · {u.count}</div>
                  </div>
                ))}
                {(!stats || !stats.utmCampaigns || stats.utmCampaigns.length === 0) && <div className="text-xs text-muted-foreground">–</div>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diagnose */}
      <div className="mt-2 rounded-xl border p-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm">Diagnose</Label>
          <span className="text-xs text-muted-foreground">Server: {BASE}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Testet GET (stats) und POST (collect) Endpunkte.</p>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={diagRunning}
            onClick={async () => {
              setDiagRunning(true);
              setDiagMessage(null);
              try {
                // Test GET stats
                const getRes = await fetch(`${BASE}/stats.php?days=1`, { cache: 'no-store', mode: 'cors' });
                const getOk = getRes.ok;
                // Test POST collect with a synthetic event
                const postRes = await fetch(`${BASE}/collect.php`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  mode: 'cors',
                  body: JSON.stringify({ type: 'event', ts: new Date().toISOString(), path: '/admin', referrer: '', ua: navigator.userAgent, lang: navigator.language, screen: `${window.screen.width}x${window.screen.height}`, dpr: window.devicePixelRatio || 1, uuid: 'diagnostic', tz: Intl.DateTimeFormat().resolvedOptions().timeZone, dnt: false, data: { test: true } })
                });
                const postText = await postRes.text();
                const postOk = postRes.ok;
                setDiagMessage(`GET ${getOk ? 'OK' : getRes.status} • POST ${postOk ? 'OK' : postRes.status} ${postText ? '• ' + postText.slice(0, 140) : ''}`);
              } catch (e:any) {
                setDiagMessage(`Fehler: ${e?.message || 'Unbekannt'}`);
              } finally {
                setDiagRunning(false);
              }
            }}
          >
            {diagRunning ? 'Teste…' : 'Verbindung testen'}
          </Button>
          {diagMessage && <span className="text-xs text-muted-foreground">{diagMessage}</span>}
        </div>
      </div>
    </div>
  );
};

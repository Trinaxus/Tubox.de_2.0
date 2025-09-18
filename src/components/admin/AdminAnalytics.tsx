import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Stats = {
  range: { from: string; to: string };
  kpis: { pageviews: number; visitors: number };
  timeseries: { date: string; pv: number }[];
  topPaths: { path: string; count: number }[];
  countries: { country: string; count: number }[];
  browsers: { browser: string; count: number }[];
  referrers: { referrer: string; count: number }[];
};

const BASE = (import.meta as any).env?.VITE_ANALYTICS_BASE_URL || 'https://tubox.de/TUBOX/server/api/analytics';

export const AdminAnalytics = () => {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagMessage, setDiagMessage] = useState<string | null>(null);

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

  const maxTS = stats ? Math.max(1, ...stats.timeseries.map(d => d.pv)) : 1;
  const maxPath = stats ? Math.max(1, ...stats.topPaths.map(p => p.count)) : 1;
  const maxCountry = stats ? Math.max(1, ...stats.countries.map(c => c.count)) : 1;
  const maxBrowser = stats ? Math.max(1, ...stats.browsers.map(b => b.count)) : 1;
  const maxRef = stats ? Math.max(1, ...stats.referrers.map(r => r.count)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Analyse</h2>
          <p className="text-sm text-muted-foreground">Zeitraum {stats?.range.from} bis {stats?.range.to} • Server: {BASE}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(e)=>setDays(parseInt(e.target.value,10))} className="rounded-md border px-2 py-1 bg-background">
            <option value={7}>7 Tage</option>
            <option value={30}>30 Tage</option>
            <option value={90}>90 Tage</option>
          </select>
          <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Lade…' : 'Aktualisieren'}</Button>
        </div>
      </div>

      {error && <div className="text-destructive">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pageviews</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats?.kpis.pageviews ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Besucher</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats?.kpis.visitors ?? '—'}</CardContent>
        </Card>
      </div>

      {/* Timeseries (mini bars) */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Pageviews nach Tag</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-24">
            {stats?.timeseries.map((d) => (
              <div key={d.date} className="bg-primary/60 w-2" style={{ height: `${(d.pv / maxTS) * 100}%` }} title={`${d.date}: ${d.pv}`} />
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">{stats?.timeseries[0]?.date} – {stats?.timeseries.at(-1)?.date}</div>
        </CardContent>
      </Card>

      {/* Top Seiten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
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

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Länder</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats?.countries.map((c) => (
              <div key={c.country} className="flex items-center gap-2">
                <div className="text-xs w-16">{c.country}</div>
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
        <Card>
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

        <Card>
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

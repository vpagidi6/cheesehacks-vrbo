import { useEffect, useState, useMemo } from "react";
import { storageGet, storageSet, subscribeToStorage, defaultSettings, AppSettings, seedMockData } from "@/lib/storage";
import { parseEvent, isToday, ParsedEvent } from "@/lib/extractors";
import { computeWater } from "@/lib/water";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Droplets, Zap, Activity, Trash2, Download, History } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Dashboard() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const data = await storageGet(["usageHistory", "settings"]);
    if (data.settings) {
      setSettings({ ...defaultSettings, ...data.settings });
    }
    if (data.usageHistory && Array.isArray(data.usageHistory)) {
      setEvents(data.usageHistory.map(parseEvent).sort((a, b) => b.timestamp - a.timestamp));
    } else {
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    seedMockData();
    loadData();
    const unsubscribe = subscribeToStorage(loadData);
    return unsubscribe;
  }, []);

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    storageSet({ settings: newSettings });
  };

  const clearData = () => {
    if (confirm("Are you sure you want to clear all usage data?")) {
      storageSet({ usageHistory: [] });
    }
  };

  const exportCSV = () => {
    const headers = ["ts_iso", "tool", "tokens_total", "prompt_tokens", "completion_tokens", "raw_json"];
    const rows = events.map(e => {
      const ts_iso = new Date(e.timestamp).toISOString();
      const pt = e.raw?.payload?.prompt_tokens || e.raw?.payload?.usage?.prompt_tokens || "";
      const ct = e.raw?.payload?.completion_tokens || e.raw?.payload?.usage?.completion_tokens || "";
      const raw = JSON.stringify(e.raw).replace(/"/g, '""');
      return `${ts_iso},${e.tool},${e.tokens},${pt},${ct},"${raw}"`;
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "token-usage.csv";
    a.click();
  };

  const todayEvents = useMemo(() => events.filter(e => isToday(e.timestamp)), [events]);
  
  const todayTokens = todayEvents.reduce((sum, e) => sum + e.tokens, 0);
  const totalTokens = events.reduce((sum, e) => sum + e.tokens, 0);
  
  const todayWater = computeWater(todayTokens, settings.waterIntensity);
  const totalWater = computeWater(totalTokens, settings.waterIntensity);

  const getEcoTip = () => {
    if (todayTokens < 5000) return "You're in the green! Keep up the efficient prompting.";
    if (todayTokens < 15000) return "Consider summarizing your prompts to save tokens and water.";
    return "Try smaller models or reduce context window to minimize footprint.";
  };

  const isLimitReached = settings.limitsEnabled && (todayTokens >= settings.tokenLimit || todayWater.oz >= settings.ozLimit);

  const computeToolStats = (evts: ParsedEvent[]) => {
    const stats: Record<string, number> = {};
    let total = 0;
    evts.forEach(e => {
      stats[e.tool] = (stats[e.tool] || 0) + e.tokens;
      total += e.tokens;
    });
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => ({ name, value: val, percent: total ? (val / total) * 100 : 0 }));
  };

  if (loading) return <div className="w-[360px] h-[500px] bg-background text-foreground flex items-center justify-center mx-auto border shadow-2xl overflow-hidden relative z-10 rounded-xl">Loading...</div>;

  return (
    <div className="w-[360px] h-[540px] bg-background text-foreground font-sans flex flex-col mx-auto border border-border/50 shadow-2xl shadow-black/50 overflow-hidden relative z-10 rounded-xl">
      <header className="px-4 py-3 border-b flex items-center justify-between bg-card/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <h1 className="font-semibold tracking-tight text-base">EcoTokens</h1>
        </div>
        <div className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full font-mono">
          MVP Preview
        </div>
      </header>

      {isLimitReached && (
        <Alert variant="destructive" className="mx-3 mt-3 rounded-md border py-2 px-3 shadow-sm bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold mb-1">Daily limit reached</AlertTitle>
          <AlertDescription className="text-xs opacity-90">
            {settings.hardBlock ? "Hard block enabled (not enforced in MVP)" : "You've exceeded your daily allowance."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="today" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b h-11 bg-muted/30 p-0 sticky top-0 z-10">
          <TabsTrigger value="today" className="rounded-none h-full data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">Today</TabsTrigger>
          <TabsTrigger value="total" className="rounded-none h-full data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">Total</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-none h-full data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">Settings</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
          <TabsContent value="today" className="m-0 p-4 space-y-5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-card/50 shadow-sm border-muted transition-all hover:bg-card/80">
                <CardHeader className="p-3 pb-1">
                  <CardDescription className="text-xs font-medium flex items-center gap-1.5"><Zap className="w-3.5 h-3.5"/> Tokens</CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <div className="text-2xl font-bold font-mono tracking-tight">{todayTokens.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 shadow-sm border-muted transition-all hover:bg-card/80">
                <CardHeader className="p-3 pb-1">
                  <CardDescription className="text-xs font-medium flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-blue-500"/> Water</CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <div className="flex items-baseline gap-1">
                    <div className="text-2xl font-bold font-mono tracking-tight">{todayWater.oz.toFixed(1)}</div>
                    <span className="text-[10px] text-muted-foreground font-semibold">oz</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-medium bg-muted/50 inline-block px-1.5 py-0.5 rounded">~ {todayWater.bottles.toFixed(2)} bottles</div>
                </CardContent>
              </Card>
            </div>

            {settings.ecoMode && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-xs leading-relaxed shadow-sm">
                <strong className="block mb-0.5">Eco Tip</strong>
                <span className="opacity-90">{getEcoTip()}</span>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> Platform Breakdown</h3>
              {computeToolStats(todayEvents).length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-lg border border-dashed">No activity recorded today</div>
              ) : (
                <div className="space-y-3">
                  {computeToolStats(todayEvents).map(stat => (
                    <div key={stat.name} className="space-y-1.5 group">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="capitalize">{stat.name}</span>
                        <span className="text-muted-foreground font-mono">{stat.value.toLocaleString()} <span className="opacity-50">({Math.round(stat.percent)}%)</span></span>
                      </div>
                      <Progress value={stat.percent} className="h-1.5 bg-muted group-hover:bg-muted/80 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><History className="w-3.5 h-3.5"/> Recent Events</h3>
              {events.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-lg border border-dashed">No events found</div>
              ) : (
                <div className="space-y-2">
                  {events.slice(0, 5).map((e, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2.5 rounded-lg bg-muted/30 border border-muted/50 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="capitalize font-medium text-xs">{e.tool}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className="font-mono text-xs font-semibold">{e.tokens.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">tk</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="total" className="m-0 p-4 space-y-5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <Card className="bg-card/50 shadow-sm border-muted">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><History className="w-4 h-4"/> All-Time Usage</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tokens</div>
                  <div className="text-3xl font-bold font-mono tracking-tight">{totalTokens.toLocaleString()}</div>
                </div>
                <div className="pt-4 border-t border-muted/50 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estimated Water Footprint</div>
                  <div className="text-2xl font-bold font-mono tracking-tight flex items-baseline gap-1">
                    {totalWater.oz.toFixed(1)} <span className="text-sm font-normal text-muted-foreground font-sans">oz</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium bg-muted/50 inline-block px-2 py-1 rounded mt-1">{totalWater.bottles.toFixed(2)} water bottles (16.9oz)</div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> All-Time Breakdown</h3>
              <div className="space-y-3 p-4 border rounded-lg bg-card/50">
                {computeToolStats(events).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center">No data</p>
                ) : (
                  computeToolStats(events).map(stat => (
                    <div key={stat.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="capitalize">{stat.name}</span>
                        <span className="text-muted-foreground font-mono">{stat.value.toLocaleString()} <span className="opacity-50">({Math.round(stat.percent)}%)</span></span>
                      </div>
                      <Progress value={stat.percent} className="h-1.5" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="m-0 p-4 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card/50 hover:bg-card transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-sm cursor-pointer" htmlFor="eco-mode">Eco Mode Tips</Label>
                  <p className="text-[10px] text-muted-foreground">Show context-aware token saving advice</p>
                </div>
                <Switch id="eco-mode" checked={settings.ecoMode} onCheckedChange={(v) => handleSettingChange('ecoMode', v)} />
              </div>
              
              <div className="space-y-3 p-3 border rounded-lg bg-card/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm cursor-pointer" htmlFor="limits-enabled">Usage Limits</Label>
                    <p className="text-[10px] text-muted-foreground">Warn when daily limits are exceeded</p>
                  </div>
                  <Switch id="limits-enabled" checked={settings.limitsEnabled} onCheckedChange={(v) => handleSettingChange('limitsEnabled', v)} />
                </div>
                
                {settings.limitsEnabled && (
                  <div className="space-y-4 pt-3 mt-3 border-t animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-medium">Daily Token Limit</Label>
                      <Input type="number" value={settings.tokenLimit} onChange={e => handleSettingChange('tokenLimit', Number(e.target.value))} className="h-8 text-sm font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-medium">Daily Water Limit (oz)</Label>
                      <Input type="number" value={settings.ozLimit} onChange={e => handleSettingChange('ozLimit', Number(e.target.value))} className="h-8 text-sm font-mono" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-medium cursor-pointer" htmlFor="hard-block">Hard Block</Label>
                        <p className="text-[9px] text-muted-foreground">Visual warning only in MVP</p>
                      </div>
                      <Switch id="hard-block" checked={settings.hardBlock} onCheckedChange={(v) => handleSettingChange('hardBlock', v)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 p-3 border rounded-lg bg-card/50">
                <Label className="text-sm font-medium">Water Calculation Model</Label>
                <Select value={settings.waterIntensity} onValueChange={(v) => handleSettingChange('waterIntensity', v)}>
                  <SelectTrigger className="h-8 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className="text-xs">Low (0.5 mL / 1k tokens)</SelectItem>
                    <SelectItem value="typical" className="text-xs">Typical (2.0 mL / 1k tokens)</SelectItem>
                    <SelectItem value="high" className="text-xs">High (6.0 mL / 1k tokens)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">Estimates cooling water used by data centers.</p>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button variant="outline" className="w-full justify-start h-9 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground" onClick={exportCSV}>
                <Download className="w-3.5 h-3.5 mr-2" /> Export Usage History (CSV)
              </Button>
              <Button variant="outline" className="w-full justify-start h-9 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 transition-colors" onClick={clearData}>
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Reset Usage Data
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
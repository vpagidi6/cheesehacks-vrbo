import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import type { DashboardTab } from "./components/Tabs";
import StatCard from "./components/StatCard";
import ToolBreakdown from "./components/ToolBreakdown";
import EcoTip from "./components/EcoTip";
import SettingsPanel from "./components/SettingsPanel";
import { DEFAULT_STORAGE } from "./types";
import type { DailyTotalsEntry, StorageData } from "./types";
import { getStorage, setStorage } from "./storage/storage";

const BOTTLE_OZ = 16.9;

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function bottlesFromOz(oz: number): string {
  return (oz / BOTTLE_OZ).toFixed(2);
}

function safeEntry(entry?: DailyTotalsEntry): DailyTotalsEntry {
  return (
    entry ?? {
      tokens: 0,
      oz: 0,
      turns: 0,
      byTool: {
        chatgpt: { tokens: 0, oz: 0 },
        claude: { tokens: 0, oz: 0 },
        gemini: { tokens: 0, oz: 0 },
      },
    }
  );
}

function exportCsvStub(data: StorageData): void {
  const rows: string[] = ["scope,date,tool,tokens,oz,turns"];
  rows.push(
    `all-time,,all,${data.allTimeTotals.tokens},${data.allTimeTotals.oz},${data.allTimeTotals.turns}`
  );

  (Object.keys(data.allTimeTotals.byTool) as Array<keyof typeof data.allTimeTotals.byTool>).forEach(
    (tool) => {
      const toolData = data.allTimeTotals.byTool[tool];
      rows.push(`all-time,,${tool},${toolData.tokens},${toolData.oz},`);
    }
  );

  Object.entries(data.dailyTotals).forEach(([date, day]) => {
    rows.push(`daily,${date},all,${day.tokens},${day.oz},${day.turns}`);
    (Object.keys(day.byTool) as Array<keyof typeof day.byTool>).forEach((tool) => {
      const toolData = day.byTool[tool];
      rows.push(`daily,${date},${tool},${toolData.tokens},${toolData.oz},`);
    });
  });

  console.log("Export CSV stub:\n", rows.join("\n"));
  window.alert("Export CSV stub triggered. Open console to view CSV output.");
}

function App() {
  const [tab, setTab] = useState<DashboardTab>("today");
  const [storageData, setStorageData] = useState<StorageData>(DEFAULT_STORAGE);

  useEffect(() => {
    let active = true;
    getStorage().then((data) => {
      if (active) {
        setStorageData(data);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const todayData = useMemo(() => {
    const key = getTodayKey();
    return safeEntry(storageData.dailyTotals[key]);
  }, [storageData.dailyTotals]);

  const handleSettingsSave = async (settings: StorageData["settings"]) => {
    await setStorage({ settings });
    setStorageData((prev) => ({ ...prev, settings }));
  };

  return (
    <main className="site-shell" aria-label="Eco AI Tracker dashboard">
      <div className="dashboard">
        <Header />
        <Tabs active={tab} onChange={setTab} />

        {tab === "today" ? (
          <section id="panel-today" role="tabpanel" aria-labelledby="tab-today">
            <div className="stat-grid">
              <StatCard label="Tokens Today" value={todayData.tokens.toLocaleString()} />
              <StatCard label="Water Today (oz)" value={todayData.oz.toFixed(1)} />
              <StatCard
                label="Bottles Today"
                value={bottlesFromOz(todayData.oz)}
                hint="16.9 oz per bottle"
              />
            </div>

            <ToolBreakdown
              title="Per-tool breakdown"
              byTool={todayData.byTool}
              totalTokens={todayData.tokens}
            />

            {storageData.settings.ecoMode ? (
              <EcoTip tokens={todayData.tokens} />
            ) : (
              <section className="card muted" aria-live="polite">
                Eco mode is currently disabled. Enable it in Settings for guidance.
              </section>
            )}
          </section>
        ) : null}

        {tab === "total" ? (
          <section id="panel-total" role="tabpanel" aria-labelledby="tab-total">
            <div className="stat-grid">
              <StatCard
                label="Tokens Total"
                value={storageData.allTimeTotals.tokens.toLocaleString()}
              />
              <StatCard label="Water Total (oz)" value={storageData.allTimeTotals.oz.toFixed(1)} />
              <StatCard
                label="Bottles Total"
                value={bottlesFromOz(storageData.allTimeTotals.oz)}
                hint="16.9 oz per bottle"
              />
            </div>

            <ToolBreakdown
              title="Tool totals"
              byTool={storageData.allTimeTotals.byTool}
              totalTokens={storageData.allTimeTotals.tokens}
            />

            <section className="card actions-card">
              <button type="button" className="secondary" onClick={() => exportCsvStub(storageData)}>
                Export CSV
              </button>
            </section>
          </section>
        ) : null}

        {tab === "settings" ? (
          <SettingsPanel settings={storageData.settings} onSave={handleSettingsSave} />
        ) : null}
      </div>
    </main>
  );
}

export default App;

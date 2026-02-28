export type DashboardTab = "today" | "total" | "settings";

type TabsProps = {
  active: DashboardTab;
  onChange: (next: DashboardTab) => void;
};

const tabs: Array<{ id: DashboardTab; label: string }> = [
  { id: "today", label: "Today" },
  { id: "total", label: "Total" },
  { id: "settings", label: "Settings" },
];

export default function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label="Dashboard tabs">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`tab-btn ${isActive ? "active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

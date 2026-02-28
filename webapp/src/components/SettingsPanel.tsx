import { useEffect, useState } from "react";
import type { Settings } from "../types";

type SettingsPanelProps = {
  settings: Settings;
  onSave: (next: Settings) => Promise<void>;
};

export default function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <section className="card" id="panel-settings" role="tabpanel" aria-labelledby="tab-settings">
      <h2>Usage Limits & Enforcement</h2>

      <div className="row">
        <label htmlFor="ecoMode">Eco Mode</label>
        <button id="ecoMode" type="button" className={`toggle ${form.ecoMode ? "on" : ""}`} onClick={() => update("ecoMode", !form.ecoMode)} aria-pressed={form.ecoMode}>
          {form.ecoMode ? "On" : "Off"}
        </button>
      </div>

      <div className="row">
        <label htmlFor="limitsEnabled">Enforce Limits</label>
        <button
          id="limitsEnabled"
          type="button"
          className={`toggle ${form.limitsEnabled ? "on" : ""}`}
          onClick={() => update("limitsEnabled", !form.limitsEnabled)}
          aria-pressed={form.limitsEnabled}
        >
          {form.limitsEnabled ? "On" : "Off"}
        </button>
      </div>

      <div className="input-grid">
        <label>
          <span>Daily Token Limit</span>
          <input type="number" min={0} value={form.tokenLimit} onChange={(event) => update("tokenLimit", Number(event.target.value))} />
        </label>

        <label>
          <span>Daily Water Limit (oz)</span>
          <input type="number" min={0} step={0.1} value={form.ozLimit} onChange={(event) => update("ozLimit", Number(event.target.value))} />
        </label>
      </div>

      <label className="check-row">
        <input type="checkbox" checked={form.hardBlock} onChange={(event) => update("hardBlock", event.target.checked)} />
        <span>Hard Block When Exceeded</span>
      </label>

      <fieldset className="radio-group">
        <legend>Water Intensity</legend>
        {(["low", "typical", "high"] as const).map((value) => (
          <label key={value}>
            <input type="radio" name="waterIntensity" value={value} checked={form.waterIntensity === value} onChange={() => update("waterIntensity", value)} />
            <span>{value[0].toUpperCase() + value.slice(1)}</span>
          </label>
        ))}
      </fieldset>

      <div className="actions">
        <button className="primary" type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <span className={`toast ${saved ? "show" : ""}`} role="status" aria-live="polite">
          Saved!
        </span>
      </div>
    </section>
  );
}

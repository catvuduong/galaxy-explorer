"use client";

import { useState } from "react";
import type { GalaxySettings } from "./settings";
import styles from "./galaxy.module.css";

type ControlPanelProps = {
  settings: GalaxySettings;
  onChange: (patch: Partial<GalaxySettings>) => void;
  onReset: () => void;
};

export function ControlPanel({ settings, onChange, onReset }: ControlPanelProps) {
  // Collapsed by default so the home page screenshot shows only the galaxy.
  const [open, setOpen] = useState(false);

  return (
    <aside className={styles.panel} aria-label="Galaxy controls">
      <button
        type="button"
        className={styles.panelToggle}
        aria-expanded={open}
        aria-controls="galaxy-control-panel"
        data-testid="panel-toggle"
        onClick={() => setOpen((value) => !value)}
      >
        Controls
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div id="galaxy-control-panel" className={styles.panelBody} data-testid="control-panel">
          <label className={styles.control}>
            <span className={styles.controlLabel}>
              Arms <output data-testid="arms-value">{settings.arms}</output>
            </span>
            <input
              type="range"
              min={2}
              max={6}
              step={1}
              value={settings.arms}
              data-testid="arms-slider"
              onChange={(event) => onChange({ arms: Number(event.target.value) })}
            />
          </label>

          <label className={styles.control}>
            <span className={styles.controlLabel}>Speed</span>
            <span className={styles.controlRow}>
              <input
                type="range"
                min={0}
                max={3}
                step={0.05}
                value={settings.speed}
                data-testid="speed-slider"
                onChange={(event) => onChange({ speed: Number(event.target.value) })}
              />
              <output data-testid="speed-value">{settings.speed.toFixed(2)}×</output>
            </span>
          </label>

          <label className={`${styles.control} ${styles.controlRow}`}>
            <span className={styles.controlLabel}>Spin</span>
            <input
              type="checkbox"
              role="switch"
              checked={settings.spin}
              data-testid="spin-toggle"
              onChange={(event) => onChange({ spin: event.target.checked })}
            />
          </label>

          <div className={styles.colors}>
            <ColorField
              label="Core"
              value={settings.core}
              testId="color-core"
              onChange={(core) => onChange({ core })}
            />
            <ColorField
              label="Middle"
              value={settings.mid}
              testId="color-mid"
              onChange={(mid) => onChange({ mid })}
            />
            <ColorField
              label="Edge"
              value={settings.edge}
              testId="color-edge"
              onChange={(edge) => onChange({ edge })}
            />
          </div>

          <button
            type="button"
            className={styles.reset}
            data-testid="panel-reset"
            onClick={onReset}
          >
            Reset to defaults
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function ColorField({
  label,
  value,
  testId,
  onChange,
}: {
  label: string;
  value: string;
  testId: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.swatch}>
      <input
        type="color"
        value={value}
        data-testid={testId}
        onChange={(event) => onChange(event.target.value)}
      />
      <span>{label}</span>
    </label>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ControlPanel } from "./control-panel";
import { PlanetCard } from "./planet-card";
import { PLANETS } from "./planets";
import { resetGalaxySettings, updateGalaxySettings, useGalaxySettings } from "./settings";
import styles from "./galaxy.module.css";

// three.js needs a browser; the scene is only loaded on the client.
const GalaxyScene = dynamic(() => import("./galaxy-scene"), { ssr: false });

export function GalaxyExplorer() {
  const settings = useGalaxySettings();
  const [focusId, setFocusId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // Label buttons register themselves here; the scene moves them to follow their planets.
  const labels = useRef<Record<string, HTMLButtonElement | null>>({});
  const placeLabel = useCallback((id: string, x: number, y: number, visible: boolean) => {
    const element = labels.current[id];
    if (!element) return;
    element.style.display = visible ? "" : "none";
    element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
  }, []);

  const focused = PLANETS.find((planet) => planet.id === focusId) ?? null;

  return (
    <main className={styles.root} data-testid="galaxy-explorer" data-focus={focusId ?? ""}>
      <div
        className={`${styles.stage} ${ready ? styles.stageReady : ""}`}
        data-testid="galaxy-stage"
        data-ready={ready ? "true" : "false"}
      >
        <GalaxyScene
          arms={settings.arms}
          spin={settings.spin}
          speed={settings.speed}
          core={settings.core}
          mid={settings.mid}
          edge={settings.edge}
          focusId={focusId}
          placeLabel={placeLabel}
          onSelect={setFocusId}
          onReady={() => setReady(true)}
        />
        <div className={styles.labels}>
          {PLANETS.map((planet) => (
            <button
              key={planet.id}
              type="button"
              className={styles.planetLabel}
              data-testid={`planet-${planet.id}`}
              ref={(element) => {
                labels.current[planet.id] = element;
              }}
              onClick={() => setFocusId(planet.id)}
            >
              {planet.name}
            </button>
          ))}
        </div>
      </div>

      <header className={styles.title}>
        <p className={styles.kicker}>Interactive spiral galaxy</p>
        <h1>Galaxy Explorer</h1>
        <p className={styles.subtitle}>
          Tens of thousands of stars, turning slowly. Move your cursor to drift, then pick a planet to visit it.
        </p>
      </header>

      <ControlPanel settings={settings} onChange={updateGalaxySettings} onReset={resetGalaxySettings} />

      {focused ? <PlanetCard planet={focused} onClose={() => setFocusId(null)} /> : null}
    </main>
  );
}

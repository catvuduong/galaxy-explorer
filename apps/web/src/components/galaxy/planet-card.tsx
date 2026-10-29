"use client";

import type { Planet } from "./planets";
import styles from "./galaxy.module.css";

export function PlanetCard({ planet, onClose }: { planet: Planet; onClose: () => void }) {
  return (
    <section className={styles.card} data-testid="planet-card" aria-live="polite">
      <div className={styles.cardHeader}>
        <span className={styles.cardDot} style={{ background: planet.color }} aria-hidden="true" />
        <h2 data-testid="planet-card-name">{planet.name}</h2>
        <button type="button" className={styles.cardClose} aria-label="Close planet card" data-testid="planet-card-close" onClick={onClose}>
          ×
        </button>
      </div>
      <p>{planet.description}</p>
    </section>
  );
}

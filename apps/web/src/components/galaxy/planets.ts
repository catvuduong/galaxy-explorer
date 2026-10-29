export type Planet = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  color: string;
};

// Positions sit just above the disc, spread around the arms.
export const PLANETS: Planet[] = [
  {
    id: "ember",
    name: "Ember Prime",
    description:
      "A tidally locked basalt world. Its night side glows with lava rivers that can be seen from orbit.",
    position: [5.4, 1.1, -1.6],
    color: "#ff7a3d",
  },
  {
    id: "verdant",
    name: "Verdant Halo",
    description:
      "A ringed ocean planet whose shallow seas reflect the galactic core. Its rings are made of ice shards.",
    position: [-3.2, 0.9, 5.6],
    color: "#49d6a5",
  },
  {
    id: "glasswing",
    name: "Glasswing",
    description:
      "A crystalline moon that refracts starlight into rainbow arcs. Scientists think it grew from a comet.",
    position: [-6.8, -0.7, -3.1],
    color: "#7fd8ff",
  },
  {
    id: "nocturne",
    name: "Nocturne",
    description:
      "A cold violet gas giant with storms that last for centuries. It hums with radio static at dusk.",
    position: [2.1, 1.6, -7.4],
    color: "#b07dff",
  },
  {
    id: "lumen",
    name: "Lumen Reach",
    description:
      "An ice world lit from within by a pulsing blue core. Its frozen plains hold fossils of ancient stars.",
    position: [7.6, -0.9, 3.2],
    color: "#5f9dff",
  },
];

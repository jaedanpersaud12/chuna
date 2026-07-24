export const ADSENSE_CLIENT = "ca-pub-1162407702451762";

// Ad unit slot IDs. Create each unit in AdSense
// (Ads → By ad unit → Display ads), then paste its numeric slot id here.
// While a slot is empty, <AdUnit> renders a labelled placeholder in dev and
// nothing in production (so you never ship an empty ad box).
export const AD_SLOTS = {
  belowTuner: "", // TODO: paste the "below tuner" display-unit slot id
} as const;

export interface EquivalenceTier {
  nameSingular: string;
  namePlural: string;
  unitValue: number; // liters per unit or miles per unit
}

export const waterTiers: EquivalenceTier[] = [
  { nameSingular: "soda can", namePlural: "soda cans", unitValue: 0.355 },
  { nameSingular: "water bottle", namePlural: "water bottles", unitValue: 0.5 },
  { nameSingular: "gallon jug", namePlural: "gallon jugs", unitValue: 3.785 },
  { nameSingular: "bathtub", namePlural: "bathtubs", unitValue: 150 },
  { nameSingular: "backyard pool", namePlural: "backyard pools", unitValue: 50000 },
  { nameSingular: "olympic pool", namePlural: "olympic pools", unitValue: 2500000 },
];

export const milesTiers: EquivalenceTier[] = [
  { nameSingular: "football field length", namePlural: "football fields", unitValue: 0.0568 },
  { nameSingular: "5K run", namePlural: "5K runs", unitValue: 3.107 },
  { nameSingular: "marathon", namePlural: "marathons", unitValue: 26.2 },
  { nameSingular: "road trip", namePlural: "road trips", unitValue: 100 },
  { nameSingular: "cross-country drive", namePlural: "cross-country drives", unitValue: 2800 },
];

export function getBestEquivalence(value: number, tiers: EquivalenceTier[]) {
  if (value === 0) return { tier: tiers[0], count: 0 };
  
  // Find tiers where count is between 1 and 30
  const validTiers = tiers.map(tier => ({
    tier,
    count: value / tier.unitValue
  })).filter(t => t.count >= 1 && t.count <= 30);

  if (validTiers.length > 0) {
    // Prefer count closest to 8
    return validTiers.reduce((prev, curr) => 
      Math.abs(curr.count - 8) < Math.abs(prev.count - 8) ? curr : prev
    );
  }

  // If no tier gives 1-30, pick the one that brings count closest to the 1-30 range
  const allTiers = tiers.map(tier => ({ tier, count: value / tier.unitValue }));
  
  return allTiers.reduce((prev, curr) => {
    const distPrev = prev.count < 1 ? 1 - prev.count : (prev.count > 30 ? prev.count - 30 : 0);
    const distCurr = curr.count < 1 ? 1 - curr.count : (curr.count > 30 ? curr.count - 30 : 0);
    return distCurr < distPrev ? curr : prev;
  });
}

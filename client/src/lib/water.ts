import { AppSettings } from "./storage";

export function computeWater(tokens: number, intensity: AppSettings["waterIntensity"]): { ml: number, oz: number, bottles: number } {
  let rate = 2.0; // typical
  if (intensity === "low") rate = 0.5;
  if (intensity === "high") rate = 6.0;
  
  const ml = (tokens / 1000) * rate;
  const oz = ml / 29.5735;
  const bottles = oz / 16.9;
  
  return { ml, oz, bottles };
}

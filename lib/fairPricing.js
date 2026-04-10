import { MANDI_PRICES } from '@/lib/market-data';

const GRADE_MULTIPLIER = {
  A: 1.04,
  B: 1,
  C: 0.94,
};

export function getFairPricingInsight(order) {
  const normalizedCrop = order.crop?.toLowerCase().trim() || '';
  const matchedMarket = MANDI_PRICES.find(
  const matchedMarket = MANDI_PRICES.find(
    (entry) => entry.crop.toLowerCase() === order.crop?.toLowerCase()
  const normalizedCrop = order.crop?.toLowerCase().trim() || '';
  const matchedMarket = MANDI_PRICES.find(
    (entry) =>
      entry.crop.toLowerCase() === normalizedCrop ||
      entry.crop.toLowerCase().includes(normalizedCrop) ||
      normalizedCrop.includes(entry.crop.toLowerCase())
  );

  const mandiAvg = matchedMarket?.price || order.agreedPrice || 0;
  const grade = (order.grade || 'B').toUpperCase();
  const qualityFactor = GRADE_MULTIPLIER[grade] || 1;

  const transportPerQ = mandiAvg > 2000 ? 120 : 70;
  const handlingPerQ = Math.max(20, Math.round(mandiAvg * 0.01));
  const qualityAdjusted = Math.round(mandiAvg * qualityFactor);
  const recommended = Math.max(1, Math.round(qualityAdjusted - transportPerQ - handlingPerQ));

  const lower = Math.round(recommended * 0.95);
  const upper = Math.round(recommended * 1.05);
  const agreed = order.agreedPrice || recommended;
  const differencePct = Number((((agreed - recommended) / recommended) * 100).toFixed(1));

  const dealScoreRaw = 100 - Math.min(40, Math.abs(differencePct) * 1.8);
  const dealScore = Math.max(45, Math.round(dealScoreRaw));
  const verdict =
    differencePct > 5
      ? 'Above fair range (premium)'
      : differencePct < -5
        ? 'Below fair range'
        : 'Within fair range';

  return {
    mandiAvg,
    mandiMarket: matchedMarket?.market || 'Regional benchmark',
    grade,
    qualityFactor,
    transportPerQ,
    handlingPerQ,
    recommended,
    fairRange: { min: lower, max: upper },
    differencePct,
    dealScore,
    verdict,
  };
}

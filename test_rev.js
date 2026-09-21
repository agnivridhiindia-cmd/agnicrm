const { calculateRevenueMetrics } = require('./src/utils/revenueCalculator.js');
// Wait, revenueCalculator.js uses ES modules syntax `export function`.
// We can't easily require it in node without Babel or renaming to .mjs.

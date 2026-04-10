// lib/analytics-service.js

// Delays response slightly to visually mimic network requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const farmerAPI = {
  getPriceTrends: async (timeRange = '7days') => {
    await delay(300);
    return {
      prices: {
        wheat: { current: 2450, previous: 2270, change: 7.9 },
        tomato: { current: 1800, previous: 2100, change: -14.3 },
        rice: { current: 3200, previous: 3100, change: 3.2 }
      }
    };
  },
  
  getProfitCalculator: async (productionCost, sellingPrice, quantity) => {
    await delay(200);
    const revenue = sellingPrice * quantity;
    const netProfit = revenue - productionCost;
    return {
      netProfit,
      profitMargin: ((netProfit / revenue) * 100).toFixed(1),
      roi: ((netProfit / productionCost) * 100).toFixed(1)
    };
  },

  getDemand: async (region = 'maharashtra', timeRange = '7days') => {
    await delay(400);
    return {
      demand: [
        { crop: "Tomato", demandLevel: "High", requests: 8, insight: "Perfect time to sell" },
        { crop: "Wheat", demandLevel: "Medium", requests: 5, insight: "Steady demand" },
        { crop: "Rice", demandLevel: "Low", requests: 2, insight: "Wait for better price" }
      ]
    };
  },

  getDemandForecast: async (weeks = 4) => {
    await delay(250);
    return {
      horizonWeeks: weeks,
      forecasts: [
        { crop: 'Tomato', expectedDemand: 'Very High', expectedPrice: 1920, confidence: 0.82, driver: 'Festival + low arrivals' },
        { crop: 'Wheat', expectedDemand: 'Medium', expectedPrice: 2480, confidence: 0.74, driver: 'Stable procurement contracts' },
        { crop: 'Rice', expectedDemand: 'Low', expectedPrice: 3120, confidence: 0.68, driver: 'Inventory currently high' },
      ],
    };
  },

  getSalesPerformance: async (timeRange = '30days') => {
    await delay(350);
    return {
      sales: {
        totalSales: 85000,
        revenue: 185000,
        ordersCompleted: 42,
        successRate: 0.94
      }
    };
  },

  getOrdersTracking: async () => {
    await delay(250);
    return {
      orders: [
        { id: 1, crop: "Wheat", quantity: 100, status: "Delivered", price: 245000, deliveryTime: 1.5, date: "2025-04-05" },
        { id: 2, crop: "Tomato", quantity: 50, status: "In Transit", expectedDelivery: "2025-04-10" }
      ],
      avgDelivery: 1.8,
      delays: 2
    };
  },

  getCropPerformance: async (season = 'current') => {
    await delay(300);
    return {
      crops: [
        { crop: "Wheat", profit: 52000, roi: 28, volume: 200 },
        { crop: "Tomato", profit: 38000, roi: 18, volume: 150 },
        { crop: "Rice", profit: 45000, roi: 22, volume: 180 }
      ]
    };
  },

  getPriceTransparency: async (crop = 'wheat', sellingPrice = 2450) => {
    await delay(200);
    const marketPrice = 2270;
    const diff = (((sellingPrice - marketPrice) / marketPrice) * 100).toFixed(1);
    
    let position = 'fair';
    let recommendation = "You're competitive. Consider this price as standard.";
    
    if (diff > 5) {
      position = 'premium';
      recommendation = "Selling at a premium. Ensure high quality.";
    } else if (diff < -5) {
      position = 'discount';
      recommendation = "You're selling below market rate. Try increasing your price.";
    }

    return { yourPrice: sellingPrice, marketPrice, difference: diff, position, recommendation };
  }
};

export const buyerAPI = {
  getPriceComparison: async (crop = 'wheat', region = 'maharashtra') => {
    await delay(400);
    return {
      comparison: [
        { farmer: "Farmer A", price: 2200, quality: "A", delivery: "2 days", rating: 4.8 },
        { farmer: "Farmer B", price: 2450, quality: "B", delivery: "3 days", rating: 4.2 },
        { farmer: "Farmer C", price: 2100, quality: "A", delivery: "1 day", rating: 4.5 }
      ],
      savings: { cheapest: 2100, expensive: 2450, save: 350 }
    };
  },

  getPriceHistory: async (crop = 'wheat', days = 30) => {
    await delay(350);
    return {
      priceHistory: [
        { date: "2025-03-15", price: 2500 },
        { date: "2025-03-22", price: 2380 },
        { date: "2025-03-29", price: 2250 },
        { date: "2025-04-05", price: 2180 }
      ],
      trend: "falling",
      recommendation: "Price dropping 12%. Recommendation: Wait 3 days",
      forecast: { expectedPrice: 2050, confidence: 0.75 }
    };
  },

  getPurchaseAnalytics: async (timeRange = '30days') => {
    await delay(250);
    return {
      purchases: {
        totalOrders: 28,
        totalSpending: 425000,
        avgOrderValue: 15178,
        spendingTrend: 40
      }
    };
  },

  getFarmerPerformance: async (crop = 'wheat') => {
    await delay(300);
    return {
      farmers: [
        { farmer: "Farmer X", rating: 4.8, deliveryTime: 1.5, quality: "A", reviews: 45 },
        { farmer: "Farmer Y", rating: 4.2, deliveryTime: 2.8, quality: "B", reviews: 32 },
        { farmer: "Farmer Z", rating: 4.5, deliveryTime: 2.0, quality: "A", reviews: 38 }
      ]
    };
  },

  getDeliveryAnalytics: async (timeRange = '30days') => {
    await delay(300);
    return {
      delivery: {
        onTimePercent: 92,
        avgDeliveryTime: 2.1,
        delays: 2,
        reliabilityScore: 0.92
      }
    };
  },

  getNearbyFarmers: async (lat = 19.5, lng = 72.8, radius = '15km') => {
    await delay(450);
    return {
      farmers: [
        { farmer: "Farmer A", distance: "3 km", transportCost: 90 },
        { farmer: "Farmer C", distance: "5 km", transportCost: 150 },
        { farmer: "Farmer B", distance: "8 km", transportCost: 240 }
      ]
    };
  }
};

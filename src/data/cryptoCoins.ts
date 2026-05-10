export const DEPOSIT_LIMITS = {
  min: 100,   // ₹100 minimum
  max: 5000,  // ₹5,000 maximum per transaction
};

export const WITHDRAWAL_LIMITS = {
  min: 110,     // ₹110 minimum
  maxPerDay: 5000, // ₹5,000 per 24 hours
};

// Keep minimal exports for compatibility
export const cryptoCoins: any[] = [];
export const withdrawalCoin: any = null;
export const getDepositAddress = (symbol: string): string => "";
export const getMemo = (symbol: string): string => "";
export const requiresMemo = (symbol: string): boolean => false;
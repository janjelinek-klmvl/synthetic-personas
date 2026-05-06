export const CREDITS_BALANCE = 2480
export const CREDITS_MONTHLY_ALLOWANCE = 2000
export const CREDITS_USED_THIS_MONTH = 520
export const CREDITS_CARRIED_OVER = CREDITS_BALANCE - (CREDITS_MONTHLY_ALLOWANCE - CREDITS_USED_THIS_MONTH)
export const CREDITS_RENEWAL_DATE = 'Apr 1, 2026'

// Per-action costs
export const COST_RUN_TEST = 100       // per persona
export const COST_ADD_PERSONA = 20000  // one-time

// Top-up packages
export const TOPUP_PACKAGES = [
  { credits: 1000,  price: 100, saving: null },
  { credits: 5500,  price: 450, saving: 10 },
  { credits: 12000, price: 800, saving: 20 },
] as const

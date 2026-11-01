export interface DemoUsageFixture {
  hoursUsed: number;
  totalAllowanceHours: number;
  label: string;
}

/**
 * Centralized demo usage fixture.
 * Clearly identified as demo allowance; not connected to real billing.
 */
export const DEMO_USAGE: DemoUsageFixture = {
  hoursUsed: 14.2,
  totalAllowanceHours: 20,
  label: 'Demo usage',
};

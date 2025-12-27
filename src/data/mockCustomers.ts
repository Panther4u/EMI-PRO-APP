import { Customer, AdminStats } from '@/types/customer';

// Fresh start - no dummy data
export const mockCustomers: Customer[] = [];

export const getAdminStats = (customers: Customer[]): AdminStats => {
  const lockedDevices = customers.filter((c) => c.isLocked).length;
  const totalEmiValue = customers.reduce((sum, c) => sum + c.emiAmount * (c.totalEmis - c.paidEmis), 0);
  const collectedAmount = customers.reduce((sum, c) => sum + c.emiAmount * c.paidEmis, 0);
  const pendingEmis = customers.filter((c) => c.paidEmis < c.totalEmis).length;

  return {
    totalCustomers: customers.length,
    lockedDevices,
    unlockedDevices: customers.length - lockedDevices,
    pendingEmis,
    totalEmiValue,
    collectedAmount,
  };
};

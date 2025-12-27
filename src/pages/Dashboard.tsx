import { useState } from 'react';
import {
  Users,
  Lock,
  Unlock,
  CreditCard,
  ChevronRight,
  TrendingUp,
  Search,
  AlertTriangle
} from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { CustomerCard } from '@/components/CustomerCard';

import { getAdminStats } from '@/data/mockCustomers';
import { Customer } from '@/types/customer';
import { useDevice } from '@/context/DeviceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { customers, updateCustomer } = useDevice();
  const [searchQuery, setSearchQuery] = useState('');

  const stats = getAdminStats(customers);
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.imei1.includes(searchQuery)
  );

  const handleLockToggle = async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    const newLockState = !customer.isLocked;

    await updateCustomer(id, {
      isLocked: newLockState,
      lockHistory: [
        ...customer.lockHistory,
        {
          id: Date.now().toString(),
          action: newLockState ? 'locked' : 'unlocked',
          timestamp: new Date().toISOString(),
          reason: newLockState ? 'Manual lock by admin' : 'Manual unlock by admin',
        }
      ]
    });
  };

  const handleEdit = (id: string) => {
    navigate(`/customers/${id}/edit`);
  };

  const handleCollectEmi = async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (!customer || customer.paidEmis >= customer.totalEmis) return;

    await updateCustomer(id, {
      paidEmis: customer.paidEmis + 1
    });
  };

  const handleViewDetails = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold opacity-70 italic">Device Management Node</p>
      </div>

      {/* Stats Grid - 2x2 layout */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          title="Total Customers"
          value={stats.totalCustomers}
          subtitle="Registered Active"
          icon={Users}
          variant="primary"
        />
        <StatsCard
          title="Locked Devices"
          value={stats.lockedDevices}
          subtitle="Needs Intervention"
          icon={Lock}
          variant="danger"
        />
        <StatsCard
          title="Active Devices"
          value={stats.unlockedDevices}
          subtitle="Status: Healthy"
          icon={Unlock}
          variant="success"
        />
        <StatsCard
          title="EMI Portfolio"
          value={`₹${(stats.totalEmiValue / 1000).toFixed(0)}K`}
          subtitle="Outstanding Rec."
          icon={CreditCard}
          variant="warning"
        />
      </div>

      {/* Collection Stats & Alerts - Single Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Collection</h3>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Collected</span>
              <span className="font-semibold text-foreground">
                ₹{stats.collectedAmount.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full"
                style={{
                  width: `${(stats.collectedAmount / (stats.collectedAmount + stats.totalEmiValue)) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Alerts</h3>
            <p className="text-xs text-muted-foreground">0 Critical Issues</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
        </div>
      </div>

      {/* Customer Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Recent Customers</h2>
          <a href="/customers" className="text-sm text-primary hover:underline">View all</a>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {customers.slice(0, 6).map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onLockToggle={handleLockToggle}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onCollectEmi={handleCollectEmi}
            />
          ))}
        </div>
      </div>


    </div>
  );
};

export default Dashboard;

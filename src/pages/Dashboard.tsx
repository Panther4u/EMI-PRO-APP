import { useState } from 'react';
import {
  Users,
  Lock,
  Smartphone,
  QrCode,
  MapPin,
  Settings,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Plus,
  Search
} from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { getAdminStats } from '@/data/mockCustomers';
import { useDevice } from '@/context/DeviceContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Quick Action Card Component
const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  color = 'primary',
  count
}: {
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  count?: number;
}) => {
  const colorClasses = {
    primary: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40',
    success: 'from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40',
    warning: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 hover:border-yellow-500/40',
    danger: 'from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-500/40',
    info: 'from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40'
  };

  const iconColorClasses = {
    primary: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
    info: 'text-purple-500'
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative group p-6 rounded-2xl border-2 bg-gradient-to-br transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]',
        'text-left w-full',
        colorClasses[color]
      )}
    >
      {/* Count Badge */}
      {count !== undefined && count > 0 && (
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
          {count}
        </div>
      )}

      {/* Icon */}
      <div className="mb-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          'bg-background/50 backdrop-blur-sm',
          'group-hover:scale-110 transition-transform duration-300'
        )}>
          <Icon className={cn('w-6 h-6', iconColorClasses[color])} />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h3 className="font-bold text-foreground text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Arrow */}
      <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
    </button>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { customers } = useDevice();
  const stats = getAdminStats(customers);

  // Calculate device count
  const enrolledDevices = customers.filter(c => c.isEnrolled).length;
  const lockedDevices = customers.filter(c => c.isLocked).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          SecureFinance Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage customers, devices, and EMI collections
        </p>
      </div>

      {/* Stats Grid - 4 columns on desktop, 2 on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Customers"
          value={stats.totalCustomers}
          subtitle="Registered"
          icon={Users}
          variant="primary"
        />
        <StatsCard
          title="Locked Devices"
          value={stats.lockedDevices}
          subtitle="Needs Action"
          icon={Lock}
          variant="danger"
        />
        <StatsCard
          title="Active Devices"
          value={stats.unlockedDevices}
          subtitle="Healthy"
          icon={Smartphone}
          variant="success"
        />
        <StatsCard
          title="EMI Portfolio"
          value={`₹${(stats.totalEmiValue / 1000).toFixed(0)}K`}
          subtitle="Outstanding"
          icon={CreditCard}
          variant="warning"
        />
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* View All Customers */}
          <QuickActionCard
            title="Customers"
            description="View and manage all customers"
            icon={Users}
            color="primary"
            count={stats.totalCustomers}
            onClick={() => navigate('/customers')}
          />

          {/* Add New Customer */}
          <QuickActionCard
            title="Add Customer"
            description="Register new customer"
            icon={Plus}
            color="success"
            onClick={() => navigate('/customers?action=add')}
          />

          {/* View Devices */}
          <QuickActionCard
            title="Devices"
            description="View all enrolled devices"
            icon={Smartphone}
            color="info"
            count={enrolledDevices}
            onClick={() => navigate('/customers?filter=enrolled')}
          />

          {/* Generate QR Code */}
          <QuickActionCard
            title="Generate QR"
            description="Create provisioning QR code"
            icon={QrCode}
            color="primary"
            onClick={() => navigate('/generate-qr')}
          />

          {/* Lock Control */}
          <QuickActionCard
            title="Lock Control"
            description="Manage device locks"
            icon={Lock}
            color="danger"
            count={lockedDevices}
            onClick={() => navigate('/lock-control')}
          />

          {/* Location Tracking */}
          <QuickActionCard
            title="Location"
            description="Track device locations"
            icon={MapPin}
            color="warning"
            onClick={() => navigate('/location')}
          />

          {/* EMI Collection */}
          <QuickActionCard
            title="Collections"
            description="Manage EMI payments"
            icon={CreditCard}
            color="success"
            onClick={() => navigate('/customers?tab=collections')}
          />

          {/* Settings */}
          <QuickActionCard
            title="Settings"
            description="App configuration"
            icon={Settings}
            color="info"
            onClick={() => navigate('/settings')}
          />
        </div>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Collection Status</h3>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Collected</span>
              <span className="font-bold text-foreground text-lg">
                ₹{stats.collectedAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="font-bold text-warning text-lg">
                ₹{stats.totalEmiValue.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{
                  width: `${(stats.collectedAmount / (stats.collectedAmount + stats.totalEmiValue)) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">System Alerts</h3>
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Locked Devices</span>
              <span className="font-bold text-destructive text-lg">
                {stats.lockedDevices}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overdue Payments</span>
              <span className="font-bold text-warning text-lg">
                {customers.filter(c => c.paidEmis < c.totalEmis && c.isLocked).length}
              </span>
            </div>
            <button
              onClick={() => navigate('/customers?filter=locked')}
              className="w-full mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              View All Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Customers</h3>
          <button
            onClick={() => navigate('/customers')}
            className="text-sm text-primary hover:underline font-medium"
          >
            View All
          </button>
        </div>
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-4">No customers yet</p>
            <button
              onClick={() => navigate('/customers?action=add')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Add First Customer
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {customers.slice(0, 5).map((customer) => (
              <button
                key={customer.id}
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
                    customer.isLocked ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
                  )}>
                    {customer.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.phoneNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {customer.paidEmis}/{customer.totalEmis} EMIs
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {customer.isLocked ? 'Locked' : 'Active'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

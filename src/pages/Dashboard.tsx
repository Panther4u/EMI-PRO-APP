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

// Quick ActionCard Component
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
        'relative group p-3 sm:p-6 rounded-xl sm:rounded-2xl border bg-gradient-to-br transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]',
        'text-left w-full h-full flex flex-col justify-between gap-2 sm:gap-4',
        colorClasses[color]
      )}
    >
      {/* Count Badge */}
      {count !== undefined && count > 0 && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full z-10 shadow-sm">
          {count}
        </div>
      )}

      {/* Icon */}
      <div>
        <div className={cn(
          'w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center',
          'bg-background/80 backdrop-blur-sm shadow-sm',
          'group-hover:scale-110 transition-transform duration-300'
        )}>
          <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', iconColorClasses[color])} />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-0.5 sm:space-y-1">
        <h3 className="font-bold text-foreground text-sm sm:text-lg leading-tight line-clamp-1">{title}</h3>
        <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2 leading-tight opacity-90">{description}</p>
      </div>

      {/* Arrow - Hidden on mobile, distinct on desktop */}
      <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/50 group-hover:translate-x-1 transition-transform opacity-0 sm:opacity-100 group-hover:opacity-100" />
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
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
      {/* Header */}
      <div className="space-y-1 px-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          SecureFinance
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage customers, devices, and EMI collections
        </p>
      </div>

      {/* Stats Grid - 4 columns on desktop, 2 on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 px-1">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* View All Customers */}
          <QuickActionCard
            title="Customers"
            description="Manage customers"
            icon={Users}
            color="primary"
            count={stats.totalCustomers}
            onClick={() => navigate('/customers')}
          />

          {/* Add New Customer */}
          <QuickActionCard
            title="Add Customer"
            description="Register new"
            icon={Plus}
            color="success"
            onClick={() => navigate('/customers?action=add')}
          />

          {/* View Devices */}
          <QuickActionCard
            title="Devices"
            description="All enrolled devices"
            icon={Smartphone}
            color="info"
            count={enrolledDevices}
            onClick={() => navigate('/customers?filter=enrolled')}
          />

          {/* Generate QR Code */}
          <QuickActionCard
            title="Generate QR"
            description="Create setup QR"
            icon={QrCode}
            color="primary"
            onClick={() => navigate('/generate-qr')}
          />

          {/* Lock Control */}
          <QuickActionCard
            title="Lock Control"
            description="Manage locks"
            icon={Lock}
            color="danger"
            count={lockedDevices}
            onClick={() => navigate('/lock-control')}
          />

          {/* Location Tracking */}
          <QuickActionCard
            title="Location"
            description="Track devices"
            icon={MapPin}
            color="warning"
            onClick={() => navigate('/location')}
          />

          {/* EMI Collection */}
          <QuickActionCard
            title="Collections"
            description="EMI payments"
            icon={CreditCard}
            color="success"
            onClick={() => navigate('/customers?tab=collections')}
          />

          {/* Settings */}
          <QuickActionCard
            title="Settings"
            description="Configuration"
            icon={Settings}
            color="info"
            onClick={() => navigate('/settings')}
          />
        </div>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Collection Status</h3>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Collected</span>
              <span className="font-bold text-foreground text-base sm:text-lg">
                ₹{stats.collectedAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Pending</span>
              <span className="font-bold text-warning text-base sm:text-lg">
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

        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">System Alerts</h3>
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Locked Devices</span>
              <span className="font-bold text-destructive text-base sm:text-lg">
                {stats.lockedDevices}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Overdue Payments</span>
              <span className="font-bold text-warning text-base sm:text-lg">
                {customers.filter(c => c.paidEmis < c.totalEmis && c.isLocked).length}
              </span>
            </div>
            <button
              onClick={() => navigate('/customers?filter=locked')}
              className="w-full mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-xs sm:text-sm hover:bg-primary/90 transition-colors"
            >
              View All Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Recent Customers</h3>
          <button
            onClick={() => navigate('/customers')}
            className="text-xs sm:text-sm text-primary hover:underline font-medium"
          >
            View All
          </button>
        </div>
        {customers.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm sm:text-base text-muted-foreground mb-4">No customers yet</p>
            <button
              onClick={() => navigate('/customers?action=add')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Add First Customer
            </button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {customers.slice(0, 5).map((customer) => (
              <button
                key={customer.id}
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={cn(
                    'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg',
                    customer.isLocked ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
                  )}>
                    {customer.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm sm:text-base">{customer.name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{customer.phoneNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      {customer.paidEmis}/{customer.totalEmis} EMIs
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {customer.isLocked ? 'Locked' : 'Active'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
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

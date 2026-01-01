import { useState } from 'react';
import {
  Smartphone,
  Tablet,
  Apple,
  ChevronRight,
  Lock,
  Trash2,
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { getAdminStats } from '@/data/mockCustomers';
import { useDevice } from '@/context/DeviceContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

// Device Type Card for QR Generation selection
const DeviceTypeCard = ({
  title,
  description,
  subtitle,
  icon: Icon,
  color,
  onClick
}: {
  title: string;
  description: string;
  subtitle: string;
  icon: any;
  color: 'green' | 'blue' | 'gray';
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "p-4 rounded-xl border transition-all text-left w-full group hover:scale-[1.01] active:scale-[0.98]",
      "hover:shadow-md",
      color === 'green' && 'border-green-500/30 bg-green-500/5',
      color === 'blue' && 'border-blue-500/30 bg-blue-500/5',
      color === 'gray' && 'border-gray-500/30 bg-gray-500/5',
    )}
  >
    <div className="flex items-start gap-3">
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
        color === 'green' && 'bg-green-500/20',
        color === 'blue' && 'bg-blue-500/20',
        color === 'gray' && 'bg-gray-500/20',
      )}>
        <Icon className={cn(
          "w-5 h-5",
          color === 'green' && 'text-green-500',
          color === 'blue' && 'text-blue-500',
          color === 'gray' && 'text-gray-500',
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm text-foreground truncate">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-tight">{description}</p>
        <p className={cn(
          "text-[10px] font-bold mt-1.5 uppercase tracking-wider",
          color === 'green' && 'text-green-500',
          color === 'blue' && 'text-blue-500',
          color === 'gray' && 'text-gray-500',
        )}>{subtitle}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform mt-3" />
    </div>
  </button>
);

// Device Card Component for listing
const DeviceCard = ({
  customer,
  onLock,
  onUnlock,
  onRemove,
  onView
}: {
  customer: any;
  onLock: () => void;
  onUnlock: () => void;
  onRemove: () => void;
  onView: () => void;
}) => (
  <div className={cn(
    "p-3 rounded-xl border transition-all cursor-pointer hover:border-primary/40 active:scale-[0.99]",
    customer.isLocked
      ? "bg-red-500/5 border-red-500/20"
      : customer.deviceStatus?.status === 'REMOVED' || customer.deviceStatus?.status === 'removed'
        ? "bg-gray-500/5 border-gray-500/20 opacity-60"
        : "bg-card border-border"
  )} onClick={onView}>
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden",
        customer.isLocked ? "bg-red-500/20 text-red-500" : "bg-primary/20 text-primary"
      )}>
        {customer.photoUrl ? (
          <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover" />
        ) : (
          customer.name?.charAt(0) || '?'
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="font-semibold text-sm text-foreground truncate">{customer.name}</h4>
          <Badge className={cn(
            "text-[9px] px-1.5 py-0 h-4 uppercase tracking-wider",
            customer.isLocked ? "bg-red-500" :
              (customer.deviceStatus?.status === 'REMOVED' || customer.deviceStatus?.status === 'removed') ? "bg-gray-500" : "bg-green-500"
          )}>
            {customer.isLocked ? 'Locked' :
              (customer.deviceStatus?.status === 'REMOVED' || customer.deviceStatus?.status === 'removed') ? 'Removed' : 'Active'}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{customer.phoneNo}</p>
        <p className="text-[10px] text-muted-foreground truncate opacity-70 font-mono">
          {customer.mobileModel || customer.imei1 || 'No Device'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        {customer.isLocked ? (
          <Button size="icon" variant="outline" onClick={onUnlock} className="h-7 w-7 rounded-lg hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50" title="Unlock">
            <Lock className="w-3.5 h-3.5 text-green-500" />
          </Button>
        ) : (
          <Button size="icon" variant="outline" onClick={onLock} className="h-7 w-7 rounded-lg hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50" title="Lock">
            <Lock className="w-3.5 h-3.5 text-red-500" />
          </Button>
        )}
        {(customer.deviceStatus?.status !== 'REMOVED' && customer.deviceStatus?.status !== 'removed') && (
          <Button size="icon" variant="outline" onClick={onRemove} className="h-7 w-7 rounded-lg hover:bg-gray-500/10 hover:text-gray-500 hover:border-gray-500/50" title="Remove">
            <Trash2 className="w-3.5 h-3.5 text-gray-500" />
          </Button>
        )}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { customers, refreshCustomers, toggleLock } = useDevice();
  const stats = getAdminStats(customers);

  // Filter state
  const [filter, setFilter] = useState<'all' | 'active' | 'locked' | 'removed'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCustomers();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Calculate counts - Use explicit string check to valid TypeScript enum complaints if needed, or simply loose check
  // Using explicit casts or string conversions to handle potential type mismatches safely
  const activeDevices = (customers || []).filter(c => !c.isLocked && (c.deviceStatus?.status as string) !== 'REMOVED').length;
  const lockedDevices = (customers || []).filter(c => c.isLocked).length;
  // Handle 'REMOVED' case-insensitively just in case
  const removedDevices = (customers || []).filter(c => (c.deviceStatus?.status as string) === 'REMOVED' || (c.deviceStatus?.status as string) === 'removed').length;

  // Filtered customers
  const filteredCustomers = (customers || []).filter(c => {
    const status = c.deviceStatus?.status as string;
    const isRemoved = status === 'REMOVED' || status === 'removed';

    if (filter === 'all') return true;
    if (filter === 'active') return !c.isLocked && !isRemoved;
    if (filter === 'locked') return c.isLocked;
    if (filter === 'removed') return isRemoved;
    return true;
  });

  const handleLock = async (customerId: string) => {
    try {
      await toggleLock(customerId, true, 'Locked via Dashboard');
      toast.success('Device locked');
    } catch (e) {
      toast.error('Failed to lock device');
    }
  };

  const handleUnlock = async (customerId: string) => {
    try {
      await toggleLock(customerId, false, 'Unlocked via Dashboard');
      toast.success('Device unlocked');
    } catch (e) {
      toast.error('Failed to unlock device');
    }
  };

  const handleRemove = async (customerId: string) => {
    if (!confirm('Remove this device? It will show as "Removed" status.')) return;

    try {
      await fetch(`${API_BASE_URL}/api/customers/${customerId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'remove' })
      });

      toast.success('Device removed');
      refreshCustomers();
    } catch (e) {
      toast.error('Failed to remove device');
    }
  };

  // Navigate to Add Customer with device type
  const goToAddCustomer = (type: 'ANDROID_NEW' | 'ANDROID_EXISTING' | 'IOS') => {
    navigate(`/add-customer?type=${type}`);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Manage your devices</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 text-xs">
          <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Device Type Selection - Main CTA */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-bold">Generate Device QR</CardTitle>
          <CardDescription className="text-xs">Tap below to add new device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4">
          <DeviceTypeCard
            title="Fresh Android"
            description="Factory reset → Tap 6 times → Scan"
            subtitle="New Devices"
            icon={Smartphone}
            color="green"
            onClick={() => goToAddCustomer('ANDROID_NEW')}
          />

          <DeviceTypeCard
            title="Used Android"
            description="Install APK → Open → Scan"
            subtitle="Existing Data"
            icon={Tablet}
            color="blue"
            onClick={() => goToAddCustomer('ANDROID_EXISTING')}
          />

          <DeviceTypeCard
            title="iPhone / iPad"
            description="Install App → Scan"
            subtitle="iOS Devices"
            icon={Apple}
            color="gray"
            onClick={() => goToAddCustomer('IOS')}
          />
        </CardContent>
      </Card>

      {/* Stats Cards - 2x2 Grid for Mobile */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "p-3 rounded-xl border text-center transition-all",
            filter === 'all' ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"
          )}
        >
          <p className="text-xl font-bold text-foreground">{customers.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total</p>
        </button>
        <button
          onClick={() => setFilter('active')}
          className={cn(
            "p-3 rounded-xl border text-center transition-all",
            filter === 'active' ? "border-green-500 bg-green-500/5 shadow-sm" : "border-border bg-card"
          )}
        >
          <p className="text-xl font-bold text-green-600">{activeDevices}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Active</p>
        </button>
        <button
          onClick={() => setFilter('locked')}
          className={cn(
            "p-3 rounded-xl border text-center transition-all",
            filter === 'locked' ? "border-red-500 bg-red-500/5 shadow-sm" : "border-border bg-card"
          )}
        >
          <p className="text-xl font-bold text-red-600">{lockedDevices}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Locked</p>
        </button>
        <button
          onClick={() => setFilter('removed')}
          className={cn(
            "p-3 rounded-xl border text-center transition-all",
            filter === 'removed' ? "border-gray-500 bg-gray-500/5 shadow-sm" : "border-border bg-card"
          )}
        >
          <p className="text-xl font-bold text-gray-500">{removedDevices}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Removed</p>
        </button>
      </div>

      {/* Device List Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Smartphone className="w-4 h-4 text-primary" />
              Devices
            </CardTitle>
            <Badge variant="outline" className="text-xs h-5 px-1.5">{filteredCustomers.length}</Badge>
          </div>
          <CardDescription className="text-xs">
            {filter === 'all' && 'All registered devices'}
            {filter === 'active' && 'Active devices only'}
            {filter === 'locked' && 'Locked devices only'}
            {filter === 'removed' && 'Removed devices only'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Smartphone className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-xs text-muted-foreground">No devices found</p>
              <Button className="mt-3 h-8 text-xs" onClick={() => goToAddCustomer('ANDROID_NEW')}>
                Add First Device
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {filteredCustomers.map((customer) => (
                <DeviceCard
                  key={customer.id}
                  customer={customer}
                  onLock={() => handleLock(customer.id)}
                  onUnlock={() => handleUnlock(customer.id)}
                  onRemove={() => handleRemove(customer.id)}
                  onView={() => navigate(`/customers/${customer.id}`)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-4 px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-semibold">Collection</span>
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-muted-foreground">Collected</span>
                <span className="font-bold text-sm text-green-500">₹{stats.collectedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-muted-foreground">Pending</span>
                <span className="font-bold text-sm text-yellow-500">₹{stats.totalEmiValue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-4 px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-semibold">Alerts</span>
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-muted-foreground">Locked</span>
                <span className="font-bold text-sm text-red-500">{lockedDevices}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-muted-foreground">Overdue</span>
                <span className="font-bold text-sm text-yellow-500">
                  {customers.filter(c => c.paidEmis < c.totalEmis && c.isLocked).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

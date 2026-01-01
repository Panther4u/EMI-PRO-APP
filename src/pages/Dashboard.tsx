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
      "p-6 rounded-2xl border-2 transition-all text-left w-full group hover:scale-[1.02] active:scale-[0.98]",
      "hover:shadow-lg",
      color === 'green' && 'border-green-500/30 hover:border-green-500 bg-gradient-to-br from-green-500/10 to-green-600/5',
      color === 'blue' && 'border-blue-500/30 hover:border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-600/5',
      color === 'gray' && 'border-gray-500/30 hover:border-gray-500 bg-gradient-to-br from-gray-500/10 to-gray-600/5',
    )}
  >
    <div className="flex items-start gap-4">
      <div className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center",
        color === 'green' && 'bg-green-500/20',
        color === 'blue' && 'bg-blue-500/20',
        color === 'gray' && 'bg-gray-500/20',
      )}>
        <Icon className={cn(
          "w-7 h-7",
          color === 'green' && 'text-green-500',
          color === 'blue' && 'text-blue-500',
          color === 'gray' && 'text-gray-500',
        )} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-lg text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        <p className={cn(
          "text-xs font-semibold mt-2",
          color === 'green' && 'text-green-500',
          color === 'blue' && 'text-blue-500',
          color === 'gray' && 'text-gray-500',
        )}>{subtitle}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
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
    "p-4 rounded-xl border transition-all",
    customer.isLocked
      ? "bg-red-500/5 border-red-500/20"
      : customer.deviceStatus?.status === 'REMOVED'
        ? "bg-gray-500/5 border-gray-500/20 opacity-60"
        : "bg-card border-border hover:border-primary/30"
  )}>
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 overflow-hidden",
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
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-foreground truncate">{customer.name}</h4>
          <Badge className={cn(
            "text-[10px]",
            customer.isLocked ? "bg-red-500" :
              customer.deviceStatus?.status === 'REMOVED' ? "bg-gray-500" : "bg-green-500"
          )}>
            {customer.isLocked ? 'Locked' :
              customer.deviceStatus?.status === 'REMOVED' ? 'Removed' : 'Active'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{customer.phoneNo}</p>
        <p className="text-xs text-muted-foreground truncate">
          {customer.mobileModel || customer.imei1}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        {customer.isLocked ? (
          <Button size="icon" variant="outline" onClick={onUnlock} className="h-8 w-8" title="Unlock">
            <Lock className="w-3 h-3 text-green-500" />
          </Button>
        ) : (
          <Button size="icon" variant="outline" onClick={onLock} className="h-8 w-8" title="Lock">
            <Lock className="w-3 h-3 text-red-500" />
          </Button>
        )}
        <Button size="icon" variant="outline" onClick={onRemove} className="h-8 w-8" title="Remove">
          <Trash2 className="w-3 h-3 text-gray-500" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onView} className="h-8 w-8" title="View">
          <ChevronRight className="w-4 h-4" />
        </Button>
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

  // Calculate counts
  const activeDevices = customers.filter(c => !c.isLocked && c.deviceStatus?.status !== 'REMOVED').length;
  const lockedDevices = customers.filter(c => c.isLocked).length;
  const removedDevices = customers.filter(c => c.deviceStatus?.status === 'REMOVED').length;

  // Filtered customers
  const filteredCustomers = customers.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'active') return !c.isLocked && c.deviceStatus?.status !== 'REMOVED';
    if (filter === 'locked') return c.isLocked;
    if (filter === 'removed') return c.deviceStatus?.status === 'REMOVED';
    return true;
  });

  const handleLock = async (customerId: string) => {
    try {
      await toggleLock(customerId);
      toast.success('Device locked');
    } catch (e) {
      toast.error('Failed to lock device');
    }
  };

  const handleUnlock = async (customerId: string) => {
    try {
      await toggleLock(customerId);
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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Select device type to add new customer</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshCustomers}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Device Type Selection - Main CTA */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Generate Device QR</CardTitle>
          <CardDescription>Select device type to add new customer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <DeviceTypeCard
            title="Fresh Android Device"
            description="Factory reset device. Scan QR on welcome screen (tap 6 times)."
            subtitle="Recommended for new devices"
            icon={Smartphone}
            color="green"
            onClick={() => goToAddCustomer('ANDROID_NEW')}
          />

          <DeviceTypeCard
            title="Used Android Device"
            description="Already in use. Install APK manually, then scan QR in app."
            subtitle="For devices with existing data"
            icon={Tablet}
            color="blue"
            onClick={() => goToAddCustomer('ANDROID_EXISTING')}
          />

          <DeviceTypeCard
            title="iPhone / iPad"
            description="iOS device. Limited control via App Store installation."
            subtitle="Requires Serial Number"
            icon={Apple}
            color="gray"
            onClick={() => goToAddCustomer('IOS')}
          />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "p-4 rounded-xl border text-center transition-all",
            filter === 'all' ? "border-primary bg-primary/5" : "border-border"
          )}
        >
          <p className="text-2xl font-bold text-foreground">{customers.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </button>
        <button
          onClick={() => setFilter('active')}
          className={cn(
            "p-4 rounded-xl border text-center transition-all",
            filter === 'active' ? "border-green-500 bg-green-500/5" : "border-border"
          )}
        >
          <p className="text-2xl font-bold text-green-500">{activeDevices}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </button>
        <button
          onClick={() => setFilter('locked')}
          className={cn(
            "p-4 rounded-xl border text-center transition-all",
            filter === 'locked' ? "border-red-500 bg-red-500/5" : "border-border"
          )}
        >
          <p className="text-2xl font-bold text-red-500">{lockedDevices}</p>
          <p className="text-xs text-muted-foreground">Locked</p>
        </button>
        <button
          onClick={() => setFilter('removed')}
          className={cn(
            "p-4 rounded-xl border text-center transition-all",
            filter === 'removed' ? "border-gray-500 bg-gray-500/5" : "border-border"
          )}
        >
          <p className="text-2xl font-bold text-gray-500">{removedDevices}</p>
          <p className="text-xs text-muted-foreground">Removed</p>
        </button>
      </div>

      {/* Device List Section */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Devices
            </CardTitle>
            <Badge variant="outline">{filteredCustomers.length}</Badge>
          </div>
          <CardDescription>
            {filter === 'all' && 'All registered devices'}
            {filter === 'active' && 'Active devices only'}
            {filter === 'locked' && 'Locked devices only'}
            {filter === 'removed' && 'Removed devices only'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground">No devices found</p>
              <Button className="mt-4" onClick={() => goToAddCustomer('ANDROID_NEW')}>
                Add First Device
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Collection Status</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Collected</span>
                <span className="font-bold text-green-500">₹{stats.collectedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Pending</span>
                <span className="font-bold text-yellow-500">₹{stats.totalEmiValue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Alerts</span>
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Locked</span>
                <span className="font-bold text-red-500">{lockedDevices}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Overdue</span>
                <span className="font-bold text-yellow-500">
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

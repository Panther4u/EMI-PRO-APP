import { useState, useEffect } from 'react';
import {
  Smartphone,
  Tablet,
  Apple,
  ChevronRight,
  Lock,
  Trash2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Search,
  Plus
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

// Premium Device Type Card
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
  color: 'green' | 'blue' | 'purple';
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "relative p-5 rounded-3xl border transition-all text-left w-full group overflow-hidden active:scale-[0.97]",
      "bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300",
      color === 'green' && 'border-green-500/20 hover:border-green-500/40',
      color === 'blue' && 'border-blue-500/20 hover:border-blue-500/40',
      color === 'purple' && 'border-purple-500/20 hover:border-purple-500/40',
    )}
  >
    {/* Background Decorative Element */}
    <div className={cn(
      "absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity",
      color === 'green' && 'bg-green-500',
      color === 'blue' && 'bg-blue-500',
      color === 'purple' && 'bg-purple-500',
    )}></div>

    <div className="flex items-center gap-4 relative z-10">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner",
        color === 'green' && 'bg-green-500/10 text-green-600',
        color === 'blue' && 'bg-blue-500/10 text-blue-600',
        color === 'purple' && 'bg-purple-500/10 text-purple-600',
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-[15px] text-foreground tracking-tight">{title}</h3>
          <span className={cn(
            "text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider",
            color === 'green' && 'bg-green-500/10 text-green-600',
            color === 'blue' && 'bg-blue-500/10 text-blue-600',
            color === 'purple' && 'bg-purple-500/10 text-purple-600',
          )}>{subtitle}</span>
        </div>
        <p className="text-[12px] text-muted-foreground mt-0.5 font-medium leading-tight opacity-70">{description}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center transition-transform group-hover:translate-x-1">
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  </button>
);

// Premium Device Card
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
    "p-4 rounded-[24px] border transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98] group",
    customer.isLocked
      ? "bg-destructive/[0.02] border-destructive/20"
      : customer.deviceStatus?.status === 'REMOVED' || customer.deviceStatus?.status === 'removed'
        ? "bg-slate-500/[0.02] border-slate-200 opacity-60 grayscale"
        : "bg-card border-border/60"
  )} onClick={onView}>
    <div className="flex items-center gap-4">
      {/* Premium Avatar */}
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 overflow-hidden shadow-inner ring-1 ring-black/5",
        customer.isLocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
      )}>
        {customer.photoUrl ? (
          <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
        ) : (
          customer.name?.charAt(0) || '?'
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-bold text-[14px] text-foreground truncate tracking-tight">{customer.name}</h4>
          <Badge className={cn(
            "text-[9px] px-2 py-0 h-4 uppercase tracking-[0.1em] font-black border-none",
            customer.isLocked ? "bg-destructive/10 text-destructive shadow-none" :
              (customer.deviceStatus?.status === 'REMOVED' || customer.deviceStatus?.status === 'removed') ? "bg-slate-500/10 text-slate-500 shadow-none" : "bg-emerald-500/10 text-emerald-600 shadow-none"
          )}>
            {customer.isLocked ? 'Locked' :
              (customer.deviceStatus?.status === 'REMOVED' || customer.deviceStatus?.status === 'removed') ? 'Removed' : 'Live'}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground/80 font-bold truncate tracking-wide">{customer.phoneNo}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Smartphone className="w-3 h-3 text-muted-foreground opacity-50" />
          <p className="text-[10px] text-muted-foreground/60 truncate font-mono tracking-tighter">
            {customer.mobileModel || customer.imei1 || 'UNSET_ID'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
        {customer.isLocked ? (
          <Button size="icon" variant="secondary" onClick={onUnlock} className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 active:scale-90 border-none">
            <Lock className="w-4 h-4 fill-emerald-600/20" />
          </Button>
        ) : (
          <Button size="icon" variant="secondary" onClick={onLock} className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-90 border-none">
            <Lock className="w-4 h-4 fill-destructive/20" />
          </Button>
        )}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { customers, refreshCustomers, toggleLock } = useDevice();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'locked' | 'removed'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = getAdminStats(customers);
  const activeDevices = (customers || []).filter(c => !c.isLocked && (c.deviceStatus?.status as string) !== 'REMOVED' && (c.deviceStatus?.status as string) !== 'removed').length;
  const lockedDevices = (customers || []).filter(c => c.isLocked).length;
  const removedDevices = (customers || []).filter(c => (c.deviceStatus?.status as string) === 'REMOVED' || (c.deviceStatus?.status as string) === 'removed').length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCustomers();
    setTimeout(() => setIsRefreshing(false), 800);
  };

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
      toast.success('Device locked successfully');
    } catch (e) {
      toast.error('Failed to lock device');
    }
  };

  const handleUnlock = async (customerId: string) => {
    try {
      await toggleLock(customerId, false, 'Unlocked via Dashboard');
      toast.success('Device unlocked successfully');
    } catch (e) {
      toast.error('Failed to unlock device');
    }
  };

  const handleRemove = async (customerId: string) => {
    if (!confirm('Are you sure you want to remove this device?')) return;
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

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-700">
      {/* Welcome & Search Bar */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-foreground tracking-tight uppercase italic">Admin Dashboard</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest opacity-70">Security Protocol Alpha</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} className={cn("h-11 w-11 rounded-2xl bg-secondary/50", isRefreshing && "animate-spin")}>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>

        {/* Search & Actions */}
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Search identifiers..."
              className="w-full bg-secondary/30 border-none rounded-2xl h-12 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <Button className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Main Stats Grid - Premium Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-[32px] border-none bg-primary text-primary-foreground shadow-xl shadow-primary/20 overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <CardContent className="p-5 relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Total Devices</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black italic tracking-tighter">{customers.length}</span>
                <ArrowUpRight className="w-4 h-4 opacity-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 overflow-hidden relative group" onClick={() => setFilter('active')}>
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <CardContent className="p-5 relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Active/Live</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black italic tracking-tighter">{activeDevices}</span>
                <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none bg-destructive text-white shadow-xl shadow-destructive/20 overflow-hidden relative group" onClick={() => setFilter('locked')}>
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <CardContent className="p-5 relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Locked Sys</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black italic tracking-tighter">{lockedDevices}</span>
                <Lock className="w-4 h-4 opacity-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none bg-slate-800 text-white shadow-xl shadow-slate-800/20 overflow-hidden relative group" onClick={() => setFilter('removed')}>
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <CardContent className="p-5 relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Deactivated</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black italic tracking-tighter">{removedDevices}</span>
                <Trash2 className="w-4 h-4 opacity-50" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Provisioning - Styled List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Device Provisioning</h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <DeviceTypeCard
            title="Fresh Android DPC"
            description="Zero-touch deployment for factory new devices"
            subtitle="Security Primary"
            icon={Smartphone}
            color="green"
            onClick={() => navigate('/add-customer?type=ANDROID_NEW')}
          />
          <DeviceTypeCard
            title="Legacy Android Link"
            description="Remote binding for active devices via APK"
            subtitle="Data Existing"
            icon={Tablet}
            color="blue"
            onClick={() => navigate('/add-customer?type=ANDROID_EXISTING')}
          />
        </div>
      </div>

      {/* Registered Devices List */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Registered Fleet</h2>
            <Badge variant="secondary" className="bg-secondary/80 text-[10px] rounded-lg px-2 py-0 h-5 font-black">{filteredCustomers.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-transparent" onClick={() => setFilter('all')}>
            View All
          </Button>
        </div>

        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 bg-secondary/20 rounded-[32px] border border-dashed border-border">
              <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No matching units found</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <DeviceCard
                key={customer.id}
                customer={customer}
                onLock={() => handleLock(customer.id)}
                onUnlock={() => handleUnlock(customer.id)}
                onRemove={() => handleRemove(customer.id)}
                onView={() => navigate(`/customers/${customer.id}`)}
              />
            ))
          )}
        </div>
      </div>

      {/* Financial Overview - Premium Glass Cards */}
      <div className="grid grid-cols-1 gap-3 pt-2">
        <Card className="rounded-[32px] border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-extrabold text-[15px] italic tracking-tight uppercase">Cash Collection</h3>
              </div>
              <ArrowUpRight className="w-5 h-5 text-emerald-500 opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Realized Revenue</p>
                <p className="text-2xl font-black tracking-tighter text-emerald-600 italic">₹{stats.collectedAmount.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Outstanding EMI</p>
                <p className="text-2xl font-black tracking-tighter text-amber-500 italic">₹{stats.totalEmiValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Branding */}
      <div className="text-center pt-4 opacity-30 select-none">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Secure Finance Pro v2.0</p>
        <p className="text-[8px] font-bold uppercase tracking-[0.1em] mt-1">End-to-End Encryption Enabled</p>
      </div>
    </div>
  );
};

export default Dashboard;

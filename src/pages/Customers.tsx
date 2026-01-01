import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Smartphone,
  ChevronRight,
  Plus,
  Filter,
  ArrowLeft,
  ArrowUpRight,
  Shield,
  Trash2,
  Lock,
  MoreVertical
} from 'lucide-react';
import { useDevice } from '@/context/DeviceContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Customers() {
  const navigate = useNavigate();
  const { customers, refreshCustomers, toggleLock, deleteCustomer } = useDevice();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'locked' | 'removed'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshCustomers();
  }, []);

  const filteredCustomers = (customers || []).filter(customer => {
    const matchesSearch =
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phoneNo?.includes(searchQuery) ||
      customer.imei1?.includes(searchQuery);

    const status = customer.deviceStatus?.status as string;
    const isRemoved = status === 'REMOVED' || status === 'removed';

    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && !customer.isLocked && !isRemoved;
    if (filter === 'locked') return matchesSearch && customer.isLocked;
    if (filter === 'removed') return matchesSearch && isRemoved;
    return matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Permanent deletion! This cannot be undone. System access will be revoked.')) return;
    try {
      await deleteCustomer(id);
      toast.success('Customer deleted forever');
    } catch (e) {
      toast.error('Deletion failed: Access Denied');
    }
  };

  const handleToggleLock = async (customer: any) => {
    const newState = !customer.isLocked;
    try {
      await toggleLock(customer.id, newState, `Manual toggle to ${newState ? 'LOCKED' : 'ACTIVE'}`);
      toast.success(`Unit ${newState ? 'locked' : 'unlocked'} successfully`);
    } catch (e) {
      toast.error('State change failed');
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-xl active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-xl font-black uppercase tracking-tight italic">Device Fleet</h1>
          <Button variant="ghost" size="icon" onClick={() => refreshCustomers()} className="h-10 w-10 rounded-xl bg-secondary/50">
            <Users className="w-5 h-5" />
          </Button>
        </div>

        {/* Search & Statistics Bar */}
        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by name, IMEI or phone..."
              className="w-full bg-secondary/30 border-none rounded-2xl h-12 pl-11 pr-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Horizontal Filter Scroll */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All Units' },
              { id: 'active', label: 'Active' },
              { id: 'locked', label: 'Locked' },
              { id: 'removed', label: 'History' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 border",
                  filter === f.id
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-card text-muted-foreground border-border/60 hover:border-primary/40"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fleet List */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-20 bg-secondary/10 rounded-[40px] border border-dashed border-border/60">
            <Smartphone className="w-16 h-16 text-muted-foreground/10 mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Zero Units Registered</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className={cn(
                "p-5 rounded-[32px] border transition-all relative overflow-hidden group active:scale-[0.98]",
                customer.isLocked ? "bg-destructive/[0.02] border-destructive/20" : "bg-card border-border/60 hover:border-primary/40 shadow-sm"
              )}
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              {/* Decorative Gradient Overlay */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                customer.isLocked ? "bg-gradient-to-br from-destructive/5 to-transparent" : "bg-gradient-to-br from-primary/5 to-transparent"
              )}></div>

              <div className="flex items-center gap-4 relative z-10">
                {/* Avatar Container */}
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500",
                  customer.isLocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                )}>
                  {customer.name?.charAt(0) || '?'}
                </div>

                {/* Identity & Status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-extrabold text-[15px] tracking-tight truncate uppercase italic">{customer.name}</h3>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      customer.isLocked ? "bg-destructive animate-pulse" : "bg-emerald-500"
                    )}></div>
                  </div>
                  <p className="text-[12px] font-bold text-muted-foreground tracking-wide">{customer.phoneNo}</p>
                  <div className="flex items-center gap-2 mt-1.5 grayscale opacity-60">
                    <Smartphone className="w-3 h-3" />
                    <span className="text-[10px] font-mono tracking-tighter truncate">{customer.imei1 || 'ID_UNASSIGNED'}</span>
                  </div>
                </div>

                {/* Compact Control Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleLock(customer); }}
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90",
                    customer.isLocked
                      ? "bg-destructive/10 text-destructive hover:bg-destructive shadow-lg shadow-destructive/10 hover:text-white"
                      : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/10 hover:text-white"
                  )}
                >
                  <Lock className={cn("w-4.5 h-4.5", customer.isLocked && "fill-current")} />
                </button>
              </div>

              {/* Sub-Footer Inside Card */}
              <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">EMI Paid</span>
                    <span className="text-[11px] font-black">{customer.paidEmis}/{customer.totalEmis}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Credit Score</span>
                    <span className="text-[11px] font-black text-primary">A+</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button (Native Mobile Feel) */}
      <button
        onClick={() => navigate('/add-customer')}
        className="fixed bottom-28 right-6 w-16 h-16 bg-primary text-primary-foreground rounded-3xl shadow-2xl shadow-primary/40 flex items-center justify-center animate-bounce-subtle z-[60] active:scale-90 transition-transform"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}

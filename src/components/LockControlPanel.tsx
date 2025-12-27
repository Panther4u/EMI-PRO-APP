import { useState } from 'react';
import { Customer } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Lock,
  Unlock,
  Camera,
  Wifi,
  Signal,
  Power,
  RotateCcw,
  MapPin,
  Search,
  AlertTriangle,
  Shield,
  Smartphone,
  ChevronLeft,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LockControlPanelProps {
  customers: Customer[];
  onLockToggle: (id: string, isLocked: boolean) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
}

const FeatureToggle = ({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200",
      isActive
        ? "bg-primary/5 border-primary/20 text-primary"
        : "bg-secondary/50 border-border/50 text-muted-foreground opacity-60"
    )}
  >
    <Icon className="w-4 h-4 mb-1" />
    <span className="text-[9px] font-bold uppercase">{label}</span>
  </button>
);

export const LockControlPanel = ({ customers, onLockToggle, onUpdateCustomer }: LockControlPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.imei1.includes(searchQuery) ||
    c.phoneNo.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search devices to control..."
            className="pl-10 bg-secondary/50 border-border/50 h-11"
          />
        </div>
      </div>

      {/* Grid of Control Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground glass-card">
            <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No devices found</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className={cn(
                "glass-card p-6 space-y-5 group transition-all duration-200",
                customer.isLocked && "border-destructive/30 bg-destructive/5"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center font-bold shadow-sm",
                    customer.isLocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  )}>
                    {customer.isLocked ? <Lock className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground leading-none">{customer.name}</h3>
                    <p className="text-xs text-muted-foreground mt-2 font-mono">{customer.imei1}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs uppercase font-bold border-0 px-3 py-1",
                    customer.isLocked ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                  )}
                >
                  {customer.isLocked ? 'Locked' : 'Active'}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Model</span>
                  <span className="text-foreground font-semibold">{customer.mobileModel}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Phone</span>
                  <span className="text-foreground font-semibold">{customer.phoneNo}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Location</span>
                  <span className="text-foreground font-semibold text-right max-w-[200px] truncate">{customer.address || 'Not specified'}</span>
                </div>
              </div>

              {/* Advanced Controls Section */}
              <div className="pt-4 border-t border-border/50 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Restrictions</h4>
                  {!customer.isLocked && (
                    <Badge variant="outline" className="text-[9px] uppercase font-bold bg-muted text-muted-foreground border-border">
                      Access Restricted
                    </Badge>
                  )}
                </div>

                <div className="relative group/restrictions">
                  <div className={cn(
                    "grid grid-cols-2 gap-2 transition-all duration-300",
                    !customer.isLocked && "blur-[2px] opacity-40 grayscale pointer-events-none"
                  )}>
                    <FeatureToggle
                      icon={Signal}
                      label="Network"
                      isActive={!customer.networkRestricted}
                      onClick={() => onUpdateCustomer(customer.id, { networkRestricted: !customer.networkRestricted })}
                    />
                    <FeatureToggle
                      icon={Wifi}
                      label="WiFi"
                      isActive={!customer.wifiRestricted}
                      onClick={() => onUpdateCustomer(customer.id, { wifiRestricted: !customer.wifiRestricted })}
                    />
                    <FeatureToggle
                      icon={Camera}
                      label="Camera"
                      isActive={!customer.cameraRestricted}
                      onClick={() => onUpdateCustomer(customer.id, { cameraRestricted: !customer.cameraRestricted })}
                    />
                    <FeatureToggle
                      icon={Phone}
                      label="Calls"
                      isActive={!customer.callsRestricted}
                      onClick={() => onUpdateCustomer(customer.id, { callsRestricted: !customer.callsRestricted })}
                    />
                    <FeatureToggle
                      icon={AlertTriangle}
                      label="Notif."
                      isActive={!customer.notificationsRestricted}
                      onClick={() => onUpdateCustomer(customer.id, { notificationsRestricted: !customer.notificationsRestricted })}
                    />
                    <FeatureToggle
                      icon={Power}
                      label="Power"
                      isActive={!customer.powerOffRestricted}
                      onClick={() => onUpdateCustomer(customer.id, { powerOffRestricted: !customer.powerOffRestricted })}
                    />
                    <FeatureToggle
                      icon={RotateCcw}
                      label="Reset"
                      isActive={!customer.resetRestricted}
                      onClick={() => onUpdateCustomer(customer.id, { resetRestricted: !customer.resetRestricted })}
                    />
                  </div>

                  {!customer.isLocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/5 rounded-xl z-10 backdrop-blur-[1px]">
                      <div className="bg-secondary text-muted-foreground p-2 rounded-full mb-2 shadow-sm border border-border/50">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Panel Blocked</span>
                      <span className="text-[8px] font-bold text-muted-foreground/60 uppercase mt-0.5">Lock Device to Manage</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant={customer.isLocked ? "success" : "destructive"}
                className="w-full gap-2 shadow-sm h-11 text-base font-semibold"
                onClick={() => onLockToggle(customer.id, !customer.isLocked)}
              >
                {customer.isLocked ? (
                  <>
                    <Unlock className="w-5 h-5" />
                    Unlock Device
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Lock Device
                  </>
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

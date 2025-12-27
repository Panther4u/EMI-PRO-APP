import { useState } from 'react';
import { Customer } from '@/types/customer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  Search,
  RefreshCw,
  Navigation,
  Clock,
  Smartphone,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface LocationTrackerProps {
  customers: Customer[];
}

export const LocationTracker = ({ customers }: LocationTrackerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Only show locked devices
  const lockedCustomers = customers.filter(c => c.isLocked);

  const filteredCustomers = lockedCustomers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.imei1.includes(searchQuery) ||
    c.phoneNo.includes(searchQuery)
  );

  return (
    <div className="grid grid-cols-1 gap-6 pb-20">
      {/* Customer List */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Locked Devices</h3>
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            {lockedCustomers.length} devices
          </Badge>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search locked devices..."
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-hide">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={cn(
                  "w-full p-3 rounded-lg border transition-all duration-200 text-left",
                  selectedCustomer?.id === customer.id
                    ? "bg-destructive/10 border-destructive/50"
                    : "bg-secondary/30 border-border/50 hover:border-destructive/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.mobileModel}</p>
                  </div>
                  <MapPin className="w-4 h-4 text-destructive animate-pulse" />
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No locked devices found</p>
            </div>
          )}
        </div>
      </div>

      {/* Map View */}
      <div className="glass-card p-4 min-h-[500px]">
        {selectedCustomer ? (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">{selectedCustomer.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.mobileModel}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Location
              </Button>
            </div>

            {/* Map Placeholder */}
            <div className="flex-1 bg-secondary/30 rounded-xl border border-border/50 relative overflow-hidden min-h-[400px]">
              {/* Grid background */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Location Marker */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Pulse animation */}
                  <div className="absolute inset-0 w-32 h-32 rounded-full bg-destructive/20 animate-ping" />
                  <div className="absolute inset-0 w-32 h-32 rounded-full bg-destructive/10" />

                  {/* Center marker */}
                  <div className="relative z-10 w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg shadow-destructive/50">
                    <Navigation className="w-8 h-8 text-destructive-foreground" />
                  </div>
                </div>
              </div>

              {/* Coordinates overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/50">
                  <p className="text-xs text-muted-foreground">Coordinates</p>
                  <p className="font-mono text-sm text-foreground">
                    {selectedCustomer.location.lat.toFixed(6)}, {selectedCustomer.location.lng.toFixed(6)}
                  </p>
                </div>
                <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/50">
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="font-mono text-sm text-foreground">±15m</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center min-h-[500px]">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
                <MapPin className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">Select a Locked Device</p>
                <p className="text-muted-foreground">Choose a device from the list to track its location</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

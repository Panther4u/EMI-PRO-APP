import { Customer } from '@/types/customer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, MapPin, Phone, CreditCard, Smartphone, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerCardProps {
  customer: Customer;
  onLockToggle: (id: string) => void;
  onViewDetails: (customer: Customer) => void;
  onEdit: (id: string) => void;
  onCollectEmi: (id: string) => void;
  onDelete: (id: string) => void;
}

export const CustomerCard = ({ customer, onLockToggle, onViewDetails, onEdit, onCollectEmi, onDelete }: CustomerCardProps) => {
  const remainingEmis = customer.totalEmis - customer.paidEmis;
  const progress = (customer.paidEmis / customer.totalEmis) * 100;

  return (
    <div className={cn(
      "glass-card p-5 transition-all duration-300 hover:border-border",
      customer.isLocked && "border-destructive/30 bg-destructive/5"
    )}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
              customer.isLocked
                ? "bg-destructive/20 text-destructive"
                : "bg-primary/20 text-primary"
            )}>
              {customer.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{customer.name}</h3>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                {customer.mobileModel}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "whitespace-nowrap flex-shrink-0",
              customer.isLocked ? "status-locked" : "status-unlocked"
            )}
          >
            {customer.isLocked ? 'Locked' : 'Active'}
          </Badge>
        </div>
      </div>


      {/* EMI Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">EMI Progress</span>
          <span className="text-sm font-medium text-foreground">
            {customer.paidEmis}/{customer.totalEmis}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              customer.isLocked ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* EMI Details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CreditCard className="w-3 h-3" />
            <span className="text-xs">Monthly EMI</span>
          </div>
          <p className="font-semibold text-foreground">₹{customer.emiAmount.toLocaleString()}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Pending</div>
          <p className="font-semibold text-foreground">
            ₹{(remainingEmis * customer.emiAmount).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <MapPin className="w-4 h-4" />
        <span className="truncate">{customer.address}</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="glass"
            size="sm"
            className="w-full"
            onClick={() => onViewDetails(customer)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onEdit(customer.id)}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-destructive/20 text-destructive hover:bg-destructive hover:text-white"
            onClick={() => onDelete(customer.id)}
          >
            Delete
          </Button>
        </div>
        <Button
          variant={customer.isLocked ? "successOutline" : "danger"}
          size="sm"
          onClick={() => onLockToggle(customer.id)}
          className="gap-2 w-full"
        >
          {customer.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {customer.isLocked ? 'Unlock Device' : 'Lock Device'}
        </Button>
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="sm"
          onClick={() => onCollectEmi(customer.id)}
          disabled={remainingEmis <= 0}
        >
          <CreditCard className="w-3 h-3 mr-2" />
          Collect Payment
        </Button>
      </div>
    </div>
  );
};

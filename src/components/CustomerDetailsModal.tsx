import React from 'react';
import { getProvisioningQRData } from '@/utils/provisioning';
import { Link } from 'react-router-dom';
import { Customer } from '@/types/customer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Lock,
  Unlock,
  MapPin,
  Phone,
  CreditCard,
  Smartphone,
  User,
  Calendar,
  Hash,
  Building,
  History,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CustomerDetailsModalProps {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
  onLockToggle: (id: string) => void;
  onCollectEmi: (id: string) => void;
}

export const CustomerDetailsModal = ({
  customer,
  open,
  onClose,
  onLockToggle,
  onCollectEmi
}: CustomerDetailsModalProps) => {
  const [qrData, setQrData] = React.useState<string>('');
  const [qrLoading, setQrLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchQR = async () => {
      if (customer && open) {
        setQrLoading(true);
        try {
          const data = await getProvisioningQRData(customer);
          setQrData(data);
        } catch (error) {
          console.error("Failed to generate QR", error);
        } finally {
          setQrLoading(false);
        }
      }
    };
    fetchQR();
  }, [customer, open]);

  if (!customer) return null;

  const remainingEmis = customer.totalEmis - customer.paidEmis;
  const progress = (customer.paidEmis / customer.totalEmis) * 100;

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-[400px] bg-card border-border max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl",
                customer.isLocked
                  ? "bg-destructive/20 text-destructive"
                  : "bg-primary/20 text-primary"
              )}>
                {customer.name.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-xl mb-1">{customer.name}</DialogTitle>
                <Badge
                  className={cn(
                    "px-3 py-1",
                    customer.isLocked ? "status-locked" : "status-unlocked"
                  )}
                >
                  {customer.isLocked ? 'Device Locked' : 'Device Active'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 mt-6">
          {/* Personal Info */}
          <div className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Personal Information
            </h3>

            <div className="flex gap-4 mb-4">
              {customer.photoUrl ? (
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-border flex-shrink-0">
                  <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <InfoRow icon={Phone} label="Phone Number" value={customer.phoneNo} />
                <InfoRow icon={Hash} label="Aadhar" value={customer.aadharNo} />
              </div>
            </div>
            <InfoRow icon={MapPin} label="Address" value={customer.address} />

            {/* Documents */}
            {customer.documents && customer.documents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Documents</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {customer.documents.map((doc, i) => (
                    <div key={i} className="w-20 h-14 rounded bg-black/5 flex-shrink-0 overflow-hidden border border-border">
                      <img src={doc} alt={`Doc ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Device Info */}
          <div className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              Device Information
            </h3>
            <InfoRow icon={Smartphone} label="Device Name" value={customer.mobileModel} />
            <InfoRow icon={Hash} label="IMEI 1" value={customer.imei1} />
            <InfoRow icon={Hash} label="IMEI 2" value={customer.imei2} />
            <div className="mt-4 pt-3 border-t border-border/50">
              <Link to={`/mobile/${customer.imei1}`} target="_blank" className="w-full block">
                <Button variant="outline" size="sm" className="w-full text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 border-blue-500/30">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Open Device Simulator
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* EMI Details */}
        <div className="glass-card p-4 mt-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            EMI Details
          </h3>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Payment Progress</span>
              <span className="text-sm font-medium text-foreground">
                {customer.paidEmis} of {customer.totalEmis} EMIs paid
              </span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  customer.isLocked ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Loan</p>
              <p className="text-sm font-bold text-foreground">₹{customer.totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">EMI</p>
              <p className="text-sm font-bold text-foreground">₹{customer.emiAmount.toLocaleString()}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Date</p>
              <p className="text-sm font-bold text-foreground">{customer.emiDate}th</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Pending</p>
              <p className="text-sm font-bold text-destructive">
                ₹{(remainingEmis * customer.emiAmount).toLocaleString()}
              </p>
            </div>
          </div>

          <Button
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onCollectEmi(customer.id)}
            disabled={remainingEmis <= 0}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Collect Payment
          </Button>

          <div className="mt-3">
            <InfoRow
              icon={Building}
              label="Finance Provider"
              value={customer.financeName}
            />
          </div>
        </div>

        {/* Location */}
        <div className="glass-card p-4 mt-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Last Known Location
          </h3>
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-foreground">
                  Lat: {customer.location.lat.toFixed(4)}, Lng: {customer.location.lng.toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {format(new Date(customer.location.lastUpdated), 'PPpp')}
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* QR Code Section */}
        <div className="glass-card p-4 mt-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" />
            Device Configuration QR
          </h3>
          <div className="flex flex-col items-center bg-white rounded-xl p-4 border border-border transition-all hover:shadow-md">
            {qrLoading || !qrData ? (
              <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-100 rounded-lg">
                <span className="text-xs text-gray-500 animate-pulse">Generating QR...</span>
              </div>
            ) : (
              <QRCodeSVG
                value={qrData}
                size={180}
                level="H"
                includeMargin={true}
              />
            )}
            <div className="mt-3 text-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Scan to Onboard Device</p>
              <p className="text-[9px] text-gray-400 mt-0.5 font-mono">{customer.imei1}</p>
            </div>
          </div>
        </div>

        {/* Lock History */}
        {
          customer.lockHistory.length > 0 && (
            <div className="glass-card p-4 mt-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Lock History
              </h3>
              <div className="space-y-2">
                {customer.lockHistory.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      event.action === 'locked' ? "bg-destructive/20" : "bg-success/20"
                    )}>
                      {event.action === 'locked' ? (
                        <Lock className="w-4 h-4 text-destructive" />
                      ) : (
                        <Unlock className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground capitalize">{event.action}</p>
                      <p className="text-xs text-muted-foreground">{event.reason}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.timestamp), 'PPp')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            variant={customer.isLocked ? "success" : "destructive"}
            className="flex-1"
            onClick={() => {
              onLockToggle(customer.id);
              onClose();
            }}
          >
            {customer.isLocked ? (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                Unlock Device
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Lock Device
              </>
            )}
          </Button>
        </div>
      </DialogContent >
    </Dialog >
  );
};

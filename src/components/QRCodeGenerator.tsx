import React, { useState, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  QrCode, Download, Copy, CheckCircle, CreditCard,
  ChevronDown, Check, ChevronsUpDown, User, Phone, FileText, MapPin, IndianRupee, Calendar,
  Loader2, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDevice } from '@/context/DeviceContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDeviceOwnerProvisioningQR } from '@/utils/provisioning';

const brandModelMap: Record<string, string[]> = {
  "Samsung": [
    "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24",
    "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S23 FE",
    "Galaxy Z Fold 5", "Galaxy Z Flip 5", "Galaxy Z Fold 6 (Coming Soon)", "Galaxy Z Flip 6 (Coming Soon)",
    "Galaxy A55 5G", "Galaxy A35 5G", "Galaxy A54 5G", "Galaxy A34 5G", "Galaxy A15 5G",
    "Galaxy M55 5G", "Galaxy M34 5G", "Galaxy F15 5G", "Galaxy F54 5G"
  ],
  "Apple": [
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16", "iPhone 16e",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
    "iPhone 12", "iPhone SE (3rd Gen)"
  ],
  "Google": [
    "Pixel 9 Pro Fold", "Pixel 9 Pro XL", "Pixel 9 Pro", "Pixel 9",
    "Pixel 8 Pro", "Pixel 8", "Pixel 8a",
    "Pixel 7 Pro", "Pixel 7", "Pixel 7a",
    "Pixel Fold", "Pixel 6a"
  ],
  "OnePlus": [
    "OnePlus 12", "OnePlus 12R", "OnePlus 11 5G", "OnePlus 11R 5G",
    "OnePlus Open (Fold)", "OnePlus Nord CE4 5G", "OnePlus Nord 3 5G",
    "OnePlus Nord CE3 5G", "OnePlus Nord N30 5G"
  ],
  "Xiaomi/Redmi": [
    "Xiaomi 14 Ultra", "Xiaomi 14", "Xiaomi 14 Civi",
    "Xiaomi 13 Ultra", "Xiaomi 13 Pro", "Xiaomi 13T Pro",
    "Redmi Note 13 Pro+ 5G", "Redmi Note 13 Pro 5G", "Redmi Note 13 5G",
    "Redmi Note 12 Pro+", "Redmi 13C 5G", "Xiaomi Pad 6"
  ],
  "Vivo": [
    "X100 Pro", "X100", "X90 Pro", "X90",
    "V40 Lite 5G", "V30 Pro", "V30", "V29 Pro", "V29",
    "T3 5G", "T2 Pro 5G", "Y200 5G", "Y28 5G"
  ],
  "Oppo": [
    "Find X6 Pro", "Find X6", "Find N3 Flip", "Find N2 Flip",
    "Reno 11 Pro 5G", "Reno 11 5G", "Reno 10 Pro+ 5G", "Reno 10 Pro 5G", "Reno 10 5G",
    "F25 Pro 5G", "F23 5G", "A80", "A79 5G", "A38"
  ],
  "Realme": [
    "GT 6", "GT 6T 5G", "GT 2 Pro", "GT Neo 3",
    "12 Pro+ 5G", "12 Pro 5G", "12+ 5G", "12x 5G",
    "11 Pro+ 5G", "11 Pro 5G", "11 5G",
    "P1 Pro 5G", "P1 5G", "Narzo 70 Pro 5G", "Narzo 60 Pro 5G"
  ],
  "Motorola": [
    "Edge 50 Pro", "Edge 50 Fusion", "Edge 40 Neo", "Edge 40",
    "Razr 50 Ultra", "Razr 40 Ultra", "Razr 40",
    "Moto G85 5G", "Moto G64 5G", "Moto G54 5G", "Moto G34 5G"
  ],
  "Nothing": [
    "Nothing Phone (2)", "Nothing Phone (2a)", "Nothing Phone (1)",
    "CMF Phone 1"
  ],
  "Infinix": [
    "GT 20 Pro", "Note 40 Pro+ 5G", "Note 40 Pro 5G",
    "Zero 30 5G", "Smart 8 Plus"
  ],
  "Tecno": [
    "Camon 30 Premier 5G", "Phantom V Flip 5G", "Pova 6 Pro 5G",
    "Spark 20 Pro+"
  ],
  "Lava": [
    "Agni 2 5G", "Blaze Curve 5G", "Blaze 2 5G", "Yuva 3 Pro"
  ],
  "Other": ["Other Model"]
};

interface QRFormData {
  customerName: string;
  phoneNo: string;
  aadharNo: string;
  address: string;
  deviceName: string;
  mobileModel: string;
  financeName: string;
  imei1: string;
  imei2: string;
  totalAmount: string;
  emiAmount: string;
  totalEmis: string;
}

interface InputFieldProps {
  label: string;
  field: keyof QRFormData;
  value: string;
  onChange: (field: keyof QRFormData, value: string) => void;
  placeholder: string;
  required?: boolean;
  id?: string;
  icon?: any;
  type?: string;
  maxLength?: number;
  step?: string;
}

// Memoized Input Component
const InputField = React.memo(({
  label,
  field,
  value,
  onChange,
  placeholder,
  required = false,
  id,
  icon: Icon,
  type = "text",
  maxLength,
  step
}: InputFieldProps) => (
  <div className="space-y-2">
    <Label className="text-sm text-muted-foreground" htmlFor={id}>
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />}
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        type={type}
        maxLength={maxLength}
        step={step}
        className={cn("bg-secondary/50 border-border/50 focus:border-primary", Icon && "pl-9")}
      />
    </div>
  </div>
));

export const QRCodeGenerator = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addCustomer } = useDevice();

  const [formData, setFormData] = useState<QRFormData>({
    customerName: '',
    phoneNo: '',
    aadharNo: '',
    address: '',
    deviceName: '',
    mobileModel: '',
    financeName: '',
    imei1: '',
    imei2: '',
    totalAmount: '',
    emiAmount: '',
    totalEmis: '',
  });
  const [qrGenerated, setQrGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);

  const handleInputChange = useCallback((field: keyof QRFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setQrGenerated(false);
    setCreatedCustomerId(null);
  }, []);

  const generateQR = async () => {
    if (!formData.customerName || !formData.phoneNo || !formData.imei1) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields (Name, Phone, IMEI)',
        variant: 'destructive',
      });
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNo)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newId = `CUST${Date.now().toString().slice(-6)}`;
      const customerData: any = {
        id: newId,
        name: formData.customerName,
        phoneNo: formData.phoneNo,
        aadharNo: formData.aadharNo,
        address: formData.address,
        deviceName: '', // Will be auto-fetched by Admin DPC
        mobileModel: '', // Will be auto-fetched by Admin DPC
        financeName: formData.financeName,
        imei1: formData.imei1,
        imei2: formData.imei2,
        totalAmount: Number(formData.totalAmount) || 0,
        emiAmount: Number(formData.emiAmount) || 0,
        totalEmis: Number(formData.totalEmis) || 12,
        paidEmis: 0,
        emiDate: new Date().getDate(),
        isLocked: false,
        location: { lat: 0, lng: 0, lastUpdated: new Date().toISOString() },
        status: 'active'
      };

      await addCustomer(customerData);

      setQrGenerated(true);
      setCreatedCustomerId(newId);

      // Fetch QR data from backend
      await fetchQRData(newId);

      toast({
        title: 'Success',
        description: 'Customer registered. Device details will be auto-fetched after QR scan.',
      });

    } catch (error) {
      console.error('Error in generateQR:', error);
      setQrGenerated(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register customer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const [qrData, setQrData] = useState<string>('');
  const [qrLoading, setQrLoading] = useState(false);

  // Fetch QR data when customer is created
  const fetchQRData = async (customerId: string) => {
    setQrLoading(true);
    try {
      const data = await getDeviceOwnerProvisioningQR(
        {
          id: customerId,
          name: formData.customerName,
          phoneNo: formData.phoneNo,
          mobileModel: formData.mobileModel,
          imei1: formData.imei1,
          imei2: formData.imei2,
          financeName: formData.financeName || 'SecureFinance EMI',
          totalAmount: formData.totalAmount,
          emiAmount: formData.emiAmount,
          totalEmis: formData.totalEmis,
        }
      );
      setQrData(data);
    } catch (error) {
      console.error('Error generating QR data:', error);
      toast({
        title: 'QR Generation Failed',
        description: 'Could not generate QR code. Please try again.',
        variant: 'destructive',
      });
      // Do not close the view, so user can retry
    } finally {
      setQrLoading(false);
    }
  };

  const copyQRData = () => {
    navigator.clipboard.writeText(qrData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'QR data copied to clipboard',
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Customer & Device Info */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          Customer & Device Info
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <InputField
            label="Customer Name"
            field="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            placeholder="Enter full name"
            required
            id="customerName"
            icon={User}
          />
          <InputField
            label="Phone Number"
            field="phoneNo"
            value={formData.phoneNo}
            onChange={handleInputChange}
            placeholder="+91 98765 43210"
            required
            id="phoneNo"
            icon={Phone}
            type="tel"
            maxLength={10}
          />
          <InputField
            label="Aadhar Number"
            field="aadharNo"
            value={formData.aadharNo}
            onChange={handleInputChange}
            placeholder="1234 5678 9012"
            id="aadharNo"
            icon={FileText}
            maxLength={12}
          />
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Address <span className="text-destructive">*</span></Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 resize-none"
                placeholder="Enter full address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-2">Device Details</h3>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                ℹ️ Auto-Detection Enabled
              </p>
              <p className="text-xs text-muted-foreground">
                Device brand and model will be automatically detected after QR provisioning.
                Admin DPC will collect real device information and display it on the dashboard.
              </p>
            </div>
            <div className="space-y-4">

              <InputField
                label="IMEI 1"
                field="imei1"
                value={formData.imei1}
                onChange={handleInputChange}
                placeholder="356938035643809"
                required
                id="imei1"
                icon={QrCode}
                maxLength={15}
              />
              <InputField
                label="IMEI 2"
                field="imei2"
                value={formData.imei2}
                onChange={handleInputChange}
                placeholder="356938035643817"
                id="imei2"
                icon={QrCode}
                maxLength={15}
              />
            </div>
          </div>
        </div>
      </div>

      {/* EMI Details */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          EMI Details
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <InputField
            id="financeName"
            label="Finance Provider"
            field="financeName"
            value={formData.financeName}
            onChange={handleInputChange}
            icon={CreditCard}
            placeholder="e.g. Finance Name"
          />
          <InputField
            label="Total Amount (₹)"
            field="totalAmount"
            value={formData.totalAmount}
            onChange={handleInputChange}
            placeholder="10000"
            id="totalAmount"
            icon={IndianRupee}
            type="number"
            step="100"
          />
          <InputField
            label="EMI Amount (₹)"
            field="emiAmount"
            value={formData.emiAmount}
            onChange={handleInputChange}
            placeholder="1000"
            id="emiAmount"
            icon={IndianRupee}
            type="number"
            step="100"
          />
          <InputField
            label="Total EMIs"
            field="totalEmis"
            value={formData.totalEmis}
            onChange={handleInputChange}
            placeholder="10"
            id="totalEmis"
            icon={Calendar}
            type="number"
          />
        </div>
      </div>

      <div className="glass-card p-6">
        <Button
          onClick={generateQR}
          className="w-full"
          size="lg"
        >
          <QrCode className="w-5 h-5 mr-2" />
          Generate QR Code
        </Button>
      </div>      {/* QR Preview */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">QR Code Preview</h2>

        <div className="flex flex-col items-center justify-center min-h-[350px] py-6 bg-secondary/30 rounded-xl border border-border/50">
          {qrGenerated ? (
            <div className="text-center space-y-4">
              <div className="w-56 h-56 bg-white rounded-xl flex items-center justify-center mx-auto p-3 shadow-lg relative">
                {qrLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground">Generating...</span>
                  </div>
                ) : qrData ? (
                  <QRCodeSVG
                    value={qrData}
                    size={200}
                    level="H"
                    includeMargin={true}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-destructive font-medium">Generation Failed</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => createdCustomerId && fetchQRData(createdCustomerId)}
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">
                  {formData.customerName}
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  IMEI: {formData.imei1}
                </p>
                <p className="text-xs text-blue-500 font-medium mt-2 bg-blue-500/10 py-1 px-2 rounded-md inline-block">
                  Scan this QR code after 6 taps on the Welcome Screen (Factory Reset)
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4 w-full max-w-xs mx-auto">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyQRData} className="flex-1">
                    {copied ? (
                      <CheckCircle className="w-4 h-4 mr-2 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                {createdCustomerId && (
                  <Button
                    variant="default"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => navigate(`/customers/${createdCustomerId}`)}
                  >
                    Go to Customer Details
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
                <QrCode className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground">Fill in customer details</p>
                <p className="text-sm text-muted-foreground/70">QR code will appear here</p>
              </div>
            </div>
          )}
        </div>

        {qrGenerated && (
          <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
            {/* Debugging Text */}
          </div>
        )}
      </div>
    </div >
  );
};

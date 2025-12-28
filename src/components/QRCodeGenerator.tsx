import React, { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  QrCode, Download, Copy, CheckCircle, CreditCard,
  ChevronDown, Check, ChevronsUpDown, User, Phone, FileText, MapPin, IndianRupee, Calendar
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
// import { Customer } from '@/types/customer'; // Not strictly needed unless used
import { useNavigate } from 'react-router-dom';

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
  totalAmount: string; // Changed to string for input handling
  emiAmount: string;   // Changed to string for input handling
  totalEmis: string;   // Changed to string for input handling
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

// Memoized Input Component to prevent re-renders
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

  // Memoized handler
  const handleInputChange = useCallback((field: keyof QRFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setQrGenerated(false);
  }, []);

  const generateQR = async () => {
    if (!formData.customerName || !formData.phoneNo || !formData.imei1 || !formData.deviceName || !formData.mobileModel) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Phone Number Validation (10 digits)
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
      // Construct Customer Object
      const newId = `CUST${Date.now().toString().slice(-6)}`; // Simple ID generation
      const customerData: any = {
        id: newId,
        name: formData.customerName,
        phoneNo: formData.phoneNo,
        aadharNo: formData.aadharNo,
        address: formData.address,
        deviceName: formData.deviceName,
        mobileModel: formData.mobileModel,
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
      toast({
        title: 'Success',
        description: 'Customer registered. Redirecting to details...',
      });

      // Redirect to customer details page
      setTimeout(() => {
        navigate(`/customers/${newId}`);
      }, 1000);

    } catch (error) {
      console.error(error);
      // Toast is already handled in context for error
    }
  };

  const getQRData = () => {
    // Android Enterprise QR Code Provisioning Format
    // Must be key=value pairs, one per line (not JSON!)
    const adminExtras = {
      "serverUrl": window.location.origin,
      "customerId": `CUST${Date.now().toString().slice(-6)}`,
      "customerName": formData.customerName,
      "phoneNo": formData.phoneNo,
      "deviceBrand": formData.deviceName,
      "deviceModel": formData.mobileModel,
      "imei1": formData.imei1,
      "imei2": formData.imei2,
      "financeName": formData.financeName || 'SecureFinance EMI',
      "totalAmount": formData.totalAmount,
      "emiAmount": formData.emiAmount,
      "totalEmis": formData.totalEmis,
      "enrollmentDate": new Date().toISOString()
    };

    // Convert to Android provisioning format (key=value, newline separated)
    const qrLines = [
      `android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME=com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver`,
      `android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION=${window.location.origin}/downloads/app-user-release.apk`,
      `android.app.extra.PROVISIONING_SKIP_ENCRYPTION=true`,
      `android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED=true`,
      // Admin extras as JSON string (Android will parse this)
      `android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE=${JSON.stringify(adminExtras)}`
    ];

    return qrLines.join('\n');
  };

  const qrData = getQRData();

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
      {/* Section 1: Customer & Device Info */}
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
            <h3 className="text-sm font-semibold text-foreground mb-4">Device Details</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Device Name (Brand) <span className="text-destructive">*</span>
                </Label>
                <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={brandOpen}
                      className="w-full justify-between bg-secondary/50 border-border/50 hover:bg-secondary/70 h-10 font-normal"
                    >
                      {formData.deviceName || "Select Brand"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command className="bg-popover border border-border">
                      <CommandInput placeholder="Search brand..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No brand found.</CommandEmpty>
                        <CommandGroup>
                          {Object.keys(brandModelMap).map((brand) => (
                            <CommandItem
                              key={brand}
                              value={brand}
                              onSelect={() => {
                                handleInputChange('deviceName', brand);
                                handleInputChange('mobileModel', ''); // Reset model when brand changes
                                setBrandOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.deviceName === brand ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {brand}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Device Model <span className="text-destructive">*</span>
                </Label>
                <Popover open={modelOpen} onOpenChange={setModelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={modelOpen}
                      className="w-full justify-between bg-secondary/50 border-border/50 hover:bg-secondary/70 h-10 font-normal"
                      disabled={!formData.deviceName}
                    >
                      {formData.mobileModel || "Select or type model"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command className="bg-popover border border-border">
                      <CommandInput
                        placeholder="Search or type custom model..."
                        className="h-9"
                        value={formData.mobileModel}
                        onValueChange={(value) => handleInputChange('mobileModel', value)}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-2 text-center">
                            <p className="text-sm text-muted-foreground mb-2">Model not found</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Keep the typed value as custom model
                                setModelOpen(false);
                              }}
                              className="w-full"
                            >
                              Use "{formData.mobileModel}" as custom model
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {(brandModelMap[formData.deviceName] || []).map((model) => (
                            <CommandItem
                              key={model}
                              value={model}
                              onSelect={() => {
                                handleInputChange('mobileModel', model);
                                setModelOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.mobileModel === model ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {model}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formData.mobileModel && !brandModelMap[formData.deviceName]?.includes(formData.mobileModel) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Using custom model: {formData.mobileModel}
                  </p>
                )}
              </div>

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

      {/* Section 2: EMI Details */}
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

        <Button
          onClick={generateQR}
          className="w-full mt-6"
        >
          <QrCode className="w-4 h-4 mr-2" />
          Generate QR Code
        </Button>
      </div>

      {/* QR Preview */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">QR Code Preview</h2>

        <div className="flex flex-col items-center justify-center min-h-[350px] py-6 bg-secondary/30 rounded-xl border border-border/50">
          {qrGenerated ? (
            <div className="text-center space-y-4">
              {/* Real QR Code */}
              <div className="w-56 h-56 bg-white rounded-xl flex items-center justify-center mx-auto p-3 shadow-lg">
                <QRCodeSVG
                  value={qrData}
                  size={200}
                  level="H"
                  includeMargin={true}
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">
                  {formData.customerName}
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  IMEI: {formData.imei1}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={copyQRData}>
                  {copied ? (
                    <CheckCircle className="w-4 h-4 mr-2 text-success" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy Data'}
                </Button>
                <Button variant="default">
                  <Download className="w-4 h-4 mr-2" />
                  Download QR
                </Button>
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
            <p className="text-xs text-muted-foreground mb-2">Encoded Data:</p>
            <code className="text-xs text-foreground font-mono break-all">
              {qrData}
            </code>
          </div>
        )}
      </div>
    </div>
  );
};


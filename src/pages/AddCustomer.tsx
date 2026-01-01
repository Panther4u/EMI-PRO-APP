import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    User,
    Phone,
    CreditCard,
    Smartphone,
    Upload,
    Camera,
    ArrowLeft,
    Hash,
    Check,
    Apple,
    Tablet,
    Info
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AddCustomer() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const photoInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [qrData, setQrData] = useState<any>(null);
    const [showQR, setShowQR] = useState(false);

    // Get device type from URL
    const deviceType = (searchParams.get('type') as 'ANDROID_NEW' | 'ANDROID_EXISTING' | 'IOS') || 'ANDROID_NEW';

    // Form state - Only essential fields
    const [formData, setFormData] = useState({
        // Customer Info
        name: '',
        phoneNo: '',
        aadharNo: '',
        address: '',
        photoUrl: '',
        documents: [] as string[],

        // Device - Only IMEI required, rest auto-fetched
        imei1: '',
        serialNumber: '', // iOS only

        // Loan Details
        financeName: '',
        totalAmount: '',
        emiAmount: '',
        emiDate: '',
        totalEmis: '12'
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({
                        ...prev,
                        documents: [...prev.documents, reader.result as string]
                    }));
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const generateCustomerId = () => {
        return 'CUST' + Math.floor(100000 + Math.random() * 900000);
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error('Please enter customer name');
            return false;
        }
        if (!formData.phoneNo.trim()) {
            toast.error('Please enter phone number');
            return false;
        }
        if (!formData.imei1.trim()) {
            toast.error('Please enter IMEI number');
            return false;
        }
        if (deviceType === 'IOS' && !formData.serialNumber.trim()) {
            toast.error('Please enter device serial number for iOS');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const customerId = generateCustomerId();

            const customerPayload = {
                id: customerId,
                name: formData.name,
                phoneNo: formData.phoneNo,
                aadharNo: formData.aadharNo,
                address: formData.address,
                photoUrl: formData.photoUrl,
                documents: formData.documents,
                imei1: formData.imei1,
                expectedIMEI: formData.imei1,
                financeName: formData.financeName,
                totalAmount: parseFloat(formData.totalAmount) || 0,
                emiAmount: parseFloat(formData.emiAmount) || 0,
                emiDate: parseInt(formData.emiDate) || 1,
                totalEmis: parseInt(formData.totalEmis) || 12,
                paidEmis: 0,
                isLocked: false,
                createdAt: new Date().toISOString(),
                deviceStatus: {
                    status: 'pending',
                    technical: deviceType === 'IOS' ? { serial: formData.serialNumber } : {}
                }
            };

            const customerRes = await fetch(`${API_BASE_URL}/api/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerPayload)
            });

            if (!customerRes.ok) throw new Error('Failed to create customer');

            const qrRes = await fetch(`${API_BASE_URL}/api/devices/generate-qr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    enrollmentType: deviceType,
                    platform: deviceType === 'IOS' ? 'ios' : 'android'
                })
            });

            if (!qrRes.ok) throw new Error('Failed to generate QR');

            const qrResult = await qrRes.json();
            setQrData({
                ...qrResult,
                customerId,
                customerName: formData.name,
                imei: formData.imei1
            });
            setShowQR(true);
            toast.success('Customer created successfully!');

        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to create customer');
        } finally {
            setLoading(false);
        }
    };

    const getDeviceTypeInfo = () => {
        switch (deviceType) {
            case 'ANDROID_NEW':
                return { title: 'Fresh Android', color: 'green', icon: Smartphone };
            case 'ANDROID_EXISTING':
                return { title: 'Used Android', color: 'blue', icon: Tablet };
            case 'IOS':
                return { title: 'iPhone/iPad', color: 'gray', icon: Apple };
        }
    };

    const deviceInfo = getDeviceTypeInfo();
    const DeviceIcon = deviceInfo.icon;

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Add New Customer</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className={cn(
                                "text-xs",
                                deviceInfo.color === 'green' && 'bg-green-500',
                                deviceInfo.color === 'blue' && 'bg-blue-500',
                                deviceInfo.color === 'gray' && 'bg-gray-500',
                            )}>
                                <DeviceIcon className="w-3 h-3 mr-1" />
                                {deviceInfo.title}
                            </Badge>
                        </div>
                    </div>
                </div>

                {!showQR ? (
                    <div className="space-y-4">
                        {/* Photo Upload */}
                        <Card className="border-border/50">
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        onClick={() => photoInputRef.current?.click()}
                                        className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden bg-secondary/50 transition-all flex-shrink-0"
                                    >
                                        {formData.photoUrl ? (
                                            <img src={formData.photoUrl} alt="Customer" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera className="w-6 h-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    <div className="flex-1">
                                        <Label htmlFor="name">Customer Name *</Label>
                                        <Input id="name" name="name" placeholder="Full name" value={formData.name} onChange={handleInputChange} className="mt-1" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact & Address */}
                        <Card className="border-border/50">
                            <CardContent className="pt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="phoneNo">Phone *</Label>
                                        <Input id="phoneNo" name="phoneNo" placeholder="10 digits" value={formData.phoneNo} onChange={handleInputChange} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="aadharNo">Aadhar No</Label>
                                        <Input id="aadharNo" name="aadharNo" placeholder="12 digits" value={formData.aadharNo} onChange={handleInputChange} className="mt-1" />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea id="address" name="address" placeholder="Full address with city, state, PIN" value={formData.address} onChange={handleInputChange} className="mt-1 min-h-[80px]" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Device IMEI */}
                        <Card className="border-border/50">
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Smartphone className="w-4 h-4 text-primary" />
                                    <span className="font-semibold text-sm">Device Identification</span>
                                </div>

                                <div>
                                    <Label htmlFor="imei1">IMEI Number *</Label>
                                    <Input id="imei1" name="imei1" placeholder="15-digit IMEI" value={formData.imei1} onChange={handleInputChange} className="mt-1 font-mono" />
                                    <p className="text-[10px] text-muted-foreground mt-1">Dial *#06# on device to get IMEI</p>
                                </div>

                                {deviceType === 'IOS' && (
                                    <div>
                                        <Label htmlFor="serialNumber">Serial Number *</Label>
                                        <Input id="serialNumber" name="serialNumber" placeholder="e.g., C39DLHG8FY4L" value={formData.serialNumber} onChange={handleInputChange} className="mt-1 font-mono" />
                                        <p className="text-[10px] text-muted-foreground mt-1">Settings → General → About → Serial</p>
                                    </div>
                                )}

                                {/* Info note */}
                                <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-600">
                                        Model, SIM, Android Version will be <strong>auto-fetched</strong> when device connects with this IMEI.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Loan Details */}
                        <Card className="border-border/50">
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                    <span className="font-semibold text-sm">Loan Details</span>
                                </div>

                                <div>
                                    <Label htmlFor="financeName">Finance Provider</Label>
                                    <Input id="financeName" name="financeName" placeholder="e.g., Bajaj Finance" value={formData.financeName} onChange={handleInputChange} className="mt-1" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="totalAmount">Loan Amount (₹)</Label>
                                        <Input id="totalAmount" name="totalAmount" type="number" placeholder="50000" value={formData.totalAmount} onChange={handleInputChange} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="emiAmount">EMI (₹)</Label>
                                        <Input id="emiAmount" name="emiAmount" type="number" placeholder="5000" value={formData.emiAmount} onChange={handleInputChange} className="mt-1" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="emiDate">EMI Date</Label>
                                        <Input id="emiDate" name="emiDate" type="number" min="1" max="31" placeholder="5" value={formData.emiDate} onChange={handleInputChange} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="totalEmis">Total EMIs</Label>
                                        <Input id="totalEmis" name="totalEmis" type="number" placeholder="12" value={formData.totalEmis} onChange={handleInputChange} className="mt-1" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Documents */}
                        <Card className="border-border/50">
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Upload className="w-4 h-4 text-primary" />
                                    <span className="font-semibold text-sm">Documents (Optional)</span>
                                </div>
                                <div
                                    onClick={() => docInputRef.current?.click()}
                                    className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                                >
                                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                                    <p className="text-xs text-muted-foreground">Upload ID proofs</p>
                                </div>
                                <input ref={docInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleDocUpload} />
                                {formData.documents.length > 0 && (
                                    <div className="flex gap-2 mt-3 overflow-x-auto">
                                        {formData.documents.map((doc, i) => (
                                            <img key={i} src={doc} alt={`Doc ${i + 1}`} className="w-16 h-12 object-cover rounded border flex-shrink-0" />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Submit */}
                        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Creating...' : 'Generate QR Code'}
                        </Button>
                    </div>
                ) : (
                    /* QR Display */
                    <Card className="border-border/50">
                        <CardContent className="pt-6 text-center space-y-4">
                            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                                <Check className="w-7 h-7 text-green-500" />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-foreground">Customer Created!</h2>
                                <p className="text-sm text-muted-foreground">Scan QR on device</p>
                            </div>

                            <div className="bg-white rounded-xl p-4 inline-block border shadow">
                                <QRCodeSVG value={qrData.qrString} size={180} level="H" includeMargin />
                            </div>

                            <div>
                                <p className="font-semibold">{qrData.customerName}</p>
                                <p className="text-xs text-muted-foreground font-mono">IMEI: {qrData.imei}</p>
                                <Badge className={cn("mt-2", deviceInfo.color === 'green' ? "bg-green-500" : deviceInfo.color === 'blue' ? "bg-blue-500" : "bg-gray-500")}>
                                    {deviceInfo.title}
                                </Badge>
                            </div>

                            <div className="bg-secondary/50 rounded-lg p-3 text-left text-xs">
                                <p className="font-bold text-muted-foreground mb-1">NEXT STEPS:</p>
                                {deviceType === 'ANDROID_NEW' && <p>Factory reset → Tap 6 times on welcome → Scan QR</p>}
                                {deviceType === 'ANDROID_EXISTING' && <p>Install APK → Open app → Scan QR</p>}
                                {deviceType === 'IOS' && <p>App Store → Install our app → Scan QR</p>}
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>Dashboard</Button>
                                <Button className="flex-1" onClick={() => navigate(`/customers/${qrData.customerId}`)}>View</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    User,
    Phone,
    CreditCard,
    Smartphone,
    Upload,
    Camera,
    QrCode,
    ArrowLeft,
    Building,
    MapPin,
    Hash,
    Calendar,
    Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';

export default function AddCustomer() {
    const navigate = useNavigate();
    const photoInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [qrData, setQrData] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phoneNo: '',
        aadharNo: '',
        address: '',
        imei1: '',
        imei2: '',
        mobileModel: '',
        financeName: '',
        totalAmount: '',
        emiAmount: '',
        emiDate: '',
        totalEmis: '',
        photoUrl: '',
        documents: [] as string[],
        enrollmentType: 'ANDROID_NEW'
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const customerId = generateCustomerId();

            // 1. Create customer
            const customerPayload = {
                id: customerId,
                ...formData,
                totalAmount: parseFloat(formData.totalAmount) || 0,
                emiAmount: parseFloat(formData.emiAmount) || 0,
                emiDate: parseInt(formData.emiDate) || 1,
                totalEmis: parseInt(formData.totalEmis) || 12,
                paidEmis: 0,
                isLocked: false,
                createdAt: new Date().toISOString()
            };

            const customerRes = await fetch(`${API_BASE_URL}/api/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerPayload)
            });

            if (!customerRes.ok) {
                throw new Error('Failed to create customer');
            }

            // 2. Generate QR code
            const qrRes = await fetch(`${API_BASE_URL}/api/devices/generate-qr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    enrollmentType: formData.enrollmentType,
                    platform: formData.enrollmentType === 'IOS' ? 'ios' : 'android'
                })
            });

            if (!qrRes.ok) {
                throw new Error('Failed to generate QR');
            }

            const qrResult = await qrRes.json();
            setQrData({
                ...qrResult,
                customerId
            });

            toast.success('Customer created successfully!');
            setStep(3);

        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to create customer');
        } finally {
            setLoading(false);
        }
    };

    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                    <div className={`
            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
            ${step >= s
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground'
                        }
          `}>
                        {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    {s < 3 && (
                        <div className={`w-12 h-1 mx-1 rounded ${step > s ? 'bg-primary' : 'bg-secondary'}`} />
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Add New Customer</h1>
                        <p className="text-sm text-muted-foreground">
                            {step === 1 && 'Enter customer details'}
                            {step === 2 && 'Review and select device type'}
                            {step === 3 && 'QR code generated'}
                        </p>
                    </div>
                </div>

                <StepIndicator />

                {/* Step 1: Customer Details */}
                {step === 1 && (
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Customer Information
                            </CardTitle>
                            <CardDescription>Enter the customer's personal and loan details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Photo Upload */}
                            <div className="flex flex-col items-center gap-4">
                                <div
                                    onClick={() => photoInputRef.current?.click()}
                                    className="w-32 h-32 rounded-2xl border-2 border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden bg-secondary/50 transition-all"
                                >
                                    {formData.photoUrl ? (
                                        <img src={formData.photoUrl} alt="Customer" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center">
                                            <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                            <span className="text-xs text-muted-foreground">Add Photo</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                />
                            </div>

                            {/* Personal Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Enter full name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phoneNo">Phone Number *</Label>
                                    <Input
                                        id="phoneNo"
                                        name="phoneNo"
                                        placeholder="10-digit number"
                                        value={formData.phoneNo}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="aadharNo">Aadhar Number</Label>
                                    <Input
                                        id="aadharNo"
                                        name="aadharNo"
                                        placeholder="12-digit Aadhar"
                                        value={formData.aadharNo}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        placeholder="Full address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            {/* Device Info */}
                            <div className="pt-4 border-t border-border">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-primary" />
                                    Device Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="imei1">IMEI 1 *</Label>
                                        <Input
                                            id="imei1"
                                            name="imei1"
                                            placeholder="15-digit IMEI"
                                            value={formData.imei1}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="imei2">IMEI 2 (Optional)</Label>
                                        <Input
                                            id="imei2"
                                            name="imei2"
                                            placeholder="15-digit IMEI"
                                            value={formData.imei2}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="mobileModel">Mobile Model</Label>
                                        <Input
                                            id="mobileModel"
                                            name="mobileModel"
                                            placeholder="e.g., Samsung Galaxy A32"
                                            value={formData.mobileModel}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* EMI Info */}
                            <div className="pt-4 border-t border-border">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                    EMI Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="financeName">Finance Provider</Label>
                                        <Input
                                            id="financeName"
                                            name="financeName"
                                            placeholder="e.g., Bajaj Finance"
                                            value={formData.financeName}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="totalAmount">Total Loan Amount (₹)</Label>
                                        <Input
                                            id="totalAmount"
                                            name="totalAmount"
                                            type="number"
                                            placeholder="50000"
                                            value={formData.totalAmount}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="emiAmount">Monthly EMI (₹)</Label>
                                        <Input
                                            id="emiAmount"
                                            name="emiAmount"
                                            type="number"
                                            placeholder="5000"
                                            value={formData.emiAmount}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="emiDate">EMI Date (Day of Month)</Label>
                                        <Input
                                            id="emiDate"
                                            name="emiDate"
                                            type="number"
                                            min="1"
                                            max="31"
                                            placeholder="5"
                                            value={formData.emiDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="totalEmis">Total EMIs</Label>
                                        <Input
                                            id="totalEmis"
                                            name="totalEmis"
                                            type="number"
                                            placeholder="12"
                                            value={formData.totalEmis}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Document Upload */}
                            <div className="pt-4 border-t border-border">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-primary" />
                                    Documents (Optional)
                                </h3>
                                <div
                                    onClick={() => docInputRef.current?.click()}
                                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                                >
                                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Click to upload ID proofs</p>
                                </div>
                                <input
                                    ref={docInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleDocUpload}
                                />
                                {formData.documents.length > 0 && (
                                    <div className="flex gap-2 mt-4 overflow-x-auto">
                                        {formData.documents.map((doc, i) => (
                                            <img key={i} src={doc} alt={`Doc ${i + 1}`} className="w-20 h-14 object-cover rounded border" />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full mt-6"
                                size="lg"
                                onClick={() => setStep(2)}
                                disabled={!formData.name || !formData.phoneNo || !formData.imei1}
                            >
                                Continue
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Device Type Selection */}
                {step === 2 && (
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-primary" />
                                Select Device Type
                            </CardTitle>
                            <CardDescription>Choose how you want to provision this device</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Enrollment Type Options */}
                            <div className="grid gap-4">
                                <div
                                    onClick={() => setFormData({ ...formData, enrollmentType: 'ANDROID_NEW' })}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.enrollmentType === 'ANDROID_NEW'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                            <Smartphone className="w-6 h-6 text-green-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-foreground">Fresh Android Device</h4>
                                            <p className="text-sm text-muted-foreground">Factory reset device. Scan QR on welcome screen (tap 6 times).</p>
                                            <span className="text-xs text-green-500 font-medium">Recommended for new devices</span>
                                        </div>
                                        {formData.enrollmentType === 'ANDROID_NEW' && (
                                            <Check className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                </div>

                                <div
                                    onClick={() => setFormData({ ...formData, enrollmentType: 'ANDROID_EXISTING' })}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.enrollmentType === 'ANDROID_EXISTING'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                            <Smartphone className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-foreground">Already Used Android</h4>
                                            <p className="text-sm text-muted-foreground">Device already in use. Install APK manually or scan QR in app.</p>
                                            <span className="text-xs text-blue-500 font-medium">For devices with existing data</span>
                                        </div>
                                        {formData.enrollmentType === 'ANDROID_EXISTING' && (
                                            <Check className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                </div>

                                <div
                                    onClick={() => setFormData({ ...formData, enrollmentType: 'IOS' })}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.enrollmentType === 'IOS'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-500/10 flex items-center justify-center">
                                            <Smartphone className="w-6 h-6 text-gray-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-foreground">iOS Device (iPhone/iPad)</h4>
                                            <p className="text-sm text-muted-foreground">Limited control. User installs app from App Store.</p>
                                            <span className="text-xs text-gray-500 font-medium">Limited features on iOS</span>
                                        </div>
                                        {formData.enrollmentType === 'IOS' && (
                                            <Check className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="mt-6 p-4 bg-secondary/50 rounded-xl">
                                <h4 className="font-semibold mb-2">Summary</h4>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p><strong>Customer:</strong> {formData.name}</p>
                                    <p><strong>Phone:</strong> {formData.phoneNo}</p>
                                    <p><strong>Device:</strong> {formData.mobileModel || formData.imei1}</p>
                                    <p><strong>Loan:</strong> ₹{formData.totalAmount} @ ₹{formData.emiAmount}/month</p>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                                <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                                    {loading ? 'Creating...' : 'Create & Generate QR'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: QR Code Generated */}
                {step === 3 && qrData && (
                    <Card className="border-border/50">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-500" />
                            </div>
                            <CardTitle>Customer Created Successfully!</CardTitle>
                            <CardDescription>
                                Scan this QR code on the device to complete enrollment
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* QR Code */}
                            <div className="flex flex-col items-center bg-white rounded-2xl p-6 border">
                                <QRCodeSVG
                                    value={qrData.qrString}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                                <div className="mt-4 text-center">
                                    <p className="text-sm font-semibold text-gray-700">
                                        {qrData.enrollmentType === 'ANDROID_NEW' && '📱 Scan on Fresh Device Welcome Screen'}
                                        {qrData.enrollmentType === 'ANDROID_EXISTING' && '📱 Scan in SecureFinance App'}
                                        {qrData.enrollmentType === 'IOS' && '📱 Scan to open App Store'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Customer ID: {qrData.customerId}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Expires: {new Date(qrData.expiresAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Device Type Badge */}
                            <div className="flex justify-center">
                                <span className={`
                  px-4 py-2 rounded-full text-sm font-semibold
                  ${qrData.enrollmentType === 'ANDROID_NEW' ? 'bg-green-100 text-green-700' : ''}
                  ${qrData.enrollmentType === 'ANDROID_EXISTING' ? 'bg-blue-100 text-blue-700' : ''}
                  ${qrData.enrollmentType === 'IOS' ? 'bg-gray-100 text-gray-700' : ''}
                `}>
                                    {qrData.enrollmentType.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate(`/customers/${qrData.customerId}`)}
                                >
                                    View Customer
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        setFormData({
                                            name: '', phoneNo: '', aadharNo: '', address: '',
                                            imei1: '', imei2: '', mobileModel: '', financeName: '',
                                            totalAmount: '', emiAmount: '', emiDate: '', totalEmis: '',
                                            photoUrl: '', documents: [], enrollmentType: 'ANDROID_NEW'
                                        });
                                        setQrData(null);
                                        setStep(1);
                                    }}
                                >
                                    Add Another
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => navigate('/')}
                            >
                                Back to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

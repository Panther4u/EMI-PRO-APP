import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, User, Phone, Mail, MapPin, ScanLine, Wifi, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';
import { getApiUrl } from '@/config/api';
import { Loader2, QrCode, Download, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AddCustomer() {
    const navigate = useNavigate();
    const { addCustomer } = useDevice();
    const [loading, setLoading] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [newCustomerId, setNewCustomerId] = useState<string | null>(null);
    const [qrData, setQrData] = useState<string>('');
    const [apkName, setApkName] = useState<string>('securefinance-admin-v2.1.2.apk');
    const { customers } = useDevice();

    const adminUserStr = localStorage.getItem('adminUser');
    const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
    const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';
    const deviceLimit = adminUser?.deviceLimit || 0;
    const currentCount = customers?.length || 0;
    const isAtLimit = !isSuperAdmin && deviceLimit > 0 && currentCount >= deviceLimit;

    const [formData, setFormData] = useState({
        name: '',
        phoneNo: '',
        email: '',
        photoUrl: '',
        address: '',
        brand: '',
        modelName: '',
        imei1: '',
        totalAmount: '15000',
        downPayment: '5000',
        emiAmount: '1000',
        emiTenure: '10'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // ... validation ...
            if (!formData.name || !formData.phoneNo) {
                toast.error('Name and Phone are required');
                setLoading(false);
                return;
            }

            if (!formData.imei1) {
                toast.error('IMEI 1 is required for device verification');
                setLoading(false);
                return;
            }

            // Get current admin from localStorage
            const adminUserStr = localStorage.getItem('adminUser');
            const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
            const dealerId = adminUser?._id;

            const customerId = `CUS-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

            const payload = {
                id: customerId,
                name: formData.name,
                phoneNo: formData.phoneNo,
                email: formData.email,
                address: formData.address,
                imei1: formData.imei1,
                brand: formData.brand,
                modelName: formData.modelName,
                totalAmount: Number(formData.totalAmount),
                downPayment: Number(formData.downPayment),
                emiAmount: Number(formData.emiAmount),
                totalEmis: Number(formData.emiTenure), // Map emiTenure to totalEmis
                emiDate: new Date().getDate(),
                deviceStatus: { status: 'pending' },
                dealerId: dealerId,
                photoUrl: formData.photoUrl
            };

            await addCustomer(payload);
            setNewCustomerId(customerId);

            // Fetch QR Payload immediately
            const qrResponse = await fetch(getApiUrl(`/api/provisioning/payload/${customerId}`));
            if (qrResponse.ok) {
                const data = await qrResponse.json();
                setQrData(JSON.stringify(data));
                setShowQRModal(true);
                toast.success('🚀 Device Registered! QR Ready.');
            } else {
                toast.success('✅ Device Registered (QR failed, view in Details)');
                navigate('/customers');
            }
        } catch (err: any) {
            // ... catch block ...
            const errorMessage = err?.message || 'Failed to add customer';

            if (errorMessage.includes('limit reached')) {
                toast.error('🚨 Limit Reached: ' + errorMessage);
            } else if (errorMessage.includes('Duplicate')) {
                toast.error('⚠️ Device Already Registered');
            } else {
                toast.error(errorMessage);
            }
            console.error('Add customer error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 pt-12 pb-4 border-b border-slate-100 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
                <h1 className="text-lg font-bold text-slate-900">Provision Device</h1>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
                {isAtLimit && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-black text-red-900">Device Limit Reached</p>
                            <p className="text-[11px] font-bold text-red-600 mt-0.5 leading-relaxed uppercase tracking-tight">
                                You have used {currentCount} of {deviceLimit} device slots. Contact support to increase your capacity.
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 pl-1">Customer Info</p>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">

                        <div className="flex gap-4">
                            {/* Photo Side UI */}
                            <div className="w-24 shrink-0 aspect-[3/4] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                                {formData.photoUrl ? (
                                    <img src={formData.photoUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <Camera className="w-6 h-6 text-slate-300" />
                                        <span className="text-[8px] font-bold text-slate-300 uppercase">Photo</span>
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm p-1 border-t border-slate-100">
                                    <Input
                                        name="photoUrl"
                                        placeholder="URL"
                                        value={formData.photoUrl}
                                        onChange={handleChange}
                                        className="h-5 text-[9px] border-0 bg-transparent text-center p-0 placeholder:text-slate-300 focus-visible:ring-0"
                                    />
                                </div>
                            </div>

                            {/* Name & Phone Side */}
                            <div className="flex-1 space-y-3">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="pl-11 h-12 bg-slate-50 border-0 rounded-xl font-semibold" />
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input name="phoneNo" placeholder="Phone Number" type="tel" value={formData.phoneNo} onChange={handleChange} className="pl-11 h-12 bg-slate-50 border-0 rounded-xl font-medium" />
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input name="email" placeholder="Email Address (Optional)" type="email" value={formData.email} onChange={handleChange} className="pl-11 h-12 bg-slate-50 border-0 rounded-xl" />
                        </div>

                        {/* Address Textarea */}
                        <div className="relative">
                            <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                            <Textarea
                                name="address"
                                placeholder="Full Address / City"
                                value={formData.address}
                                onChange={handleChange}
                                className="pl-11 min-h-[80px] bg-slate-50 border-0 rounded-xl resize-none py-3"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 pl-1">Device Details</p>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        {/* Brand Select */}
                        <div className="space-y-2">
                            <label className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-bold uppercase tracking-wider">Brand</label>
                            <Select onValueChange={(value) => setFormData({ ...formData, brand: value })}>
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-0 font-semibold text-slate-700">
                                    <SelectValue placeholder="Select Brand" />
                                </SelectTrigger>
                                <SelectContent>
                                    {['Samsung', 'Xiaomi', 'Vivo', 'Oppo', 'Realme', 'OnePlus', 'Motorola', 'Apple', 'Other'].map(brand => (
                                        <SelectItem key={brand} value={brand} className="font-medium">{brand}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* IMEI Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-bold uppercase tracking-wider">IMEI 1</label>
                            <div className="relative">
                                <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    name="imei1"
                                    placeholder="Enter IMEI 1 (Mandatory)"
                                    maxLength={15}
                                    value={formData.imei1}
                                    onChange={handleChange}
                                    className="pl-11 h-12 bg-slate-50 border-0 rounded-xl font-mono tracking-widest font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        {/* Auto-Fetch Placeholder */}
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 border-dashed flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Wifi className="w-5 h-5 text-blue-600 animate-pulse" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-blue-900">Auto-Fetch Enabled</p>
                                <p className="text-[10px] text-blue-600/80 font-medium">Model & Serial will sync after device verification</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 pl-1">Finance Plan</p>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 pl-1">Total Loan</label>
                                <Input name="totalAmount" type="number" value={formData.totalAmount} onChange={handleChange} className="h-12 bg-slate-50 border-0 rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 pl-1">Down Pay</label>
                                <Input name="downPayment" type="number" value={formData.downPayment} onChange={handleChange} className="h-12 bg-slate-50 border-0 rounded-xl" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 pl-1">EMI Amount</label>
                                <Input name="emiAmount" type="number" value={formData.emiAmount} onChange={handleChange} className="h-12 bg-slate-50 border-0 rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 pl-1">Months</label>
                                <Input name="emiTenure" type="number" value={formData.emiTenure} onChange={handleChange} className="h-12 bg-slate-50 border-0 rounded-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-2xl text-lg font-bold bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/10 mt-6"
                >
                    {loading ? 'Creating Profile...' : 'Generate New QR'}
                </Button>

            </form>

            {/* Success QR Modal */}
            {showQRModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">QR Code Generated</h2>
                            <p className="text-sm text-slate-500 font-medium">Device Profile Created Successfully</p>

                            <div className="p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100 shadow-inner">
                                {qrData ? (
                                    <QRCodeSVG value={qrData} size={200} level="H" />
                                ) : (
                                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 w-full pt-4">
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1">How to setup?</p>
                                    <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                                        Factory reset the device. On the "Welcome" screen, tap the screen **6 times** in same spot to activate QR scanner.
                                    </p>
                                </div>

                                <Button
                                    onClick={() => navigate('/customers')}
                                    className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg"
                                >
                                    Finish & Go to Fleet
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => setShowQRModal(false)}
                                    className="w-full text-sm text-slate-400 font-bold"
                                >
                                    Close Preview
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

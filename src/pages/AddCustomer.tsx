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

export default function AddCustomer() {
    const navigate = useNavigate();
    const { addCustomer } = useDevice();
    const { currentAdmin } = useAuth();
    const [loading, setLoading] = useState(false);

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
            // Validation
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

            if (formData.imei1.length < 15) {
                toast.error('IMEI must be 15 digits');
                setLoading(false);
                return;
            }

            const newCustomerUser = {
                name: formData.name,
                username: formData.phoneNo,
                password: 'password123',
                role: 'user',
                email: formData.email
            };

            const payload = {
                ...formData,
                deviceStatus: { status: 'pending' }, // Valid enum: pending, installing, connected, online, offline, error, warning, ADMIN_INSTALLED
                adminId: currentAdmin?.id,
                user: newCustomerUser
            };

            await addCustomer(payload);
            toast.success('✅ Device Provisioned Successfully!');
            navigate('/customers');
        } catch (err) {
            // Show specific error message from backend
            const errorMessage = err instanceof Error ? err.message : 'Failed to add customer';
            toast.error(errorMessage);
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
        </div>
    );
}

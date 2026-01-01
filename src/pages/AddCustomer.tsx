import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Smartphone, User, Phone, Mail, MapPin, ScanLine, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AddCustomer() {
    const navigate = useNavigate();
    const { addCustomer } = useDevice();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phoneNo: '',
        email: '',
        address: '',
        modelName: 'Samsung A54', // Default for now
        imei1: '',
        totalAmount: '15000',
        downPayment: '5000',
        emiAmount: '1000',
        emiTenure: '10'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Validate
            if (!formData.name || !formData.phoneNo) {
                toast.error('Name, Phone are required');
                return;
            }

            const newCustomerUser = {
                name: formData.name,
                username: formData.phoneNo, // using phone as username for user apk login if needed
                password: 'password123', // default
                role: 'user',
                email: formData.email
            };

            const payload = {
                ...formData,
                deviceStatus: { status: 'ACTIVE' },
                adminId: user?.id,
                user: newCustomerUser
            };

            await addCustomer(payload);
            toast.success('Device Provisioned Successfully');
            navigate('/customers');
        } catch (err) {
            toast.error('Failed to add customer');
            console.error(err);
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
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="pl-11 h-12 bg-slate-50 border-0 rounded-xl" />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input name="phoneNo" placeholder="Phone Number" type="tel" value={formData.phoneNo} onChange={handleChange} className="pl-11 h-12 bg-slate-50 border-0 rounded-xl" />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input name="email" placeholder="Email Address (Optional)" type="email" value={formData.email} onChange={handleChange} className="pl-11 h-12 bg-slate-50 border-0 rounded-xl" />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input name="address" placeholder="City / Address" value={formData.address} onChange={handleChange} className="pl-11 h-12 bg-slate-50 border-0 rounded-xl" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 pl-1">Device Details</p>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input name="modelName" placeholder="Device Model" value={formData.modelName} onChange={handleChange} className="pl-11 h-12 bg-slate-50 border-0 rounded-xl" />
                        </div>
                        <div className="relative">
                            <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input name="imei1" placeholder="IMEI Number (15 Digits)" maxLength={15} value={formData.imei1} onChange={handleChange} className="pl-11 h-12 bg-slate-50 border-0 rounded-xl font-mono tracking-widest" />
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

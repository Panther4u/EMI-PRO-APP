import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import {
    ArrowLeft, Shield, Lock, Unlock, smartphone,
    MapPin, Clock, Trash2, RotateCcw, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

export default function CustomerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { customers, deleteCustomer, toggleLock } = useDevice();
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customers && id) {
            const found = customers.find((c: any) => c.id === id);
            setCustomer(found);
        }
    }, [customers, id]);

    const handleLockToggle = async () => {
        if (!customer) return;
        try {
            setLoading(true);
            const newState = !customer.isLocked;
            await toggleLock(customer.id, newState, `Manual ${newState ? 'Lock' : 'Unlock'}`);
            toast.success(`Device ${newState ? 'Locked' : 'Unlocked'}`);
        } catch (e) {
            toast.error('Action failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to remove this device permanently?')) return;
        try {
            await deleteCustomer(id!);
            toast.success('Device removed');
            navigate('/customers');
        } catch (e) {
            toast.error('Delete failed');
        }
    };

    if (!customer) return <div className="p-10 text-center text-slate-400">Loading details...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header with quick back */}
            <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center z-20">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            {/* Hero Control Section */}
            <div className={cn(
                "min-h-[380px] w-full relative flex flex-col items-center justify-center pt-20 pb-10 px-6 transition-colors duration-500",
                customer.isLocked ? "bg-red-500" : "bg-primary"
            )}>
                {/* Background Ambient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-[32px] bg-white/20 backdrop-blur-lg border border-white/30 flex items-center justify-center shadow-2xl mb-6">
                        {customer.isLocked ? (
                            <Lock className="w-10 h-10 text-white fill-white/20" />
                        ) : (
                            <Unlock className="w-10 h-10 text-white fill-white/20" />
                        )}
                    </div>

                    <h1 className="text-3xl font-black text-white tracking-tight text-center mb-1">{customer.name}</h1>
                    <p className="text-white/80 font-medium mb-8 text-sm">{customer.modelName || 'Android Device'}</p>

                    {/* Big Toggle Button */}
                    <button
                        onClick={handleLockToggle}
                        disabled={loading}
                        className="h-14 px-8 bg-white rounded-full shadow-xl flex items-center gap-3 active:scale-95 transition-transform"
                    >
                        <span className={cn("font-bold uppercase tracking-widest text-sm", customer.isLocked ? "text-red-500" : "text-primary")}>
                            {loading ? "Processing..." : (customer.isLocked ? "Tap to Unlock" : "Tap to Lock")}
                        </span>
                    </button>
                </div>
            </div>

            {/* Details Sheet */}
            <div className="flex-1 -mt-8 bg-slate-50 rounded-t-[32px] relative z-10 p-6 space-y-6 pb-24">

                {/* Status Bar */}
                <div className="flex gap-4">
                    <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">EMI Status</p>
                        <p className="text-lg font-black text-emerald-500">Paid 6/12</p>
                    </div>
                    <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Sync</p>
                        <p className="text-sm font-bold text-slate-700">2m ago</p>
                    </div>
                </div>

                <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Device Info</h3>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-500">IMEI</span>
                        <span className="text-xs font-mono font-bold text-slate-700">{customer.imei1 || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-500">Phone</span>
                        <span className="text-xs font-bold text-slate-700">{customer.phoneNo}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-500">Installed</span>
                        <span className="text-xs font-bold text-emerald-600">Yes</span>
                    </div>
                </div>

                {/* QR Code Mini */}
                <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900">Device QR Backup</h3>
                        <p className="text-xs text-slate-400">Scan to re-enroll device</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <QRCodeSVG value={JSON.stringify({
                            customerId: customer.id,
                            serverUrl: 'https://emi-pro-app.onrender.com'
                        })} size={48} />
                    </div>
                </div>

                {/* Danger Zone */}
                <Button
                    variant="ghost"
                    onClick={handleDelete}
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 h-12 rounded-xl"
                >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Device Logic
                </Button>

            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import {
    ArrowLeft, Shield, Lock, Unlock, Smartphone,
    MapPin, Clock, Trash2, RotateCcw, Copy, CheckCircle2,
    Circle, Loader2, Wifi, Battery, Signal, HardDrive,
    AlertCircle, QrCode, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { getApiUrl } from '@/config/api';

export default function CustomerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { customers, deleteCustomer, toggleLock } = useDevice();
    const [customer, setCustomer] = useState<any>(null);
    const [deviceInfo, setDeviceInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrData, setQrData] = useState<string>('');

    const fetchDeviceInfo = async (customerId: string) => {
        try {
            const response = await fetch(getApiUrl(`/api/devices?customerId=${customerId}`));
            if (response.ok) {
                const devices = await response.json();
                if (devices && devices.length > 0) {
                    setDeviceInfo(devices[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch device info:', error);
        }
    };

    useEffect(() => {
        if (customers && id) {
            const found = customers.find((c: any) => c.id === id);
            setCustomer(found);

            // Fetch device info from backend
            if (found) {
                fetchDeviceInfo(id);
            }
        }
    }, [customers, id, fetchDeviceInfo]);

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

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const fetchQRData = async () => {
        if (!customer?.id) return;
        try {
            const response = await fetch(getApiUrl(`/api/provisioning/payload/${customer.id}`));
            if (response.ok) {
                const payload = await response.json();
                setQrData(JSON.stringify(payload));
            } else {
                toast.error('Failed to generate QR code');
            }
        } catch (error) {
            console.error('Failed to fetch QR data:', error);
            toast.error('Failed to generate QR code');
        }
    };

    // Fetch QR data when modal opens
    useEffect(() => {
        if (showQRModal && !qrData) {
            fetchQRData();
        }
    }, [showQRModal, qrData, fetchQRData]); // Added fetchQRData to dependency array

    if (!customer) return <div className="p-10 text-center text-slate-400">Loading details...</div>;

    // Provisioning Steps
    { id: 'qrScanned', label: 'QR Code Scanned', completed: customer.deviceStatus?.steps?.qrScanned },
    { id: 'permissionsGranted', label: 'Permissions Granted', completed: customer.deviceStatus?.steps?.permissionsGranted },
    { id: 'detailsFetched', label: 'Device Details Fetched', completed: customer.deviceStatus?.steps?.detailsFetched },
    { id: 'imeiVerified', label: 'IMEI Verified', completed: customer.deviceStatus?.steps?.imeiVerified },
    { id: 'deviceBound', label: 'Device Bound', completed: customer.deviceStatus?.steps?.deviceBound },
    ];

    const completedSteps = provisioningSteps.filter(s => s.completed).length;
    const totalSteps = provisioningSteps.length;
    const progress = (completedSteps / totalSteps) * 100;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 pt-12 pb-4 border-b border-slate-100 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-slate-900">{customer.name}</h1>
                    <p className="text-xs text-slate-400">{customer.phoneNo}</p>
                </div>
                <Badge variant={customer.isLocked ? "destructive" : "default"} className="rounded-full">
                    {customer.isLocked ? 'Locked' : 'Active'}
                </Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">

                {/* Lock/Unlock Control */}
                <div className={cn(
                    "rounded-[28px] p-6 text-white relative overflow-hidden",
                    customer.isLocked ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-primary to-blue-600"
                )}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                {customer.isLocked ? <Lock className="w-8 h-8" /> : <Unlock className="w-8 h-8" />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black">Device {customer.isLocked ? 'Locked' : 'Unlocked'}</h3>
                                <p className="text-white/80 text-sm">Tap button to toggle</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleLockToggle}
                            disabled={loading}
                            className="w-full h-12 bg-white text-slate-900 hover:bg-white/90 rounded-xl font-bold"
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {loading ? "Processing..." : (customer.isLocked ? "Unlock Device" : "Lock Device")}
                        </Button>
                    </div>
                </div>

                {/* Provisioning Progress */}
                <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Setup Progress</h3>
                        <span className="text-xs font-bold text-primary">{completedSteps}/{totalSteps} Steps</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    {/* Steps List */}
                    <div className="space-y-2">
                        {provisioningSteps.map((step, index) => (
                            <div key={step.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                {step.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                ) : (
                                    <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                                )}
                                <span className={cn(
                                    "text-sm font-medium flex-1",
                                    step.completed ? "text-slate-700" : "text-slate-400"
                                )}>
                                    {step.label}
                                </span>
                                {!step.completed && index === completedSteps && (
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Device Technical Info */}
                {(deviceInfo || customer.deviceStatus?.technical) && (
                    <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Smartphone className="w-4 h-4" /> Device Information
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Brand */}
                            <InfoCard
                                label="Brand"
                                value={deviceInfo?.brand || customer.deviceStatus?.technical?.brand || customer.brand || 'N/A'}
                                icon={<Smartphone className="w-4 h-4" />}
                            />

                            {/* Model */}
                            <InfoCard
                                label="Model"
                                value={deviceInfo?.model || customer.deviceStatus?.technical?.model || customer.modelName || 'N/A'}
                                icon={<Smartphone className="w-4 h-4" />}
                            />

                            {/* Android Version */}
                            <InfoCard
                                label="Android"
                                value={deviceInfo?.osVersion || customer.deviceStatus?.technical?.osVersion || 'N/A'}
                                icon={<Shield className="w-4 h-4" />}
                            />

                            {/* SDK Level */}
                            <InfoCard
                                label="SDK Level"
                                value={deviceInfo?.sdkLevel || 'N/A'}
                                icon={<Shield className="w-4 h-4" />}
                            />

                            {/* Battery */}
                            {deviceInfo?.batteryLevel && (
                                <InfoCard
                                    label="Battery"
                                    value={`${deviceInfo.batteryLevel}%`}
                                    icon={<Battery className="w-4 h-4" />}
                                />
                            )}

                            {/* Network */}
                            {deviceInfo?.networkType && (
                                <InfoCard
                                    label="Network"
                                    value={deviceInfo.networkType}
                                    icon={<Signal className="w-4 h-4" />}
                                />
                            )}
                        </div>

                        {/* IMEI Section */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Device IDs</h4>

                            {/* IMEI 1 */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <span className="text-xs font-bold text-slate-500">IMEI 1</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-slate-700">
                                        {deviceInfo?.imei1 || customer.imei1 || 'N/A'}
                                    </span>
                                    {(deviceInfo?.imei1 || customer.imei1) && (
                                        <button
                                            onClick={() => copyToClipboard(deviceInfo?.imei1 || customer.imei1, 'IMEI 1')}
                                            className="p-1 hover:bg-slate-200 rounded"
                                        >
                                            <Copy className="w-3 h-3 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* IMEI 2 */}
                            {(deviceInfo?.imei2 || customer.imei2) && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <span className="text-xs font-bold text-slate-500">IMEI 2</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold text-slate-700">
                                            {deviceInfo?.imei2 || customer.imei2}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(deviceInfo?.imei2 || customer.imei2, 'IMEI 2')}
                                            className="p-1 hover:bg-slate-200 rounded"
                                        >
                                            <Copy className="w-3 h-3 text-slate-400" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Android ID */}
                            {(deviceInfo?.androidId || customer.deviceStatus?.technical?.androidId) && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <span className="text-xs font-bold text-slate-500">Android ID</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold text-slate-700">
                                            {(deviceInfo?.androidId || customer.deviceStatus?.technical?.androidId).substring(0, 16)}...
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(deviceInfo?.androidId || customer.deviceStatus?.technical?.androidId, 'Android ID')}
                                            className="p-1 hover:bg-slate-200 rounded"
                                        >
                                            <Copy className="w-3 h-3 text-slate-400" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SIM Info */}
                        {(deviceInfo?.sim1 || deviceInfo?.sim2) && (
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Smartphone className="w-3 h-3" /> SIM Cards
                                </h4>

                                {deviceInfo?.sim1?.isActive && (
                                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500">SIM 1</span>
                                            <Badge variant="outline" className="text-[10px] h-5">Active</Badge>
                                        </div>
                                        <p className="text-xs text-slate-600">{deviceInfo.sim1.operator || 'Unknown'}</p>
                                        {deviceInfo.sim1.phoneNumber && (
                                            <p className="text-xs font-mono text-slate-500">{deviceInfo.sim1.phoneNumber}</p>
                                        )}
                                    </div>
                                )}

                                {deviceInfo?.sim2?.isActive && (
                                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500">SIM 2</span>
                                            <Badge variant="outline" className="text-[10px] h-5">Active</Badge>
                                        </div>
                                        <p className="text-xs text-slate-600">{deviceInfo.sim2.operator || 'Unknown'}</p>
                                        {deviceInfo.sim2.phoneNumber && (
                                            <p className="text-xs font-mono text-slate-500">{deviceInfo.sim2.phoneNumber}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Storage Info */}
                        {deviceInfo?.totalStorage && (
                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-500">Storage</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">
                                        {deviceInfo.availableStorage} / {deviceInfo.totalStorage}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Last Seen */}
                <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <div>
                            <p className="text-xs font-bold text-slate-500">Last Seen</p>
                            <p className="text-sm font-bold text-slate-700">
                                {deviceInfo?.lastSeenAt ? new Date(deviceInfo.lastSeenAt).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* QR Code Button */}
                <Button
                    variant="outline"
                    onClick={() => setShowQRModal(true)}
                    className="w-full h-12 rounded-xl border-2 border-dashed"
                >
                    <QrCode className="w-4 h-4 mr-2" /> View Setup QR Code
                </Button>

                {/* Danger Zone */}
                <Button
                    variant="ghost"
                    onClick={handleDelete}
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 h-12 rounded-xl"
                >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Device
                </Button>

            </div>

            {/* QR Modal */}
            {showQRModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowQRModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-black">Setup QR Code</h2>
                            <button onClick={() => setShowQRModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                <span className="text-slate-500 font-bold">✕</span>
                            </button>
                        </div>

                        <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl">
                            {qrData ? (
                                <QRCodeSVG
                                    value={qrData}
                                    size={200}
                                    level="H"
                                />
                            ) : (
                                <div className="w-[200px] h-[200px] flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                </div>
                            )}
                            <p className="text-xs text-slate-500 mt-4 text-center">
                                Scan during factory reset setup (tap 6 times on welcome screen)
                            </p>
                        </div>

                        <Button variant="outline" className="w-full" onClick={() => window.open(`https://emi-pro-app.onrender.com/downloads/securefinance-user-v2.0.1.apk`)}>
                            <Download className="w-4 h-4 mr-2" /> Download APK Directly
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper Component
function InfoCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm font-bold text-slate-700">{value}</p>
        </div>
    );
}

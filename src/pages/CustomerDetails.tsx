import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import {
    ArrowLeft, Shield, Lock, Unlock, Smartphone,
    MapPin, Clock, Trash2, RotateCcw, Copy, CheckCircle2,
    Circle, Loader2, Wifi, Battery, Signal, HardDrive,
    AlertCircle, QrCode, Download, Edit // Added Edit
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
    const { customers, deleteCustomer, toggleLock, refreshCustomers, sendRemoteCommand } = useDevice(); // Fixed refreshCustomers
    const [customer, setCustomer] = useState<any>(null);
    const [deviceInfo, setDeviceInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrData, setQrData] = useState<string>('');
    const [apkName, setApkName] = useState<string>('securefinance-admin-v2.0.5.apk'); // Default fallback
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        phoneNo: '',
        address: '',
        aadharNo: '',
        emiAmount: '',
        expectedIMEI: ''
    });

    const handleUpdate = async () => {
        if (!editForm.name || !editForm.phoneNo) {
            toast.error("Name and Phone are required");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(getApiUrl(`/api/customers/${id}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                const updated = await response.json();
                setCustomer(updated);
                toast.success("Customer details updated");
                setShowEditModal(false);
                if (refreshCustomers) refreshCustomers(); // Refresh context
            } else {
                toast.error("Update failed");
            }
        } catch (e) {
            toast.error("Update failed");
        } finally {
            setLoading(false);
        }
    };

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

    // Fetch QR data & Version when modal opens
    useEffect(() => {
        if (showQRModal) {
            if (!qrData) fetchQRData();
            // Fetch latest APK name
            fetch(getApiUrl('/api/version'))
                .then(res => res.json())
                .then(data => {
                    if (data.apk) setApkName(data.apk);
                })
                .catch(err => console.error("Failed to fetch version", err));
        }
    }, [showQRModal, qrData, fetchQRData]);

    if (!customer) return <div className="p-10 text-center text-slate-400">Loading details...</div>;

    // Provisioning Steps
    const provisioningSteps = [
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

                {/* Lock Status Card - Premium Design */}
                <div className={cn(
                    "rounded-[32px] p-8 text-white relative overflow-hidden mb-8 shadow-2xl transition-all duration-500",
                    customer.isLocked
                        ? "bg-gradient-to-br from-rose-600 to-red-600 shadow-rose-500/40"
                        : "bg-gradient-to-br from-indigo-600 to-violet-700 shadow-indigo-500/40"
                )}>
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20 mix-blend-overlay"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-20 -translate-x-20 mix-blend-soft-light"></div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transform transition-transform duration-500 hover:scale-105">
                                    {customer.isLocked ? <Lock className="w-10 h-10 text-white drop-shadow-md" /> : <Unlock className="w-10 h-10 text-white drop-shadow-md" />}
                                </div>
                                <div>
                                    <h3 className="text-4xl font-black tracking-tight text-white mb-2 leading-none">
                                        {customer.isLocked ? 'Locked' : 'Active'}
                                    </h3>
                                    <p className="text-white/80 font-medium text-lg">
                                        {customer.isLocked ? 'Device restricts access' : 'Device is fully accessible'}
                                    </p>
                                </div>
                            </div>
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-md px-4 py-1.5 text-sm font-bold shadow-sm">
                                {loading ? 'Syncing...' : 'Online'}
                            </Badge>
                        </div>

                        <Button
                            onClick={handleLockToggle}
                            disabled={loading}
                            className="w-full h-16 bg-white text-slate-900 hover:bg-white/95 border-0 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-[0.98] active:translate-y-0"
                        >
                            {loading ? <Loader2 className="w-6 h-6 mr-3 animate-spin text-primary" /> : (customer.isLocked ? <Unlock className="w-6 h-6 mr-3 text-emerald-600" /> : <Lock className="w-6 h-6 mr-3 text-rose-600" />)}
                            <span className={customer.isLocked ? "text-emerald-700" : "text-rose-700"}>
                                {loading ? "Processing Command..." : (customer.isLocked ? "UNLOCK DEVICE" : "LOCK DEVICE")}
                            </span>
                        </Button>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-2 flex items-center gap-2">
                        <RotateCcw className="w-3 h-3" /> Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <Button
                            variant="outline"
                            onClick={() => sendRemoteCommand(customer.id, 'alarm')}
                            className="h-32 flex flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-slate-100 bg-white hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 text-slate-600 font-bold transition-all shadow-sm hover:shadow-md group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                                <AlertCircle className="w-7 h-7 text-amber-600" />
                            </div>
                            <span>Ring Alarm</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                const pin = prompt("Enter new PIN (4-6 digits):");
                                if (pin) sendRemoteCommand(customer.id, 'setPin', { pin });
                            }}
                            className="h-32 flex flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-slate-100 bg-white hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-600 font-bold transition-all shadow-sm hover:shadow-md group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <Shield className="w-7 h-7 text-blue-600" />
                            </div>
                            <span>Set PIN</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                const msg = prompt("Enter Lock Screen Message:");
                                if (msg) sendRemoteCommand(customer.id, 'setLockInfo', { message: msg });
                            }}
                            className="h-32 flex flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-slate-100 bg-white hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 text-slate-600 font-bold transition-all shadow-sm hover:shadow-md group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <Edit className="w-7 h-7 text-purple-600" />
                            </div>
                            <span>Set Message</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                if (confirm("Are you sure you want to FACTORY RESET this device? This cannot be undone.")) {
                                    sendRemoteCommand(customer.id, 'wipe');
                                }
                            }}
                            className="h-32 flex flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-slate-100 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-600 font-bold transition-all shadow-sm hover:shadow-md group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                <Trash2 className="w-7 h-7 text-red-600" />
                            </div>
                            <span>Factory Reset</span>
                        </Button>
                    </div>
                </div>

                {/* Customer Profile */}
                <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        Customer Profile
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {/* Address */}
                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                            <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</span>
                                <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap">{customer.address || 'No address provided'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Aadhar */}
                            <InfoCard
                                label="Aadhar No"
                                value={customer.aadharNo || 'N/A'}
                                icon={<Shield className="w-4 h-4" />}
                            />
                            {/* EMI Amount */}
                            <InfoCard
                                label="EMI Amount"
                                value={customer.emiAmount ? `₹${customer.emiAmount}` : 'N/A'}
                                icon={<CheckCircle2 className="w-4 h-4" />} // Using generic icon
                            />
                        </div>
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
                                value={deviceInfo?.sdkLevel || customer.deviceStatus?.technical?.sdkLevel || 'N/A'}
                                icon={<Shield className="w-4 h-4" />}
                            />

                            {/* Battery */}
                            {(deviceInfo?.batteryLevel || customer.deviceStatus?.batteryLevel) && (
                                <InfoCard
                                    label="Battery"
                                    value={`${deviceInfo?.batteryLevel ?? customer.deviceStatus?.batteryLevel}%`}
                                    icon={<Battery className="w-4 h-4" />}
                                />
                            )}

                            {/* Network */}
                            <InfoCard
                                label="Network"
                                value={deviceInfo?.networkType || customer.deviceFeatures?.networkType || customer.deviceStatus?.technical?.networkType || 'Unknown'}
                                icon={<Signal className="w-4 h-4" />}
                            />
                        </div>

                        {/* IMEI Section */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Device IDs</h4>

                            {/* IMEI 1 */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <span className="text-xs font-bold text-slate-500">IMEI 1</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-slate-700">
                                        {deviceInfo?.imei1 || customer.imei1 || customer.deviceStatus?.technical?.imei1 || 'N/A'}
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
                            {(deviceInfo?.imei2 || customer.imei2 || customer.deviceStatus?.technical?.imei2) && (
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
                        {(deviceInfo?.sim1 || deviceInfo?.sim2 || customer.simStatus || customer.simDetails) && (
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Smartphone className="w-3 h-3" /> SIM Cards
                                </h4>

                                {(deviceInfo?.sim1?.isActive || customer.simStatus?.simReady) && (
                                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500">SIM 1</span>
                                            <Badge variant="outline" className="text-[10px] h-5">Active</Badge>
                                        </div>
                                        <p className="text-xs text-slate-600">{deviceInfo?.sim1?.operator || customer.simStatus?.operator || customer.simDetails?.operator || 'Unknown'}</p>
                                        {(deviceInfo?.sim1?.phoneNumber || customer.simStatus?.phoneNumber) && (
                                            <p className="text-xs font-mono text-slate-500">{deviceInfo?.sim1?.phoneNumber || customer.simStatus?.phoneNumber}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Storage Info */}
                        {(deviceInfo?.totalStorage || customer.deviceStatus?.technical?.totalStorage) && (
                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-500">Storage</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">
                                        {deviceInfo?.availableStorage || customer.deviceStatus?.technical?.availableStorage} / {deviceInfo?.totalStorage || customer.deviceStatus?.technical?.totalStorage}
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

                {/* Location Tracking */}
                {(deviceInfo?.location || customer.deviceStatus?.lastLocation) && (
                    <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Location Tracking
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Live/Last Location */}
                            <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">Last Known Location</h4>
                                    <Badge className="bg-emerald-500 text-white border-0">GPS</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-black text-slate-800">
                                        {(deviceInfo?.location?.latitude || customer.deviceStatus?.lastLocation?.latitude || 0).toFixed(4)}° N
                                    </p>
                                    <p className="text-2xl font-black text-slate-800">
                                        {(deviceInfo?.location?.longitude || customer.deviceStatus?.lastLocation?.longitude || 0).toFixed(4)}° E
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium">
                                        Accuracy: {(deviceInfo?.location?.accuracy || customer.deviceStatus?.lastLocation?.accuracy || 0).toFixed(1)}m
                                    </p>
                                </div>
                                <Button
                                    className="w-full bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-primary font-bold rounded-xl"
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${deviceInfo?.location?.latitude || customer.deviceStatus?.lastLocation?.latitude},${deviceInfo?.location?.longitude || customer.deviceStatus?.lastLocation?.longitude}`, '_blank')}
                                >
                                    View on Google Maps
                                </Button>
                            </div>

                            {/* History List */}
                            <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                <h4 className="text-xs font-bold text-slate-500 uppercase sticky top-0 bg-white pb-2">Recent History</h4>
                                {(customer.deviceStatus?.locationHistory || []).length > 0 ? (
                                    (customer.deviceStatus?.locationHistory || []).slice().reverse().map((loc: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-xs">
                                            <div className="font-mono font-bold text-slate-600">
                                                {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                                            </div>
                                            <div className="text-slate-400 font-medium">
                                                {new Date(loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No history available</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <Button
                    variant="outline"
                    onClick={() => {
                        setEditForm({
                            name: customer.name || '',
                            phoneNo: customer.phoneNo || '',
                            address: customer.address || '',
                            aadharNo: customer.aadharNo || '',
                            emiAmount: customer.emiAmount || '',
                            expectedIMEI: customer.expectedIMEI || ''
                        });
                        setShowEditModal(true);
                    }}
                    className="w-full h-12 rounded-xl border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                >
                    <Edit className="w-4 h-4 mr-2" /> Edit Customer Details
                </Button>

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

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-[32px] p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-black">Edit Customer</h2>
                            <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                <span className="text-slate-500 font-bold">✕</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-slate-700"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                                <input
                                    type="tel"
                                    value={editForm.phoneNo}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phoneNo: e.target.value }))}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono font-bold text-slate-700"
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                                <textarea
                                    value={editForm.address}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full h-24 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-slate-700 resize-none"
                                    placeholder="Enter full address"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aadhar No</label>
                                    <input
                                        type="text"
                                        value={editForm.aadharNo}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, aadharNo: e.target.value }))}
                                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono font-bold text-slate-700"
                                        placeholder="0000 0000 0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">EMI Amount</label>
                                    <input
                                        type="number"
                                        value={editForm.emiAmount}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, emiAmount: e.target.value }))}
                                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono font-bold text-slate-700"
                                        placeholder="₹0"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expected IMEI (Optional)</label>
                                <input
                                    type="text"
                                    value={editForm.expectedIMEI}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, expectedIMEI: e.target.value }))}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono font-bold text-slate-700"
                                    placeholder="IMEI for verification"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold"
                            >
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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

                        <Button variant="outline" className="w-full" onClick={() => window.open(`https://emi-pro-app.onrender.com/downloads/${apkName}`)}>
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

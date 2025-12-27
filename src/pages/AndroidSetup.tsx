import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Smartphone, Wifi, Download, Shield, CheckCircle2,
    QrCode, Camera, MapPin, Phone, MessageCircle,
    HardDrive, Loader2, Power, AlertCircle, Battery
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDevice } from '@/context/DeviceContext';
import { toast } from 'sonner';

type SetupStep =
    | 'welcome'
    | 'qr-scanner'
    | 'wifi-connect'
    | 'downloading'
    | 'installing'
    | 'unknown-sources'
    | 'permissions'
    | 'finalizing'
    | 'complete';

const AndroidSetup = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { addCustomer, updateCustomer } = useDevice();

    const [setupStep, setSetupStep] = useState<SetupStep>('welcome');
    const [tapCount, setTapCount] = useState(0);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [installProgress, setInstallProgress] = useState(0);
    const [enrollmentData, setEnrollmentData] = useState<any>(null);

    // Parse enrollment data from URL
    useEffect(() => {
        const enrollment = searchParams.get('enrollment');
        if (enrollment) {
            try {
                const decoded = JSON.parse(atob(enrollment));
                setEnrollmentData(decoded);
                console.log('Enrollment Data:', decoded);
            } catch (e) {
                console.error('Failed to parse enrollment data', e);
                toast.error('Invalid QR code data');
            }
        }
    }, [searchParams]);

    // Handle welcome screen taps (3 taps to activate QR scanner)
    const handleWelcomeTap = () => {
        const newCount = tapCount + 1;
        setTapCount(newCount);

        if (newCount === 3) {
            toast.success('QR Scanner activated!');
            setTimeout(() => {
                setSetupStep('qr-scanner');
                setTapCount(0);
            }, 500);
        } else if (newCount === 1) {
            toast.info(`Tap ${3 - newCount} more times to activate setup`);
        } else if (newCount === 2) {
            toast.info('Tap 1 more time!');
        }
    };

    // Simulate QR scan
    const handleQRScan = () => {
        if (!enrollmentData) {
            toast.error('No enrollment data found');
            return;
        }

        toast.success('QR Code scanned successfully!');
        setTimeout(() => setSetupStep('wifi-connect'), 1000);
    };

    // Simulate WiFi connection
    const handleWifiConnect = () => {
        toast.success('Connected to WiFi');
        setTimeout(() => {
            setSetupStep('downloading');
            startDownload();
        }, 1500);
    };

    // Simulate APK download
    const startDownload = () => {
        const interval = setInterval(() => {
            setDownloadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setSetupStep('unknown-sources'), 500);
                    return 100;
                }
                return prev + 5;
            });
        }, 100);
    };

    // Handle "Allow Unknown Sources"
    const handleAllowUnknownSources = () => {
        toast.success('Unknown sources allowed');
        setTimeout(() => {
            setSetupStep('installing');
            startInstallation();
        }, 1000);
    };

    // Simulate APK installation
    const startInstallation = () => {
        const interval = setInterval(() => {
            setInstallProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setSetupStep('permissions'), 500);
                    return 100;
                }
                return prev + 4;
            });
        }, 120);
    };

    // Grant all permissions and finalize
    const handleGrantPermissions = async () => {
        setSetupStep('finalizing');

        try {
            // Create customer record with enrollment data
            if (enrollmentData) {
                const customerData = {
                    id: enrollmentData.customerId,
                    name: enrollmentData.customerName,
                    phoneNo: enrollmentData.phoneNo,
                    aadharNo: '',
                    address: '',
                    deviceName: enrollmentData.deviceBrand,
                    mobileModel: enrollmentData.deviceModel,
                    financeName: enrollmentData.financeName,
                    imei1: enrollmentData.imei1,
                    imei2: enrollmentData.imei2,
                    totalAmount: Number(enrollmentData.totalAmount) || 0,
                    emiAmount: Number(enrollmentData.emiAmount) || 0,
                    totalEmis: Number(enrollmentData.totalEmis) || 12,
                    paidEmis: 0,
                    emiDate: new Date().getDate(),
                    isEnrolled: true,
                    isLocked: false,
                };

                await addCustomer(customerData);

                setTimeout(() => {
                    setSetupStep('complete');
                    toast.success('Device enrolled successfully!');

                    // Redirect to mobile simulator after 2 seconds
                    setTimeout(() => {
                        navigate(`/mobile-simulator/${enrollmentData.imei1}`);
                    }, 2000);
                }, 2000);
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            toast.error('Enrollment failed. Please try again.');
        }
    };

    // Render different setup steps
    const renderStep = () => {
        switch (setupStep) {
            case 'welcome':
                return (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <div className="space-y-4">
                            <Smartphone className="w-20 h-20 mx-auto animate-pulse" />
                            <h1 className="text-4xl font-bold">Welcome</h1>
                            <p className="text-lg opacity-90">Tap anywhere to start</p>
                        </div>

                        <div
                            className="absolute inset-0 cursor-pointer"
                            onClick={handleWelcomeTap}
                        />

                        {tapCount > 0 && (
                            <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
                                <Badge variant="secondary" className="text-sm px-4 py-2 animate-bounce">
                                    {tapCount}/3 taps
                                </Badge>
                            </div>
                        )}

                        <p className="text-xs opacity-60 absolute bottom-8">
                            Tap 3 times to activate device provisioning
                        </p>
                    </div>
                );

            case 'qr-scanner':
                return (
                    <div className="flex-1 bg-black flex flex-col relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-64 h-64 border-4 border-white/50 rounded-3xl relative">
                                <div className="absolute inset-0 bg-white/10 animate-pulse rounded-3xl" />
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-full">
                                    <p className="text-black text-xs font-bold">SCAN QR CODE</p>
                                </div>
                                <QrCode className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-white/30" />
                            </div>
                        </div>

                        <div className="mt-auto p-8 text-center bg-gradient-to-t from-black to-transparent z-10">
                            <p className="text-white text-sm font-medium mb-4">
                                Point camera at enrollment QR code
                            </p>
                            <Button
                                className="w-full bg-white text-black hover:bg-gray-200"
                                onClick={handleQRScan}
                                disabled={!enrollmentData}
                            >
                                <QrCode className="w-4 h-4 mr-2" />
                                Simulate QR Scan
                            </Button>
                        </div>
                    </div>
                );

            case 'wifi-connect':
                return (
                    <div className="flex-1 bg-background flex flex-col items-center justify-center p-8 text-center space-y-8">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                            <Wifi className="w-12 h-12 text-primary animate-pulse" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Connect to WiFi</h2>
                            <p className="text-muted-foreground">
                                Required to download device management app
                            </p>
                        </div>

                        <div className="w-full max-w-xs space-y-3">
                            <div className="p-4 bg-secondary/50 rounded-xl border border-border/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Wifi className="w-5 h-5 text-primary" />
                                    <span className="font-medium">Home WiFi</span>
                                </div>
                                <Badge variant="outline" className="text-xs">Connected</Badge>
                            </div>
                        </div>

                        <Button className="w-full max-w-xs" onClick={handleWifiConnect}>
                            Continue Setup
                        </Button>
                    </div>
                );

            case 'downloading':
                return (
                    <div className="flex-1 bg-background flex flex-col items-center justify-center p-10 text-center space-y-8">
                        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center relative">
                            <Download className="w-12 h-12 text-primary animate-bounce" />
                        </div>

                        <div className="space-y-2 w-full max-w-xs">
                            <h3 className="text-xl font-bold">Downloading App</h3>
                            <p className="text-muted-foreground text-sm">
                                SecureFinance EMI Management
                            </p>

                            <div className="pt-4">
                                <Progress value={downloadProgress} className="h-2" />
                                <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">
                                    {Math.round(downloadProgress)}% Complete
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'unknown-sources':
                return (
                    <div className="flex-1 bg-background flex flex-col items-center justify-center p-8 text-center space-y-8">
                        <div className="w-24 h-24 rounded-3xl bg-amber-500/10 flex items-center justify-center">
                            <AlertCircle className="w-12 h-12 text-amber-500" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Allow Unknown Sources</h3>
                            <p className="text-muted-foreground text-sm px-4">
                                This app requires permission to install from unknown sources
                            </p>
                        </div>

                        <div className="w-full max-w-xs p-4 bg-secondary/30 rounded-xl border border-border/50">
                            <div className="flex items-start gap-3 text-left">
                                <Shield className="w-5 h-5 text-primary mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-sm">Install unknown apps</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Allow this source to install apps
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button className="w-full max-w-xs" onClick={handleAllowUnknownSources}>
                            Allow Installation
                        </Button>
                    </div>
                );

            case 'installing':
                return (
                    <div className="flex-1 bg-background flex flex-col items-center justify-center p-10 text-center space-y-8">
                        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center relative">
                            <Shield className="w-12 h-12 text-primary" />
                            <div className="absolute -bottom-2 -right-2 bg-success text-white p-1.5 rounded-full">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="space-y-2 w-full max-w-xs">
                            <h3 className="text-xl font-bold">Installing App</h3>
                            <p className="text-muted-foreground text-sm">
                                SecureFinance EMI Manager
                            </p>

                            <div className="pt-4">
                                <Progress value={installProgress} className="h-2" />
                                <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">
                                    {Math.round(installProgress)}% Complete
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'permissions':
                return (
                    <div className="flex-1 bg-background flex flex-col p-6 space-y-6">
                        <div className="pt-8 text-center">
                            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                            <h3 className="text-xl font-bold">Grant Permissions</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Required for device management and security
                            </p>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                            {[
                                { icon: Camera, label: 'Camera', desc: 'Identity verification' },
                                { icon: MapPin, label: 'Location', desc: 'Device tracking' },
                                { icon: Phone, label: 'Phone', desc: 'IMEI and call management' },
                                { icon: MessageCircle, label: 'SMS', desc: 'Payment reminders' },
                                { icon: Shield, label: 'Device Admin', desc: 'Remote lock capability' },
                                { icon: HardDrive, label: 'Storage', desc: 'Secure data storage' }
                            ].map((perm, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50">
                                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                                        <perm.icon className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold leading-none">{perm.label}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{perm.desc}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs font-bold">
                                        ALLOW
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        <Button className="w-full h-12 text-base font-bold" onClick={handleGrantPermissions}>
                            Grant All Permissions
                        </Button>
                    </div>
                );

            case 'finalizing':
                return (
                    <div className="flex-1 bg-primary flex flex-col items-center justify-center p-6 text-center space-y-6">
                        <Loader2 className="w-16 h-16 text-white animate-spin" />
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white">Finalizing Setup</h3>
                            <p className="text-white/70 text-sm">
                                Connecting device to admin dashboard...
                            </p>
                        </div>
                    </div>
                );

            case 'complete':
                return (
                    <div className="flex-1 bg-gradient-to-br from-green-500 to-emerald-600 flex flex-col items-center justify-center p-6 text-center space-y-8 text-white">
                        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                            <CheckCircle2 className="w-16 h-16" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold">Setup Complete!</h2>
                            <p className="text-white/90">
                                Device enrolled successfully
                            </p>
                        </div>

                        <div className="space-y-2 bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-xs">
                            <p className="text-xs opacity-75 uppercase tracking-widest">Device ID</p>
                            <p className="font-mono text-sm font-bold">{enrollmentData?.imei1}</p>
                        </div>

                        <p className="text-sm opacity-75">Redirecting to device...</p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
            {/* Mobile Frame */}
            <div className="relative w-full max-w-[380px] h-[800px] bg-background rounded-[3.5rem] shadow-[0_0_0_12px_#18181b,0_0_0_14px_#27272a,0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden border-[8px] border-zinc-900 flex flex-col">

                {/* Status Bar */}
                <div className="px-8 py-4 flex items-center justify-between z-20 bg-transparent">
                    <span className="text-xs font-black tracking-tighter">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <div className="flex items-center gap-2">
                        <Wifi className="w-3.5 h-3.5" />
                        <Battery className="w-4 h-4" />
                    </div>
                </div>

                {/* Content */}
                {renderStep()}

                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-32 bg-zinc-950/20 rounded-full z-30" />
            </div>
        </div>
    );
};

export default AndroidSetup;

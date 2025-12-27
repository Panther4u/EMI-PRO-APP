import { useState, useEffect } from 'react';
import {
    Shield, Signal, Battery, Wifi, Grid, Clock, Phone,
    MessageCircle, Chrome, Camera, QrCode, Download,
    CheckCircle2, Lock, Smartphone, Power, Loader2,
    Settings, MapPin, Mic, HardDrive
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useDevice } from '@/context/DeviceContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type SetupStep = 'power-off' | 'scanning' | 'installing' | 'permissions' | 'finalizing' | 'ready';

const MobileSimulator = () => {
    const { imei } = useParams();
    const { customers, updateCustomer } = useDevice();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [setupStep, setSetupStep] = useState<SetupStep>('power-off');
    const [installProgress, setInstallProgress] = useState(0);
    const [grantedPermissions, setGrantedPermissions] = useState<string[]>([]);

    const customer = customers.find(c => c.imei1 === imei || c.imei2 === imei);
    const isEnrolled = customer?.isEnrolled;
    const isLocked = customer ? customer.isLocked : false;

    // Parse enrollment data from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const enrollmentData = params.get('enrollment');
        if (enrollmentData && !isEnrolled && setupStep === 'power-off') {
            try {
                const decoded = JSON.parse(atob(enrollmentData));
                console.log('Enrollment Data:', decoded);
                setSetupStep('scanning');
                // Automatically move to installing after a brief pause
                setTimeout(() => setSetupStep('installing'), 1500);
            } catch (e) {
                console.error('Failed to parse enrollment data', e);
            }
        }
    }, [isEnrolled, setupStep]);

    // Trigger download function
    const triggerDownload = () => {
        const dummyContent = "This is a simulated EMI App APK file.";
        const blob = new Blob([dummyContent], { type: 'application/vnd.android.package-archive' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SecureFinance_EMI_App.apk';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Handle installation simulation
    useEffect(() => {
        if (setupStep === 'installing') {
            // Trigger the real download for the user
            triggerDownload();

            const interval = setInterval(() => {
                setInstallProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setSetupStep('permissions'), 500);
                        return 100;
                    }
                    return prev + 5;
                });
            }, 100);
            return () => clearInterval(interval);
        }
    }, [setupStep]);

    const handleGrantAll = () => {
        const permissions = ['Camera', 'Location', 'Phone', 'SMS', 'Admin Access', 'Network'];
        setSetupStep('finalizing');
        setTimeout(() => {
            if (customer) {
                updateCustomer(customer.id, { isEnrolled: true });
            } else {
                // Handle case where it's a new enrollment from QR but customer not in context yet
                // The context should likely have added it when QR was generated, but we can be safe
                const params = new URLSearchParams(window.location.search);
                const enrollmentData = params.get('enrollment');
                if (enrollmentData) {
                    try {
                        const decoded = JSON.parse(atob(enrollmentData));
                        // In a real app, we'd call an API here.
                        // Here we just simulate success.
                    } catch (e) { }
                }
            }
            setSetupStep('ready');
        }, 2000);
    };

    if (!customer && imei && setupStep === 'power-off') {
        return (
            <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
                <div className="relative w-full max-w-[380px] h-[800px] bg-background rounded-[3rem] border-[8px] border-zinc-900 flex flex-col items-center justify-center p-6 text-center">
                    <Shield className="w-16 h-16 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold">New Device Detected</h2>
                    <p className="text-muted-foreground mt-2 font-mono text-xs mb-6">IMEI: {imei}</p>
                    <Badge variant="outline" className="mb-6">System Provisioning Required</Badge>
                    <Button
                        onClick={() => setSetupStep('scanning')}
                        className="w-full gap-2"
                    >
                        <Power className="w-4 h-4" />
                        Initialize Setup
                    </Button>
                </div>
            </div>
        );
    }

    const renderSetup = () => {
        switch (setupStep) {
            case 'power-off':
                return (
                    <div className="flex-1 bg-black flex flex-col items-center justify-center p-6 text-center space-y-6">
                        <Smartphone className="w-16 h-16 text-zinc-800 animate-pulse" />
                        <Button
                            variant="outline"
                            className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            onClick={() => setSetupStep('scanning')}
                        >
                            <Power className="w-4 h-4 mr-2" />
                            Start Setup
                        </Button>
                    </div>
                );
            case 'scanning':
                return (
                    <div className="flex-1 bg-zinc-950 flex flex-col relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-64 h-64 border-2 border-primary/50 rounded-3xl relative">
                                <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-3xl" />
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-primary-foreground">
                                    SCAN QR CODE
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto p-8 text-center bg-gradient-to-t from-black to-transparent">
                            <p className="text-white text-sm font-medium">Point camera at the QR code</p>
                            <Button
                                className="mt-4 w-full"
                                onClick={() => setSetupStep('installing')}
                            >
                                <QrCode className="w-4 h-4 mr-2" />
                                Scan Master Enrollment QR
                            </Button>
                        </div>
                    </div>
                );
            case 'installing':
                return (
                    <div className="flex-1 bg-background flex flex-col items-center justify-center p-10 text-center space-y-8">
                        <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center relative">
                            <Download className="w-12 h-12 text-primary animate-bounce" />
                            <div className="absolute -bottom-2 -right-2 bg-success text-white p-1 rounded-full">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="space-y-2 w-full">
                            <h3 className="text-xl font-bold">Installing EMI App</h3>
                            <p className="text-muted-foreground text-sm font-medium">Downloading APK package...</p>
                            <div className="pt-4 px-4">
                                <Progress value={installProgress} className="h-2" />
                                <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-widest">
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
                                The app requires following permissions to secure your device.
                            </p>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                            {[
                                { icon: Camera, label: 'Camera', desc: 'Required for facial verification' },
                                { icon: MapPin, label: 'Location', desc: 'Secure device tracking' },
                                { icon: Phone, label: 'Phone', desc: 'Manage calls and IMEI read' },
                                { icon: MessageCircle, label: 'SMS', desc: 'Verify device link' },
                                { icon: Shield, label: 'Device Admin', desc: 'Enable remote locking' },
                                { icon: HardDrive, label: 'Storage', desc: 'Local data encryption' }
                            ].map((perm, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50">
                                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                                        <perm.icon className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold leading-none">{perm.label}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">{perm.desc}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] font-bold">
                                        ALLOWED
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        <Button className="w-full h-12 text-base font-bold" onClick={handleGrantAll}>
                            Finish Enrollment
                        </Button>
                    </div>
                );
            case 'finalizing':
                return (
                    <div className="flex-1 bg-primary flex flex-col items-center justify-center p-6 text-center space-y-6">
                        <Loader2 className="w-16 h-16 text-white animate-spin" />
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white">Finalizing...</h3>
                            <p className="text-white/70 text-sm">Linking device to Admin dashboard</p>
                        </div>
                    </div>
                );
        }
    };

    const renderLocked = () => (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-[2.5rem] bg-destructive/10 flex items-center justify-center mb-4 relative">
                <Lock className="w-12 h-12 text-destructive animate-pulse" />
                <div className="absolute top-0 right-0 w-4 h-4 bg-destructive rounded-full" />
            </div>

            <div className="space-y-3">
                <Badge variant="destructive" className="px-4 py-1.5 text-xs font-black uppercase tracking-tighter">
                    Access Revoked
                </Badge>
                <h2 className="text-3xl font-black text-foreground tracking-tight">DEVICE LOCKED</h2>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed px-4">
                    This smartphone has been restricted due to financial non-compliance. All services have been disabled.
                </p>
            </div>

            <div className="space-y-3 w-full max-w-[280px]">
                <div className="p-4 bg-secondary/50 rounded-2xl border border-border/50 shadow-sm">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Support Hotline</p>
                    <p className="text-2xl font-black text-primary tracking-tight">8876655444</p>
                </div>

                <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Device ID</p>
                    <p className="font-mono text-xs font-bold">{customer?.imei1 || imei}</p>
                </div>
            </div>

            <div className="pt-8">
                <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-widest">
                    Emergency calls only
                </p>
            </div>
        </div>
    );

    const renderMainUI = () => (
        <div className="flex-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-6 flex flex-col animate-in fade-in duration-300">
            {/* Date/Time Widget */}
            <div className="mt-12 mb-8 text-center drop-shadow-md">
                <h1 className="text-7xl font-thin tracking-tighter tabular-nums drop-shadow-xl">{format(currentTime, 'HH:mm')}</h1>
                <p className="text-lg font-bold opacity-90 tracking-wide mt-1">{format(currentTime, 'EEEE, MMMM d')}</p>
            </div>

            {/* App Grid */}
            <div className="flex-1 grid grid-cols-4 gap-4 content-start pt-6">
                {[
                    { icon: Chrome, label: 'Browser', color: 'bg-white', restricted: customer?.networkRestricted },
                    { icon: Camera, label: 'Camera', color: 'bg-zinc-800', restricted: customer?.cameraRestricted },
                    { icon: Grid, label: 'Gallery', color: 'bg-orange-400' },
                    { icon: Clock, label: 'Clock', color: 'bg-zinc-900' },
                    { icon: Shield, label: 'EMI App', color: 'bg-blue-600' },
                    { icon: Settings, label: 'Settings', color: 'bg-zinc-400', restricted: customer?.resetRestricted },
                ].map((app, i) => (
                    <div key={i} className={cn(
                        "flex flex-col items-center gap-1.5 group transition-all",
                        app.restricted && "opacity-40 grayscale pointer-events-none"
                    )}>
                        <div className={cn(
                            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform active:scale-95 relative",
                            app.color
                        )}>
                            <app.icon className={cn("w-8 h-8", app.color === 'bg-white' ? 'text-black' : 'text-white')} />
                            {app.restricted && (
                                <div className="absolute -top-1 -right-1 bg-destructive p-1 rounded-full border-2 border-white">
                                    <Lock className="w-2 h-2 text-white" />
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-bold tracking-tight opacity-90 drop-shadow-md uppercase">{app.label}</span>
                    </div>
                ))}
            </div>

            {/* Dock */}
            <div className="mt-auto bg-white/10 backdrop-blur-3xl rounded-[2.5rem] p-4 flex justify-around items-center mb-6 border border-white/10 shadow-2xl">
                <div className={cn("p-4 bg-green-500 rounded-[1.25rem] shadow-lg", customer?.callsRestricted && "opacity-40 grayscale")}><Phone className="w-7 h-7 text-white" /></div>
                <div className="p-4 bg-blue-500 rounded-[1.25rem] shadow-lg"><MessageCircle className="w-7 h-7 text-white" /></div>
                <div className={cn("p-4 bg-white rounded-[1.25rem] shadow-lg", customer?.networkRestricted && "opacity-40 grayscale")}><Chrome className="w-7 h-7 text-blue-600" /></div>
                <div className={cn("p-4 bg-zinc-800 rounded-[1.25rem] shadow-lg", customer?.cameraRestricted && "opacity-40 grayscale")}><Camera className="w-7 h-7 text-white" /></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
            {/* Mobile Frame */}
            <div className="relative w-full max-w-[380px] h-[800px] bg-background rounded-[3.5rem] shadow-[0_0_0_12px_#18181b,0_0_0_14px_#27272a,0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden border-[8px] border-zinc-900 flex flex-col">

                {/* Status Bar */}
                <div className={cn(
                    "px-8 py-4 flex items-center justify-between z-20 transition-colors",
                    (isLocked || !isEnrolled) ? "bg-transparent" : "bg-transparent text-white"
                )}>
                    <span className="text-xs font-black tracking-tighter">{format(currentTime, 'HH:mm')}</span>
                    <div className="flex items-center gap-2">
                        <Signal className={cn("w-3.5 h-3.5", customer?.networkRestricted && "text-destructive")} />
                        <Wifi className={cn("w-3.5 h-3.5", customer?.wifiRestricted && "text-destructive")} />
                        <Battery className="w-4 h-4" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 relative flex flex-col">
                    {!isEnrolled ? (
                        renderSetup()
                    ) : isLocked ? (
                        renderLocked()
                    ) : (
                        renderMainUI()
                    )}
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-32 bg-zinc-950/20 rounded-full z-30" />
            </div>
        </div>
    );
};

export default MobileSimulator;

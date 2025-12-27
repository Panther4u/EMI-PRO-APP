import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, Delete, User, Key, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Login = () => {
    const [mode, setMode] = useState<'pin' | 'passkey' | 'set-pin'>('pin');
    const [pin, setPin] = useState('');
    const [passkey, setPasskey] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState(false);
    const [pendingAdmin, setPendingAdmin] = useState<any>(null);

    const { login, loginWithPasskey, activateAdmin, isAuthenticated, isAdminLocked, admins } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || "/";

    useEffect(() => {
        if (isAuthenticated) {
            // Redirect to dashboard or the page they were trying to access
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (mode === 'pin') {
                if (e.key >= '0' && e.key <= '9') {
                    handleNumberClick(e.key);
                } else if (e.key === 'Backspace') {
                    handleDelete();
                } else if (e.key === 'Enter' && pin.length === 6) {
                    handleLogin(pin);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pin, mode]);

    const handleNumberClick = (num: string) => {
        if (pin.length < 6) {
            const newPinValue = pin + num;
            setPin(newPinValue);
            setError(false);

            if (newPinValue.length === 6) {
                setTimeout(() => handleLogin(newPinValue), 300);
            }
        }
    };

    const handleDelete = () => {
        setError(false);
        setPin(prev => prev.slice(0, -1));
    };

    const handleLogin = (pinToTry: string) => {
        if (pinToTry.length !== 6) return;

        const success = login(pinToTry);
        if (success) {
            const admin = admins.find(a => a.pin === pinToTry);
            toast.success(`Authentication successful${admin ? `: Welcome ${admin.username}` : ''}`);
        } else {
            setError(true);
            setPin('');

            if (isAdminLocked && pinToTry !== '888888') {
                toast.error('Admin Panel Locked: Contact Super Admin 9876543219');
            } else {
                toast.error('Invalid PIN. Please try again.');
            }
        }
    };

    const handlePasskeySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const admin = loginWithPasskey(passkey.toUpperCase());
        if (admin) {
            setPendingAdmin(admin);
            setMode('set-pin');
            toast.success(`Welcome ${admin.username}! Please set your PIN.`);
        } else {
            toast.error('Invalid or already used passkey');
            setPasskey('');
        }
    };

    const handleSetPin = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPin.length !== 6 || confirmPin.length !== 6) {
            toast.error('PIN must be 6 digits');
            return;
        }
        if (newPin !== confirmPin) {
            toast.error('PINs do not match');
            return;
        }

        const success = activateAdmin(pendingAdmin.passkey, newPin);
        if (success) {
            toast.success('Account activated! Please log in with your new PIN.');
            setMode('pin');
            setPasskey('');
            setNewPin('');
            setConfirmPin('');
            setPendingAdmin(null);
        } else {
            toast.error('Activation failed. PIN might already be in use.');
        }
    };

    const matchedAdmin = admins.find(a => a.pin === pin);

    if (mode === 'passkey') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-[400px] space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-2xl shadow-primary/20">
                            <Key className="w-10 h-10 text-primary-foreground" />
                        </div>
                        <h2 className="text-2xl font-black">Activate Account</h2>
                        <p className="text-sm text-muted-foreground">Enter the passkey provided by Super Admin</p>
                    </div>

                    <form onSubmit={handlePasskeySubmit} className="space-y-4">
                        <Input
                            type="text"
                            placeholder="Enter 8-character passkey"
                            value={passkey}
                            onChange={(e) => setPasskey(e.target.value.toUpperCase())}
                            maxLength={8}
                            className="h-14 text-center text-2xl font-mono tracking-widest uppercase"
                        />
                        <Button type="submit" className="w-full h-12 text-lg font-bold">
                            Verify Passkey
                        </Button>
                    </form>

                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setMode('pin')}
                    >
                        Back to PIN Login
                    </Button>
                </div>
            </div>
        );
    }

    if (mode === 'set-pin') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-[400px] space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-success shadow-2xl shadow-success/20">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-black">Set Your PIN</h2>
                        <p className="text-sm text-muted-foreground">Create a 6-digit PIN for {pendingAdmin?.username}</p>
                    </div>

                    <form onSubmit={handleSetPin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">New PIN</label>
                            <Input
                                type="password"
                                inputMode="numeric"
                                placeholder="Enter 6-digit PIN"
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                className="h-14 text-center text-2xl font-mono tracking-widest"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Confirm PIN</label>
                            <Input
                                type="password"
                                inputMode="numeric"
                                placeholder="Re-enter PIN"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                className="h-14 text-center text-2xl font-mono tracking-widest"
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg font-bold">
                            Activate Account
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-2xl shadow-primary/20">
                        <Shield className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2 text-left">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Access Identity</label>
                                {pin.startsWith('8') && (
                                    <span className="text-[9px] font-black text-primary uppercase tracking-tighter animate-pulse">Super Tier detected</span>
                                )}
                                {!pin.startsWith('8') && matchedAdmin && (
                                    <span className="text-[9px] font-black text-primary uppercase tracking-tighter animate-in slide-in-from-bottom-1">Identity Verified</span>
                                )}
                            </div>
                            <div className="relative group">
                                <User className={cn(
                                    "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                                    pin.startsWith('8') || matchedAdmin ? "text-primary" : "text-muted-foreground group-focus-within:text-primary"
                                )} />
                                <input
                                    type="text"
                                    value={
                                        pin.startsWith('8')
                                            ? "SUPER_SYSTEM_OVERRIDE"
                                            : matchedAdmin ? matchedAdmin.username : "admin_secure"
                                    }
                                    readOnly
                                    className={cn(
                                        "w-full bg-secondary/50 border h-12 rounded-2xl pl-12 pr-4 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-default",
                                        pin.startsWith('8') || matchedAdmin ? "border-primary/30 text-primary shadow-sm" : "border-border/50"
                                    )}
                                />
                            </div>
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Security PIN</label>
                            <p className="text-[10px] text-muted-foreground/60 px-1">Enter your 6-digit access code below</p>
                        </div>
                    </div>
                </div>

                {/* PIN Display */}
                <div className="flex justify-center gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-12 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-200",
                                pin.length > i
                                    ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                                    : "border-border bg-card",
                                error && pin.length === 0 && "border-destructive animate-shake"
                            )}
                        >
                            {pin.length > i ? (
                                <div className="w-3 h-3 rounded-full bg-primary animate-in zoom-in" />
                            ) : null}
                        </div>
                    ))}
                </div>

                {/* Keypad */}
                <div className="glass-card p-6 grid grid-cols-3 gap-4 bg-card/50 backdrop-blur-xl border-border/50">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            className="h-16 rounded-2xl bg-secondary/50 hover:bg-primary hover:text-primary-foreground text-xl font-bold transition-all duration-200 active:scale-95 flex items-center justify-center"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="h-16" /> {/* Empty space */}
                    <button
                        onClick={() => handleNumberClick('0')}
                        className="h-16 rounded-2xl bg-secondary/50 hover:bg-primary hover:text-primary-foreground text-xl font-bold transition-all duration-200 active:scale-95 flex items-center justify-center"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="h-16 rounded-2xl bg-secondary/50 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 active:scale-95 flex items-center justify-center"
                    >
                        <Delete className="w-6 h-6" />
                    </button>
                </div>

                {/* Footer */}
                <div className="space-y-3">
                    <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => setMode('passkey')}
                    >
                        <Key className="w-4 h-4" />
                        Activate with Passkey
                    </Button>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 opacity-60">
                        <Lock className="w-3 h-3" />
                        Secure End-to-End Encrypted Access
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, Smartphone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const success = await login(username, password);
            if (success) {
                navigate('/');
            } else {
                toast.error('Invalid credentials');
            }
        } catch (err) {
            toast.error('Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-primary/5 rounded-b-[40%] blur-3xl -z-10"></div>

            <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-bottom-5 duration-700">

                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white rounded-[24px] shadow-2xl shadow-primary/20 mx-auto flex items-center justify-center border border-white/50">
                        <Shield className="w-10 h-10 text-primary fill-primary/20" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">SecurePRO Cloud</h1>
                        <p className="text-sm font-medium text-slate-400">Enterprise Device Management</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 bg-white/60 backdrop-blur-md p-8 rounded-[32px] border border-white/60 shadow-xl shadow-slate-200/50">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-3">Admin ID</label>
                            <div className="relative">
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="pl-11 h-12 bg-white border-slate-200 rounded-2xl focus:ring-primary/20 transition-all font-semibold"
                                    placeholder="admin"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-3">Passcode</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-11 h-12 bg-white border-slate-200 rounded-2xl focus:ring-primary/20 transition-all font-semibold"
                                    placeholder="••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        disabled={loading}
                        type="submit"
                        className="w-full h-12 rounded-2xl text-md font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 mt-6 group"
                    >
                        {loading ? 'Authenticating...' : (
                            <span className="flex items-center gap-2">
                                Secure Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        )}
                    </Button>
                </form>

                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
                    Version 2.0 • Build 2402
                </p>
            </div>
        </div>
    );
}

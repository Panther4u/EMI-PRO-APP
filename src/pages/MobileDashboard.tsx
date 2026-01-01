import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Smartphone, TrendingUp, AlertTriangle, Shield, Search, Plus, Filter, LayoutGrid, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getApiUrl } from '@/config/api';

export default function MobileDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        locked: 0,
        removed: 0
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await fetch(getApiUrl('/api/customers'));
            if (response.ok) {
                const customers = await response.json();
                setStats({
                    total: customers.length,
                    active: customers.filter((c: any) => c.deviceStatus?.status === 'ACTIVE').length,
                    locked: customers.filter((c: any) => c.isLocked).length,
                    removed: customers.filter((c: any) => (c.deviceStatus?.status === 'REMOVED' || c.deviceStatus?.status === 'removed')).length
                });
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-primary/20">
            {/* Premium App Header */}
            <header className="h-[70px] border-b border-border/40 flex items-center px-6 bg-white/80 backdrop-blur-2xl z-50 sticky top-0">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[14px] bg-primary flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.2)]">
                            <Shield className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-foreground text-[16px] leading-tight tracking-tight uppercase italic">SecurePRO</span>
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[9px] text-muted-foreground font-black tracking-widest uppercase opacity-70">Admin Cloud</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="secondary" size="icon" onClick={fetchStats} className={cn("h-11 w-11 rounded-2xl bg-secondary/50", loading && "animate-spin")}>
                        <RefreshCw className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-5 pt-6 pb-28 space-y-7 animate-in fade-in slide-in-from-bottom-3 duration-700">

                {/* Search & Add Section */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Find user/device..."
                            className="w-full bg-white border border-border/60 rounded-2xl h-12 pl-11 pr-4 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                    </div>
                    <Button className="h-12 w-12 rounded-2xl bg-slate-900 shadow-xl shadow-slate-900/10 active:scale-90 transition-transform">
                        <Plus className="w-6 h-6" />
                    </Button>
                </div>

                {/* Main Action Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Active Units */}
                    <Card className="rounded-[32px] border-none bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform" onClick={() => navigate('/customers')}>
                        <CardContent className="p-5 flex flex-col gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <LayoutGrid className="w-5 h-5" />
                            </div>
                            <div className="space-y-0">
                                <p className="text-3xl font-black italic tracking-tighter">{stats.active}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Active Live</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Locked Units */}
                    <Card className="rounded-[32px] border-none bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xl shadow-rose-500/20 active:scale-95 transition-transform" onClick={() => navigate('/customers')}>
                        <CardContent className="p-5 flex flex-col gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div className="space-y-0">
                                <p className="text-3xl font-black italic tracking-tighter">{stats.locked}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Locked</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sub-Stats Bar */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-3xl p-4 border border-border/40 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <p className="text-lg font-black tracking-tight text-slate-900">{stats.total}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Fleet Size</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-4 border border-border/40 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-lg font-black tracking-tight text-amber-600">{stats.removed}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Deactivated</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions List */}
                <div className="space-y-4">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 px-1">Control Operations</h3>
                    <div className="space-y-3">
                        <button onClick={() => navigate('/add-customer')} className="w-full bg-white p-5 rounded-[28px] border border-border/40 flex items-center justify-between shadow-sm active:scale-98 transition-all hover:bg-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                    <Plus className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-extrabold text-[15px] tracking-tight">Provision New Device</p>
                                    <p className="text-[11px] text-muted-foreground font-bold">QR Generation & Setup</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground/40" />
                        </button>

                        <button onClick={() => navigate('/customers')} className="w-full bg-white p-5 rounded-[28px] border border-border/40 flex items-center justify-between shadow-sm active:scale-98 transition-all hover:bg-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Smartphone className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="font-extrabold text-[15px] tracking-tight">Monitor Active Fleet</p>
                                    <p className="text-[11px] text-muted-foreground font-bold">Live Status Tracking</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground/40" />
                        </button>
                    </div>
                </div>

                {/* Recent Activity Mini-Card */}
                <div className="bg-slate-900 rounded-[36px] p-6 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-[60px] group-hover:scale-125 transition-transform duration-1000"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Financial Analytics</p>
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase">Total Collection</h3>
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-3xl font-black tracking-tighter text-emerald-400">Pro 2.0</span>
                                <TrendingUp className="w-5 h-5 text-emerald-400 opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            {/* Bottom Floating Navigation (Native Look) */}
            <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-2xl border-t border-border/40 flex items-center justify-around px-4 pb-4 pt-2 z-[100]">
                <button className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-all group-hover:bg-primary group-hover:text-white">
                        <LayoutGrid className="w-6 h-6" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-primary">Dash</span>
                </button>
                <button onClick={() => navigate('/customers')} className="flex flex-col items-center gap-1 group active:scale-90 transition-transform text-muted-foreground">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/80 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <Smartphone className="w-6 h-6" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-50 font-bold">Fleet</span>
                </button>
                <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1 group active:scale-90 transition-transform text-muted-foreground">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/80 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <Shield className="w-6 h-6" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-50 font-bold">Admin</span>
                </button>
            </div>
        </div>
    );
}

// Utility function to merge class names
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

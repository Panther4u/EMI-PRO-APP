import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Smartphone,
    Lock,
    AlertTriangle,
    Plus,
    CheckCircle2,
    Search,
    Bell
} from 'lucide-react';
import { useDevice } from '@/context/DeviceContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Assuming this exists from shadcn setup

export default function Dashboard() {
    const navigate = useNavigate();
    const { customers } = useDevice();

    // Calculate stats on the fly
    const activeCount = customers?.filter(c => !c.isLocked && c.deviceStatus?.status !== 'REMOVED').length || 0;
    const lockedCount = customers?.filter(c => c.isLocked).length || 0;
    const totalCount = customers?.length || 0;
    const warningCount = customers?.filter(c => c.deviceStatus?.status === 'REMOVED').length || 0;

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Mobile Header */}
            <header className="px-6 pt-12 pb-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex justify-between items-center sticky top-0 z-40">
                <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Welcome Back</p>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
                </div>
                <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center relative active:scale-95 transition-all">
                    <Bell className="w-5 h-5 text-slate-600" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 space-y-6 pt-6 pb-20 no-scrollbar">

                {/* Quick Search */}
                <div className="relative group" onClick={() => navigate('/customers')}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <div className="w-full bg-white h-12 rounded-2xl border border-slate-200 shadow-sm flex items-center pl-11 text-sm font-medium text-slate-400">
                        Search devices...
                    </div>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <Card
                        className="bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20 rounded-[24px] active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative"
                        onClick={() => navigate('/customers')}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
                        <CardContent className="p-5 flex flex-col justify-between h-[140px]">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black tracking-tighter">{activeCount}</h3>
                                <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">Active Units</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className="bg-white border-slate-100 shadow-lg shadow-slate-100 rounded-[24px] active:scale-[0.98] transition-all cursor-pointer"
                        onClick={() => navigate('/customers')}
                    >
                        <CardContent className="p-5 flex flex-col justify-between h-[140px]">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                                <Lock className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black tracking-tighter text-slate-900">{lockedCount}</h3>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Locked</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Row */}
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                    <Button
                        onClick={() => navigate('/add-customer')}
                        className="h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 flex-1 shadow-none"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Device
                    </Button>
                    <Button
                        onClick={() => navigate('/customers')}
                        variant="outline"
                        className="h-12 rounded-2xl border-slate-200 text-slate-600 bg-white flex-1 shadow-sm"
                    >
                        <Smartphone className="w-4 h-4 mr-2" /> View All
                    </Button>
                </div>

                {/* Secondary Stats */}
                <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">System Status</h3>
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase">Online</span>
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                    <Smartphone className="w-4 h-4 text-slate-500" />
                                </div>
                                <span className="text-sm font-semibold text-slate-600">Total Enrolled</span>
                            </div>
                            <span className="font-bold text-slate-900">{totalCount}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                </div>
                                <span className="text-sm font-semibold text-slate-600">Action Required</span>
                            </div>
                            <span className="font-bold text-slate-900">{warningCount}</span>
                        </div>
                    </div>
                </div>

                {/* Recent Activity (Visual Placeholder) */}
                <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">Recent Updates</h3>
                    <div className="space-y-3">
                        {[1, 2].map((_, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">System Sync Complete</p>
                                    <p className="text-[10px] font-medium text-slate-400">Just now • Automatic</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

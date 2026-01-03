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
    Bell,
    TrendingUp,
    Users
} from 'lucide-react';
import { useDevice } from '@/context/DeviceContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Assuming this exists from shadcn setup
import { getApiUrl } from '@/config/api';
import PullToRefresh from 'react-simple-pull-to-refresh';

export default function Dashboard() {
    const navigate = useNavigate();
    const { customers } = useDevice();

    // Get admin info
    const adminUserStr = localStorage.getItem('adminUser');
    const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
    const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';
    const deviceLimit = adminUser?.deviceLimit || 0;
    const currentDeviceCount = customers?.length || 0;
    const remainingSlots = deviceLimit - currentDeviceCount;
    const usagePercentage = deviceLimit > 0 ? (currentDeviceCount / deviceLimit * 100) : 0;

    // Super Admin stats
    const [totalAdmins, setTotalAdmins] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const adminToken = localStorage.getItem('adminToken');

    const refreshData = async () => {
        if (!adminToken) return;

        // 1. Refresh profile info for current user
        try {
            const meRes = await fetch(getApiUrl('/api/admin/me'), {
                headers: { 'Authorization': `Bearer ${adminToken}` },
            });
            const meData = await meRes.json();
            if (meData.success) {
                localStorage.setItem('adminUser', JSON.stringify(meData.user));
            }
        } catch (err) {
            console.error('Profile refresh failed:', err);
        }

        // 2. Refresh admin count if Super Admin
        if (isSuperAdmin) {
            try {
                const usersRes = await fetch(getApiUrl('/api/admin/users'), {
                    headers: { 'Authorization': `Bearer ${adminToken}` },
                });
                const usersData = await usersRes.json();
                if (usersData.success) {
                    setTotalAdmins(usersData.admins.length);
                }
            } catch (err) {
                console.error('Error fetching admins:', err);
            }
        }
    };

    // Fetch admin count and refresh profile info
    useEffect(() => {
        refreshData();
    }, [isSuperAdmin, adminToken]);

    // Calculate stats on the fly
    const activeCount = customers?.filter(c => !c.isLocked && c.deviceStatus?.status !== 'removed').length || 0;
    const lockedCount = customers?.filter(c => c.isLocked).length || 0;
    const totalCount = customers?.length || 0;
    const warningCount = customers?.filter(c => c.deviceStatus?.status === 'removed').length || 0;

    // Get usage color
    const getUsageColor = () => {
        if (usagePercentage >= 90) return 'text-red-600 bg-red-50';
        if (usagePercentage >= 70) return 'text-orange-600 bg-orange-50';
        if (usagePercentage >= 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Mobile Header */}
            <header className="px-6 pt-12 pb-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Welcome Back</p>
                        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                            {isSuperAdmin ? 'Super Admin' : 'Admin Dashboard'}
                        </h1>
                        {isSuperAdmin ? (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-600 bg-emerald-50">
                                    {currentDeviceCount} / Unlimited devices
                                </span>
                            </div>
                        ) : deviceLimit > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getUsageColor()}`}>
                                    {currentDeviceCount}/{deviceLimit} devices
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {remainingSlots} remaining
                                </span>
                            </div>
                        )}
                    </div>
                    <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center relative active:scale-95 transition-all">
                        <Bell className="w-5 h-5 text-slate-600" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>
                </div>

                {/* Global Search for Super Admin */}
                {isSuperAdmin && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Admin, IMEI, Customer..."
                            className="w-full h-11 pl-10 pr-4 bg-slate-100/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    navigate('/customers');
                                }
                            }}
                        />
                    </div>
                )}
            </header>

            <div className="flex-1 overflow-y-auto px-6 space-y-4 pt-6 pb-20 no-scrollbar" id="scrollableDiv">
                <PullToRefresh onRefresh={async () => refreshData()}>
                    <>
                        {/* Super Admin System Overview - Primary for SA */}
                        {/* Super Admin System Overview - Grid Layout */}
                        {isSuperAdmin && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">System Health</p>
                                    <div className="px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Live Pulse</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Total Fleet */}
                                    <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 text-center h-32 w-full">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900 leading-none">{totalCount}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Fleet</p>
                                        </div>
                                    </div>

                                    {/* Active Dealers */}
                                    <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 text-center h-32 w-full">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900 leading-none">{totalAdmins}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active Dealers</p>
                                        </div>
                                    </div>

                                    {/* Active Devices */}
                                    <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 text-center h-32 w-full">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900 leading-none">{activeCount}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active Units</p>
                                        </div>
                                    </div>

                                    {/* Locked Devices */}
                                    <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 text-center h-32 w-full">
                                        <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900 leading-none">{lockedCount}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Locked Cases</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions - Realigned Grid */}
                        {isSuperAdmin && (
                            <div className="space-y-4">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1 mt-2">Quick Access</p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <button onClick={() => navigate('/admins')} className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95 text-center group h-32 w-full">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Management</p>
                                            <span className="text-xs font-bold text-slate-700">Dealers</span>
                                        </div>
                                    </button>
                                    <button onClick={() => navigate('/customers')} className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95 text-center group h-32 w-full">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                            <Smartphone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Inventory</p>
                                            <span className="text-xs font-bold text-slate-700">Devices</span>
                                        </div>
                                    </button>
                                    <button onClick={() => navigate('/customers?filter=locked')} className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95 text-center group h-32 w-full">
                                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                            <Lock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Security</p>
                                            <span className="text-xs font-bold text-slate-700">Locked</span>
                                        </div>
                                    </button>
                                    <button onClick={() => navigate('/admins')} className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95 text-center group h-32 w-full">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Audit</p>
                                            <span className="text-xs font-bold text-slate-700">Logs</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Device Limit Warning Banner for standard admins */}
                        {!isSuperAdmin && deviceLimit > 0 && usagePercentage >= 80 && (
                            <div className={`rounded-2xl p-4 border ${usagePercentage >= 100
                                ? 'bg-red-50 border-red-200'
                                : 'bg-orange-50 border-orange-200'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className={`w-5 h-5 mt-0.5 ${usagePercentage >= 100 ? 'text-red-600' : 'text-orange-600'
                                        }`} />
                                    <div className="flex-1">
                                        <h3 className={`text-sm font-bold ${usagePercentage >= 100 ? 'text-red-900' : 'text-orange-900'
                                            }`}>
                                            {usagePercentage >= 100 ? 'Device Limit Reached' : 'Approaching Device Limit'}
                                        </h3>
                                        <p className={`text-xs mt-1 ${usagePercentage >= 100 ? 'text-red-700' : 'text-orange-700'
                                            }`}>
                                            {usagePercentage >= 100
                                                ? `You've used all ${deviceLimit} device slots. Contact support to increase your limit.`
                                                : `You've used ${currentDeviceCount} of ${deviceLimit} devices (${usagePercentage.toFixed(0)}%). Only ${remainingSlots} slots remaining.`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Device Limit Progress for normal admins */}
                        {!isSuperAdmin && deviceLimit > 0 && (
                            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Device Capacity</p>
                                        <p className="text-xl font-black text-slate-900 leading-none">{currentDeviceCount} / {deviceLimit}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${usagePercentage >= 90 ? 'bg-red-50 text-red-600' :
                                        usagePercentage >= 70 ? 'bg-orange-50 text-orange-600' :
                                            'bg-emerald-50 text-emerald-600'
                                        }`}>
                                        {usagePercentage.toFixed(0)}% Used
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 shadow-sm ${usagePercentage >= 90 ? 'bg-red-500 shadow-red-200' :
                                            usagePercentage >= 70 ? 'bg-orange-500 shadow-orange-200' :
                                                'bg-emerald-500 shadow-emerald-200'
                                            }`}
                                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                    {remainingSlots > 0 ? `${remainingSlots} slots available for enrollment` : 'Full capacity reached'}
                                </p>
                            </div>
                        )}



                        {/* Recent Activity Section */}
                        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4 mt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Activity</h3>
                                <Button variant="ghost" size="sm" className="text-[10px] font-bold text-primary" onClick={() => navigate('/admins')}>
                                    View Portal
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {[1, 2].map((_, i) => (
                                    <div key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                            i === 0 ? "bg-blue-50 text-blue-500" : "bg-emerald-50 text-emerald-500"
                                        )}>
                                            {i === 0 ? <TrendingUp className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-xs font-black text-slate-900">{i === 0 ? 'Fleet Sync Active' : 'Security Audit Passed'}</p>
                                                <span className="text-[9px] font-bold text-slate-400">2M AGO</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                                {i === 0 ? 'Synchronizing global dealer network status...' : 'All systems reporting healthy and secured.'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-center pt-2">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] opacity-80">
                                Unified Management Console v2.5
                            </p>
                        </div>
                    </>
                </PullToRefresh>
            </div>
        </div>
    );
}

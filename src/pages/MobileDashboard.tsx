import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Menu, Smartphone, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
                    removed: customers.filter((c: any) => c.deviceStatus?.status === 'REMOVED').length
                });
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateQR = (type: 'fresh' | 'used' | 'ios') => {
        if (type === 'ios') {
            alert('iOS device provisioning is not yet supported. Please use Android devices.');
            return;
        }
        navigate('/customers');
    };

    return (
        <div className="min-h-screen h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold text-lg">SecureFinance</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-2 pb-20">
                {/* Title */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-sm text-gray-500">Manage your devices</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchStats}
                        disabled={loading}
                        className="gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Generate Device QR */}
                <Card className="p-4 mb-6">
                    <h2 className="font-semibold text-lg mb-2">Generate Device QR</h2>
                    <p className="text-sm text-gray-500 mb-4">Tap below to add new device</p>

                    <div className="space-y-3">
                        {/* Fresh Android */}
                        <button
                            onClick={() => handleGenerateQR('fresh')}
                            className="w-full bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4 hover:bg-green-100 transition-colors"
                        >
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Smartphone className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-gray-900">Fresh Android</div>
                                <div className="text-sm text-gray-600">Factory reset → Tap 6 times → Scan</div>
                                <div className="text-xs font-semibold text-green-600 mt-1">NEW DEVICES</div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Used Android */}
                        <button
                            onClick={() => handleGenerateQR('used')}
                            className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4 hover:bg-blue-100 transition-colors"
                        >
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Smartphone className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-gray-900">Used Android</div>
                                <div className="text-sm text-gray-600">Install APK → Open → Scan</div>
                                <div className="text-xs font-semibold text-blue-600 mt-1">EXISTING DATA</div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* iPhone/iPad */}
                        <button
                            onClick={() => handleGenerateQR('ios')}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Apple className="w-6 h-6 text-gray-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-gray-900">iPhone / iPad</div>
                                <div className="text-sm text-gray-600">Install App → Scan</div>
                                <div className="text-xs font-semibold text-gray-600 mt-1">IOS DEVICES</div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <Card className="p-4 text-center">
                        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                        <div className="text-sm text-gray-500 uppercase mt-1">Total</div>
                    </Card>
                    <Card className="p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">{stats.active}</div>
                        <div className="text-sm text-gray-500 uppercase mt-1">Active</div>
                    </Card>
                    <Card className="p-4 text-center">
                        <div className="text-3xl font-bold text-red-600">{stats.locked}</div>
                        <div className="text-sm text-gray-500 uppercase mt-1">Locked</div>
                    </Card>
                    <Card className="p-4 text-center">
                        <div className="text-3xl font-bold text-gray-600">{stats.removed}</div>
                        <div className="text-sm text-gray-500 uppercase mt-1">Removed</div>
                    </Card>
                </div>

                {/* Devices Section */}
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-gray-600" />
                            <h2 className="font-semibold text-lg">Devices</h2>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">{stats.total}</span>
                    </div>
                    <p className="text-sm text-gray-500">All registered devices</p>
                    <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => navigate('/devices')}
                    >
                        View All Devices
                    </Button>
                </Card>
            </div>
        </div>
    );
}

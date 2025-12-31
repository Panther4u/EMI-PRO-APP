import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Phone, CreditCard, Smartphone, Calendar, Shield, AlertTriangle, QrCode, Lock, Unlock, Check, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { customers, toggleLock, deleteCustomer, refreshCustomers } = useDevice();
    const customer = customers.find(c => c.id === id);
    const [qrPayload, setQrPayload] = useState<string>('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Poll for status updates every 5 seconds
    useEffect(() => {
        if (!customer) return;

        const interval = setInterval(() => {
            refreshCustomers();
        }, 5000);

        return () => clearInterval(interval);
    }, [customer?.id]);

    useEffect(() => {
        if (customer?.id) {
            fetch(`${API_BASE_URL}/api/provisioning/payload/${customer.id}`)
                .then(res => res.json())
                .then(data => setQrPayload(JSON.stringify(data)))
                .catch(err => console.error("Failed to load QR payload", err));
        }
    }, [customer?.id]);

    if (!customer) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-bold mb-4">Customer Not Found</h2>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    const remainingEmis = (customer.totalEmis || 0) - (customer.paidEmis || 0);
    const progress = customer.totalEmis ? ((customer.paidEmis || 0) / customer.totalEmis) * 100 : 0;

    const handleLockToggle = () => {
        toggleLock(customer.id, !customer.isLocked, 'Manual Admin Action');
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            await deleteCustomer(customer.id);
            navigate('/customers');
        }
    };

    const handleRefreshDeviceDetails = async () => {
        setIsRefreshing(true);
        try {
            await refreshCustomers();
            toast({
                title: 'Device Details Refreshed',
                description: 'Latest device information has been loaded from the backend.',
            });
        } catch (error) {
            console.error('Error refreshing device details:', error);
            toast({
                title: 'Refresh Failed',
                description: 'Could not fetch latest device details. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* ... Header and Profile Card ... */}

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Customer Details</h1>
                    <p className="text-sm text-muted-foreground">ID: {customer.id}</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="glass-card p-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold",
                            customer.isLocked ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
                        )}>
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{customer.name}</h2>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                <Phone className="w-3 h-3" />
                                {customer.phoneNo}
                            </div>
                        </div>
                    </div>
                    <Badge variant="outline" className={customer.isLocked ? "status-locked" : "status-unlocked"}>
                        {customer.isLocked ? 'Locked' : 'Active'}
                    </Badge>
                </div>

                {/* Verification Alert */}
                {customer.deviceStatus?.errorMessage && customer.deviceStatus.errorMessage.includes('Mismatch') && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 mb-6">
                        <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                        <div>
                            <h3 className="font-bold text-destructive">Device Verification Failed</h3>
                            <p className="text-sm text-foreground/80">{customer.deviceStatus.errorMessage}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                The device using this account does not match the registered IMEI.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-secondary/50 rounded-xl space-y-2">
                        <span className="text-xs text-muted-foreground block font-bold">DEVICE INFO</span>

                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Model</span>
                            <div className="font-medium flex items-center gap-2">
                                <Smartphone className="w-4 h-4" />
                                {customer.deviceStatus?.technical?.model
                                    ? `${customer.deviceStatus.technical.brand || ''} ${customer.deviceStatus.technical.model}`
                                    : (customer.mobileModel || 'Unknown Model')}
                            </div>
                        </div>

                        {customer.deviceStatus?.technical?.osVersion && (
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Android Version</span>
                                <div className="text-sm">Android {customer.deviceStatus.technical.osVersion}</div>
                            </div>
                        )}

                        <div className="space-y-1 border-t border-border/50 pt-2 mt-2">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">IMEI / Serial</span>
                            <div className="text-xs font-mono select-all">IMEI: {customer.imei1}</div>
                            {customer.deviceStatus?.technical?.serial && (
                                <div className="text-xs font-mono select-all text-muted-foreground">SN: {customer.deviceStatus.technical.serial}</div>
                            )}
                        </div>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-xl space-y-1">
                        <span className="text-xs text-muted-foreground block">Location</span>
                        <div className="font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {customer.address}
                        </div>
                    </div>

                    {/* SIM Details Card */}
                    <div className="p-4 bg-secondary/50 rounded-xl space-y-1">
                        <span className="text-xs text-muted-foreground block">Active SIM</span>
                        <div className="font-medium flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">S</div>
                            {customer.simDetails?.operator || 'Unknown Network'}
                        </div>
                        {customer.simDetails?.phoneNumber && (
                            <span className="text-xs text-muted-foreground block">Num: {customer.simDetails.phoneNumber}</span>
                        )}
                        {customer.simDetails?.imsi && (
                            <span className="text-xs text-muted-foreground block">IMSI: {customer.simDetails.imsi.substring(0, 5)}...</span>
                        )}
                    </div>

                    {/* Offline Lock Card */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-1">
                        <span className="text-xs text-primary font-bold block mb-1">OFFLINE LOCK</span>
                        <p className="text-xs text-muted-foreground mb-2">Send SMS to device number to lock instantly without internet.</p>
                        <div className="bg-white p-2 rounded border border-border flex items-center justify-between">
                            <code className="text-sm font-bold text-primary">LOCK {customer.offlineLockToken || '...'}</code>
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => {
                                navigator.clipboard.writeText(`LOCK ${customer.offlineLockToken}`);
                            }}>Copy</Button>
                        </div>
                    </div>
                </div>

                {/* Refresh Device Details */}
                <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleRefreshDeviceDetails}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Device Details'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Fetch latest device information from backend
                    </p>
                </div>

                {/* Device Actions */}
                <div className="mt-6 pt-6 border-t border-border/50">
                    <h3 className="font-semibold mb-4 text-sm">Device Controls</h3>
                    <div className="flex gap-3">
                        <Button
                            className={cn("flex-1 gap-2", customer.isLocked ? "bg-success hover:bg-success/90 text-white" : "bg-destructive hover:bg-destructive/90 text-white")}
                            onClick={handleLockToggle}
                        >
                            {customer.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            {customer.isLocked ? 'Unlock Device' : 'Lock Device'}
                        </Button>
                        <Button className="flex-1" variant="outline" onClick={() => navigate(`/customers/${id}/edit`)}>Edit Details</Button>
                        <Button
                            className="flex-shrink-0 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border-destructive/20"
                            variant="outline"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </div>

            {/* QR Code Section */}

            {/* QR Code Section */}
            <div className="glass-card p-6 flex flex-col items-center text-center">
                <h3 className="font-semibold mb-4 flex items-center gap-2 self-start">
                    <QrCode className="w-4 h-4 text-primary" />
                    Device QR Code
                </h3>
                <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                    {/* Debug: Log QR data */}
                    {(() => {
                        if (!qrPayload) return <p className="text-sm text-muted-foreground p-4">Loading QR...</p>;
                        return (
                            <div className="bg-white p-2 rounded-xl">
                                <QRCodeSVG
                                    value={qrPayload}
                                    size={320}
                                    level="L"
                                    bgColor="#FFFFFF"
                                    fgColor="#000000"
                                    includeMargin={true}
                                />
                            </div>
                        );
                    })()}
                </div>
                <p className="text-sm text-muted-foreground">Scan to configure mobile client</p>
            </div>

            {/* EMI Status */}
            <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    EMI Status
                </h3>

                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{customer.paidEmis || 0} / {customer.totalEmis || 0} Months</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all duration-500", customer.isLocked ? "bg-destructive" : "bg-primary")}
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Device Price</p>
                        <p className="text-lg font-bold">₹{(customer.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Monthly Amount</p>
                        <p className="text-lg font-bold">₹{(customer.emiAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Total Remaining</p>
                        <p className="text-lg font-bold text-destructive">₹{((remainingEmis || 0) * (customer.emiAmount || 0)).toLocaleString()}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Next Due Date</p>
                        <p className="font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {customer.emiDate}th of Month
                        </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Finance Provider</p>
                        <p className="font-medium">{customer.financeName}</p>
                    </div>
                </div>
            </div>

            {/* Lock History */}
            <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Lock History
                </h3>
                <div className="space-y-4">
                    {customer.lockHistory.length > 0 ? (
                        customer.lockHistory.slice().reverse().map((event) => (
                            <div key={event.id} className="flex items-start gap-3 text-sm pb-4 border-b border-border/50 last:border-0 last:pb-0">
                                <div className={cn(
                                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                    event.action === 'locked' ? "bg-destructive" : "bg-success"
                                )} />
                                <div>
                                    <p className="font-medium">Device {event.action === 'locked' ? 'Locked' : 'Unlocked'}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(event.timestamp), 'PPpp')}</p>
                                    <p className="text-xs mt-1 bg-secondary/50 p-1.5 rounded text-muted-foreground">{event.reason}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">No lock history available.</p>
                    )}
                </div>
            </div>
            {/* Onboarding Process Status - LIVE */}
            <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" />
                    Device Onboarding Status
                </h3>
                <div className="space-y-4">
                    {/* Step 1: QR Scanned */}
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                            customer.deviceStatus?.steps?.qrScanned ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
                        )}>
                            {customer.deviceStatus?.steps?.qrScanned ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                        <div className="flex-1">
                            <p className={cn("text-sm font-medium", !customer.deviceStatus?.steps?.qrScanned && "text-muted-foreground")}>QR Scanned</p>
                            <p className="text-xs text-muted-foreground">
                                {customer.deviceStatus?.steps?.qrScanned ? "Device successfully scanned the setup QR." : "Waiting for scan..."}
                            </p>
                        </div>
                    </div>

                    {/* Step 2: App Installed */}
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                            customer.deviceStatus?.steps?.appInstalled ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
                        )}>
                            {customer.deviceStatus?.steps?.appInstalled ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                        <div className="flex-1">
                            <p className={cn("text-sm font-medium", !customer.deviceStatus?.steps?.appInstalled && "text-muted-foreground")}>App Installed</p>
                            <p className="text-xs text-muted-foreground">
                                {customer.deviceStatus?.steps?.appInstalled ? "Client application installed on device." : "Waiting for installation..."}
                            </p>
                        </div>
                    </div>

                    {/* Step 3: App Launched */}
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                            customer.deviceStatus?.steps?.appLaunched ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
                        )}>
                            {customer.deviceStatus?.steps?.appLaunched ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                        <div className="flex-1">
                            <p className={cn("text-sm font-medium", !customer.deviceStatus?.steps?.appLaunched && "text-muted-foreground")}>App Launched</p>
                            <p className="text-xs text-muted-foreground">
                                {customer.deviceStatus?.steps?.appLaunched ? "Mobile app started successfully." : "Waiting for FIRST launch..."}
                            </p>
                        </div>
                    </div>

                    {/* Step 4: Details Fetched */}
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                            customer.deviceStatus?.steps?.detailsFetched ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
                        )}>
                            {customer.deviceStatus?.steps?.detailsFetched ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                        <div className="flex-1">
                            <p className={cn("text-sm font-medium", !customer.deviceStatus?.steps?.detailsFetched && "text-muted-foreground")}>Device Details Fetched</p>
                            <p className="text-xs text-muted-foreground">
                                {customer.deviceStatus?.steps?.detailsFetched ? "IMEI, SIM, and Model info received." : "Waiting for device report..."}
                            </p>
                        </div>
                    </div>

                    {/* Step 4: Verified */}
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                            customer.deviceStatus?.steps?.imeiVerified ? "bg-success/20 text-success" :
                                (customer.deviceStatus?.status === 'error' ? "bg-destructive/20 text-destructive" : "bg-secondary text-muted-foreground")
                        )}>
                            {customer.deviceStatus?.steps?.imeiVerified ? <Check className="w-4 h-4" /> :
                                (customer.deviceStatus?.status === 'error' ? <AlertTriangle className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />)}
                        </div>
                        <div className="flex-1">
                            <p className={cn("text-sm font-medium", !customer.deviceStatus?.steps?.imeiVerified && "text-muted-foreground")}>IMEI Verified</p>
                            <p className="text-xs text-muted-foreground">
                                {customer.deviceStatus?.steps?.imeiVerified ? "Device matches Admin records." :
                                    (customer.deviceStatus?.status === 'error' ? "Verification FAILED: IMEI Mismatch!" : "Verifying identity...")}
                            </p>
                        </div>
                    </div>

                    {/* Step 5: Final Binding */}
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                            customer.deviceStatus?.steps?.deviceBound ? "bg-indigo-100 text-indigo-600" : "bg-secondary text-muted-foreground"
                        )}>
                            {customer.deviceStatus?.steps?.deviceBound ? <Shield className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                        <div className="flex-1">
                            <p className={cn("text-sm font-medium", !customer.deviceStatus?.steps?.deviceBound && "text-muted-foreground")}>Device Bound (Active)</p>
                            <p className="text-xs text-muted-foreground">
                                {customer.deviceStatus?.steps?.deviceBound ? "Device is fully secured and active." : "Waiting for verification..."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <Button className="flex-1" variant="outline" onClick={() => navigate(`/customers/${id}/edit`)}>Edit Details</Button>
            </div>
        </div>
    );
};

export default CustomerDetails;

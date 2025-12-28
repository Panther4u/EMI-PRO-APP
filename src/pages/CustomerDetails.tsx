import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { getProvisioningQRData } from '@/utils/provisioning';
import { useParams, useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Phone, CreditCard, Smartphone, Calendar, Shield, AlertTriangle, QrCode, Lock, Unlock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { customers, toggleLock, deleteCustomer } = useDevice();
    const customer = customers.find(c => c.id === id);

    if (!customer) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-bold mb-4">Customer Not Found</h2>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    const remainingEmis = customer.totalEmis - customer.paidEmis;
    const progress = (customer.paidEmis / customer.totalEmis) * 100;

    const handleLockToggle = () => {
        toggleLock(customer.id, !customer.isLocked, 'Manual Admin Action');
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            await deleteCustomer(customer.id);
            navigate('/customers');
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-secondary/50 rounded-xl space-y-1">
                        <span className="text-xs text-muted-foreground block">Device</span>
                        <div className="font-medium flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            {customer.mobileModel}
                        </div>
                        <span className="text-xs text-muted-foreground">{customer.imei1}</span>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-xl space-y-1">
                        <span className="text-xs text-muted-foreground block">Location</span>
                        <div className="font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {customer.address}
                        </div>
                    </div>
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
                    <QRCodeSVG
                        value={getProvisioningQRData(customer, window.location.origin)}
                        size={180}
                        level="H"
                        includeMargin={true}
                    />
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
                        <span className="font-medium">{customer.paidEmis} / {customer.totalEmis} Months</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all duration-500", customer.isLocked ? "bg-destructive" : "bg-primary")}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Device Price</p>
                        <p className="text-lg font-bold">₹{customer.totalAmount?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Monthly Amount</p>
                        <p className="text-lg font-bold">₹{customer.emiAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Total Remaining</p>
                        <p className="text-lg font-bold text-destructive">₹{(remainingEmis * customer.emiAmount).toLocaleString()}</p>
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
            <div className="flex gap-3">
                <Button className="flex-1" variant="outline" onClick={() => navigate(`/customers/${id}/edit`)}>Edit Details</Button>
            </div>
        </div>
    );
};

export default CustomerDetails;

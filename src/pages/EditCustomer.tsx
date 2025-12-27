import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const EditCustomer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { customers, updateCustomer } = useDevice();
    const customer = customers.find(c => c.id === id);

    const [formData, setFormData] = useState({
        name: customer?.name || '',
        phoneNo: customer?.phoneNo || '',
        aadharNo: customer?.aadharNo || '',
        address: customer?.address || '',
        deviceName: customer?.deviceName || '',
        mobileModel: customer?.mobileModel || '',
        imei1: customer?.imei1 || '',
        imei2: customer?.imei2 || '',
        financeName: customer?.financeName || '',
        totalAmount: customer?.totalAmount || 0,
        emiAmount: customer?.emiAmount || 0,
        totalEmis: customer?.totalEmis || 0,
        paidEmis: customer?.paidEmis || 0,
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                phoneNo: customer.phoneNo || '',
                aadharNo: customer.aadharNo || '',
                address: customer.address || '',
                deviceName: customer.deviceName || '',
                mobileModel: customer.mobileModel || '',
                imei1: customer.imei1 || '',
                imei2: customer.imei2 || '',
                financeName: customer.financeName || '',
                totalAmount: customer.totalAmount || 0,
                emiAmount: customer.emiAmount || 0,
                totalEmis: customer.totalEmis || 0,
                paidEmis: customer.paidEmis || 0,
            });
        }
    }, [customer]);

    if (!customer) {
        return <div>Customer not found</div>;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('Amount') || name.includes('Emis') ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateCustomer(customer.id, formData);
            toast.success('Customer updated successfully');
            navigate(-1);
        } catch (error) {
            toast.error('Failed to update customer');
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Edit Customer</h1>
                    <p className="text-sm text-muted-foreground">{customer.name}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="glass-card p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phoneNo">Phone Number</Label>
                            <Input id="phoneNo" name="phoneNo" value={formData.phoneNo} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="aadharNo">Aadhar Number</Label>
                            <Input id="aadharNo" name="aadharNo" value={formData.aadharNo} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" value={formData.address} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Device Information */}
                <div className="glass-card p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Device Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="deviceName">Brand</Label>
                            <Input id="deviceName" name="deviceName" value={formData.deviceName} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobileModel">Model</Label>
                            <Input id="mobileModel" name="mobileModel" value={formData.mobileModel} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imei1">IMEI 1</Label>
                            <Input id="imei1" name="imei1" value={formData.imei1} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imei2">IMEI 2</Label>
                            <Input id="imei2" name="imei2" value={formData.imei2} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Finance Information */}
                <div className="glass-card p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Finance Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="financeName">Finance Provider</Label>
                            <Input id="financeName" name="financeName" value={formData.financeName} onChange={handleChange} placeholder="e.g. Bajaj Finserv" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="totalAmount">Total Amount (₹)</Label>
                            <Input id="totalAmount" name="totalAmount" type="number" value={formData.totalAmount} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emiAmount">EMI Amount (₹)</Label>
                            <Input id="emiAmount" name="emiAmount" type="number" value={formData.emiAmount} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="totalEmis">Total EMIs</Label>
                            <Input id="totalEmis" name="totalEmis" type="number" value={formData.totalEmis} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paidEmis">Paid EMIs</Label>
                            <Input id="paidEmis" name="paidEmis" type="number" value={formData.paidEmis} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <Button type="submit" className="w-full h-11 text-base gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                </Button>
            </form>
        </div>
    );
};

export default EditCustomer;

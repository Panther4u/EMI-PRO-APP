import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer } from '../types/customer';
import { toast } from 'sonner';
import { getApiUrl } from '../config/api';

interface DeviceContextType {
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    isAppLocked: boolean;
    setIsAppLocked: (locked: boolean) => void;
    refreshCustomers: () => Promise<void>;
    updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
    addCustomer: (customer: any) => Promise<void>;
    toggleLock: (id: string, status: boolean, reason?: string) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Start with empty customers - will be loaded from backend
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isAppLocked, setIsAppLocked] = useState(false);

    // Save customers to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('customers', JSON.stringify(customers));
    }, [customers]);

    const refreshCustomers = async () => {
        try {
            const response = await fetch(getApiUrl('/api/customers'));
            if (!response.ok) throw new Error('Failed to fetch customers');
            const data = await response.json();
            setCustomers(data);
        } catch (error) {
            console.log('Running in simulation mode (No Backend detected)');
            // Load from localStorage if backend is not available
            const saved = localStorage.getItem('customers');
            if (saved) {
                setCustomers(JSON.parse(saved));
            }
        }
    };

    const updateCustomer = async (id: string, updates: Partial<Customer>) => {
        // Optimistic Update (Immediate UI reflection)
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

        try {
            const response = await fetch(getApiUrl(`/api/customers/${id}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update customer');
        } catch (error) {
            // Silently fail in simulation mode or log
            console.warn('API update failed, using local state only');
        }
    };

    const addCustomer = async (customerData: Omit<Customer, 'createdAt' | 'lockHistory'>) => {
        const newCustomer: Customer = {
            ...customerData,
            createdAt: new Date().toISOString(),
            lockHistory: [],
            isLocked: false,
            location: {
                lat: 0,
                lng: 0,
                lastUpdated: new Date().toISOString()
            }
        };

        // Optimistic Update
        setCustomers(prev => [newCustomer, ...prev]);
        toast.success('Customer registered successfully');

        try {
            const response = await fetch(getApiUrl('/api/customers'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer),
            });
            if (!response.ok) throw new Error('Failed to add customer');
        } catch (error) {
            console.warn('API add failed, using local state only');
        }
    };

    const toggleLock = async (id: string, status: boolean, reason: string = 'Manual override') => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;

        const newHistory = {
            id: Date.now().toString(),
            action: status ? 'locked' : 'unlocked' as const,
            timestamp: new Date().toISOString(),
            reason
        };

        const updatedLockHistory = [...customer.lockHistory, newHistory];

        // Optimistic update handled by updateCustomer
        await updateCustomer(id, {
            isLocked: status,
            lockHistory: updatedLockHistory as any
        });

        toast.success(`Device ${status ? 'Locked' : 'Unlocked'} Successfully`);
    };

    const deleteCustomer = async (id: string) => {
        // Store original state for rollback
        const originalCustomers = customers;

        // Optimistic Update
        setCustomers(prev => prev.filter(c => c.id !== id));

        try {
            const response = await fetch(getApiUrl(`/api/customers/${id}`), {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to delete customer' }));
                throw new Error(errorData.message || 'Failed to delete customer');
            }

            toast.success('Customer deleted successfully');
        } catch (error) {
            // Rollback on error
            setCustomers(originalCustomers);
            console.error('Delete failed:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete customer. Please try again.');
        }
    };

    useEffect(() => {
        // Initial load
        refreshCustomers();

        // Poll every 3 seconds for real-time updates
        const interval = setInterval(() => {
            refreshCustomers();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <DeviceContext.Provider value={{
            customers,
            setCustomers,
            isAppLocked,
            setIsAppLocked,
            refreshCustomers,
            updateCustomer,
            addCustomer,
            toggleLock,
            deleteCustomer
        }}>
            {children}
        </DeviceContext.Provider>
    );
};

export const useDevice = () => {
    const context = useContext(DeviceContext);
    if (context === undefined) {
        throw new Error('useDevice must be used within a DeviceProvider');
    }
    return context;
};

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDevice } from '@/context/DeviceContext';
import { toast } from 'sonner';
import {
  Shield,
  Bell,
  User,
  Lock,
  Database,
  Smartphone,
  Mail,
  Key,
  CheckCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const Settings = () => {
  const { currentAdmin, updateAdmin } = useAuth();
  const { refreshCustomers } = useDevice();
  const [newPin, setNewPin] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleUpdatePin = () => {
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      toast.error('PIN must be 6 digits');
      return;
    }

    if (!currentAdmin) {
      toast.error('Admin session not found');
      return;
    }

    updateAdmin(currentAdmin.id, { pin: newPin });
    toast.success('Admin PIN updated successfully');
    setNewPin('');
    setIsUpdating(false);
  };

  const handleResetAllData = async () => {
    if (!isResetting) {
      setIsResetting(true);
      return;
    }

    try {
      // Clear backend database
      const response = await fetch('/api/customers/danger/delete-all', {
        method: 'DELETE',
      });

      if (response.ok) {
        // Clear localStorage
        localStorage.removeItem('customers');

        toast.success('All data cleared successfully! Refreshing...');

        // Reload the page to reset state
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error('Failed to clear backend data');
      }
    } catch (error) {
      console.error('Reset error:', error);
      // Even if backend fails, clear localStorage
      localStorage.removeItem('customers');
      toast.success('Local data cleared. Page will refresh...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your admin preferences and system configuration</p>
      </div>

      {/* Admin Credentials Management */}
      <div className="glass-card p-6 border-primary/20 bg-primary/5">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          Admin Credentials
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Current Admin PIN</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={currentAdmin?.pin ? "••••••" : "Not Set"}
                  disabled
                  className="bg-secondary/30 border-border/50 h-10 font-mono tracking-widest text-lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUpdating(!isUpdating)}
                >
                  Change
                </Button>
              </div>
            </div>

            {isUpdating && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-xs">New 6-Digit PIN</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter new 6-digit PIN"
                    className="bg-background border-primary/30 h-10 font-mono tracking-widest text-lg"
                  />
                  <Button onClick={handleUpdatePin}>Update</Button>
                </div>
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground italic">
            * This PIN is required to access the Admin Portal and perform sensitive actions.
          </p>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Admin Profile
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Full Name</Label>
            <Input defaultValue="Admin User" className="bg-secondary/50 border-border/50 h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email Address</Label>
            <Input defaultValue="admin@securefinance.com" className="bg-secondary/50 border-border/50 h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phone Number</Label>
            <Input defaultValue="+91 98765 43210" className="bg-secondary/50 border-border/50 h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Input defaultValue="Super Admin" disabled className="bg-secondary/50 border-border/50 h-9" />
          </div>
        </div>
        <Button className="mt-4">Save Changes</Button>
      </div>

      {/* Security Settings */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Security
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Auto Lock Timeout</p>
                <p className="text-sm text-muted-foreground">Lock session after inactivity</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive alerts via email</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Get instant mobile alerts</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">EMI Due Reminders</p>
                <p className="text-sm text-muted-foreground">Alert before EMI due dates</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          System Information
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Version</p>
            <p className="font-mono text-sm text-foreground">v1.0.0</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Last Backup</p>
            <p className="font-mono text-sm text-foreground">2024-01-15</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Database</p>
            <p className="text-success text-sm font-medium">Connected</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Sessions</p>
            <p className="font-mono text-sm text-foreground">1</p>
          </div>
        </div>
      </div>

      {/* Danger Zone - Reset All Data */}
      <div className="glass-card p-6 border-destructive/30 bg-destructive/5">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Danger Zone
        </h2>
        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Reset All Data</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This will permanently delete all customer records, device data, and history from both the database and local storage. This action cannot be undone.
                </p>
              </div>
            </div>

            {isResetting && (
              <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-3 mb-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Are you absolutely sure?
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click "Confirm Reset" again to permanently delete all data.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant={isResetting ? "destructive" : "outline"}
                onClick={handleResetAllData}
                className={isResetting ? "border-destructive" : "border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isResetting ? "Confirm Reset" : "Reset All Data"}
              </Button>

              {isResetting && (
                <Button
                  variant="outline"
                  onClick={() => setIsResetting(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

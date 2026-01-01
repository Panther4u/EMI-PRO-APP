import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDevice } from '@/context/DeviceContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getApiUrl } from '@/config/api';
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
      const response = await fetch(getApiUrl('/api/customers/danger/delete-all'), {
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
    <div className="space-y-4 max-w-4xl pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-xs text-muted-foreground">Manage your admin preferences and system configuration</p>
      </div>

      {/* Admin Credentials Management */}
      <div className="glass-card p-4 border-primary/20 bg-primary/5">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          Admin Credentials
        </h2>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Admin PIN</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={currentAdmin?.pin ? "••••••" : "Not Set"}
                  disabled
                  className="bg-secondary/30 border-border/50 h-9 font-mono tracking-widest text-base"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setIsUpdating(!isUpdating)}
                >
                  Change
                </Button>
              </div>
            </div>

            {isUpdating && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">New 6-Digit PIN</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter new 6-digit PIN"
                    className="bg-background border-primary/30 h-9 font-mono tracking-widest text-base"
                  />
                  <Button size="sm" className="h-9" onClick={handleUpdatePin}>Update</Button>
                </div>
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            * This PIN is required to access the Admin Portal and perform sensitive actions.
          </p>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="glass-card p-4">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Admin Profile
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Full Name</Label>
            <Input defaultValue="Admin User" className="bg-secondary/50 border-border/50 h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email Address</Label>
            <Input defaultValue="admin@securefinance.com" className="bg-secondary/50 border-border/50 h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Phone Number</Label>
            <Input defaultValue="+91 98765 43210" className="bg-secondary/50 border-border/50 h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Role</Label>
            <Input defaultValue="Super Admin" disabled className="bg-secondary/50 border-border/50 h-9 text-sm" />
          </div>
        </div>
        <Button size="sm" className="mt-4 h-9">Save Changes</Button>
      </div>

      {/* Security Settings */}
      <div className="glass-card p-4">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Security
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm text-foreground">Two-Factor Auth</p>
                <p className="text-[10px] text-muted-foreground">Add extra security layer</p>
              </div>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm text-foreground">Auto Lock Timeout</p>
                <p className="text-[10px] text-muted-foreground">Lock after inactivity</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass-card p-4">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Notifications
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm text-foreground">Email Notifications</p>
                <p className="text-[10px] text-muted-foreground">Receive alerts via email</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm text-foreground">Push Notifications</p>
                <p className="text-[10px] text-muted-foreground">Instant mobile alerts</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm text-foreground">EMI Reminders</p>
                <p className="text-[10px] text-muted-foreground">Alert before due dates</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="glass-card p-4">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          System Information
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/30 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">Version</p>
            <p className="font-mono text-xs text-foreground">v1.0.0</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">Last Backup</p>
            <p className="font-mono text-xs text-foreground">2024-01-15</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">Database</p>
            <p className="text-success text-xs font-medium">Connected</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">Sessions</p>
            <p className="font-mono text-xs text-foreground">1</p>
          </div>
        </div>
      </div>

      {/* Danger Zone - Reset All Data */}
      <div className="glass-card p-4 border-destructive/30 bg-destructive/5">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          Danger Zone
        </h2>
        <div className="space-y-3">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-start gap-3 mb-3">
              <Trash2 className="w-4 h-4 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">Reset All Data</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Permanently delete all customer records and data. Cannot be undone.
                </p>
              </div>
            </div>

            {isResetting && (
              <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-3 mb-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Are you absolutely sure?
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Click "Confirm Reset" again to permanently delete.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant={isResetting ? "destructive" : "outline"}
                size="sm"
                onClick={handleResetAllData}
                className={cn("h-8 text-xs", isResetting ? "border-destructive" : "border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground")}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {isResetting ? "Confirm Reset" : "Reset Data"}
              </Button>

              {isResetting && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
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

import { LockControlPanel } from '../components/LockControlPanel';
import { useDevice } from '../context/DeviceContext';
import { Customer } from '@/types/customer';

const LockControl = () => {
  const { customers, toggleLock, updateCustomer } = useDevice();

  const handleLockToggle = async (id: string, status: boolean) => {
    await toggleLock(id, status, "Manual toggle from Lock Control Panel");
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    await updateCustomer(id, updates);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Lock Control</h1>
        <p className="text-muted-foreground">Manage device lock status</p>
      </div>

      {/* Lock Control Panel */}
      <LockControlPanel
        customers={customers}
        onLockToggle={handleLockToggle}
        onUpdateCustomer={handleUpdateCustomer}
      />
    </div>
  );
};

export default LockControl;

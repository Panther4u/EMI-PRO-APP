import { LocationTracker } from '@/components/LocationTracker';
import { useDevice } from '@/context/DeviceContext';

const Location = () => {
  const { customers } = useDevice();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Location Tracking</h1>
        <p className="text-muted-foreground">Track locked device locations in real-time</p>
      </div>

      {/* Location Tracker */}
      <LocationTracker customers={customers} />
    </div>
  );
};

export default Location;

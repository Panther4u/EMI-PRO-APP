import { QRCodeGenerator } from '@/components/QRCodeGenerator';

const GenerateQR = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Generate QR Code</h1>
        <p className="text-muted-foreground">Create QR codes for new customer device registration</p>
      </div>

      {/* QR Generator */}
      <QRCodeGenerator />
    </div>
  );
};

export default GenerateQR;

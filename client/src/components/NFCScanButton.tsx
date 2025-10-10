import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Nfc, Loader2 } from "lucide-react";

interface NFCScanButtonProps {
  onScan?: (nfcId: string) => void;
  className?: string;
}

export default function NFCScanButton({ onScan, className }: NFCScanButtonProps) {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    console.log('NFC scan initiated');
    
    // Simulate NFC scan
    setTimeout(() => {
      const mockNfcId = `NFC-${Math.random().toString(36).substr(2, 9)}`;
      console.log('NFC scanned:', mockNfcId);
      onScan?.(mockNfcId);
      setIsScanning(false);
    }, 2000);
  };

  return (
    <Button
      size="lg"
      onClick={handleScan}
      disabled={isScanning}
      className={`h-32 w-32 rounded-full ${isScanning ? 'animate-pulse' : ''} ${className || ''}`}
      data-testid="button-nfc-scan"
    >
      {isScanning ? (
        <Loader2 className="h-12 w-12 animate-spin" />
      ) : (
        <Nfc className="h-12 w-12" />
      )}
    </Button>
  );
}

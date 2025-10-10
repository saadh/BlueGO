import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Nfc, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NFCScanButtonProps {
  onScan?: (nfcId: string) => void;
  className?: string;
  gateSelected?: boolean;
}

export default function NFCScanButton({ onScan, className, gateSelected = false }: NFCScanButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const startContinuousScanning = async () => {
    if (!gateSelected) {
      toast({
        title: "Select a gate first",
        description: "Please select your gate location before scanning",
        variant: "destructive",
      });
      return;
    }

    if ('NDEFReader' in window) {
      try {
        const ndef = new (window as any).NDEFReader();
        abortControllerRef.current = new AbortController();
        
        setIsScanning(true);
        
        await ndef.scan({ signal: abortControllerRef.current.signal });
        
        toast({
          title: "NFC Scanner Active",
          description: "Continuously scanning for NFC cards. Tap cards to the device.",
        });

        ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
          console.log('NFC card detected:', serialNumber);
          onScan?.(serialNumber);
          
          toast({
            title: "Card Scanned",
            description: `NFC ID: ${serialNumber}`,
          });
        });

        ndef.addEventListener("readingerror", () => {
          toast({
            title: "Scan Error",
            description: "Failed to read NFC card. Please try again.",
            variant: "destructive",
          });
        });

      } catch (error: any) {
        console.error('NFC Error:', error);
        setIsScanning(false);
        
        if (error.name === 'NotAllowedError') {
          toast({
            title: "Permission Denied",
            description: "NFC access was denied. Please enable NFC permissions.",
            variant: "destructive",
          });
        } else {
          simulateContinuousScanning();
        }
      }
    } else {
      simulateContinuousScanning();
    }
  };

  const simulateContinuousScanning = () => {
    setIsScanning(true);
    toast({
      title: "Demo Mode - NFC Scanner Active",
      description: "Continuously scanning (simulated). Scanner will remain open.",
    });

    const scanInterval = setInterval(() => {
      const mockNfcId = `NFC-${Math.random().toString(36).substr(2, 9)}`;
      console.log('Simulated NFC scan:', mockNfcId);
      onScan?.(mockNfcId);
    }, 3000);

    abortControllerRef.current = {
      abort: () => {
        clearInterval(scanInterval);
        setIsScanning(false);
      },
      signal: null as any,
    };
  };

  const stopScanning = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsScanning(false);
    toast({
      title: "Scanner Stopped",
      description: "NFC scanning has been stopped.",
    });
  };

  const handleClick = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startContinuousScanning();
    }
  };

  return (
    <Button
      size="lg"
      onClick={handleClick}
      className={`${isScanning ? 'animate-pulse bg-primary' : ''} ${className || ''}`}
      data-testid="button-nfc-scan"
    >
      {isScanning ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {isScanning && 'Scanning...'}
        </>
      ) : (
        <>
          <Nfc className="h-5 w-5 mr-2" />
          Scan NFC
        </>
      )}
    </Button>
  );
}

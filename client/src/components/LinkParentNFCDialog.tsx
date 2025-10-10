import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Keyboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LinkParentNFCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (nfcCardId: string) => void;
  currentNFCCard?: string;
}

export default function LinkParentNFCDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  currentNFCCard 
}: LinkParentNFCDialogProps) {
  const [manualCardId, setManualCardId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const ndefReaderRef = useRef<any>(null);
  const scanControllerRef = useRef<any>(null);
  const readingHandlerRef = useRef<any>(null);
  const errorHandlerRef = useRef<any>(null);
  const simulatedTimeoutRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setIsScanning(false);
      setManualCardId("");
      
      // Clean up Web NFC reader
      if (ndefReaderRef.current) {
        try {
          if (readingHandlerRef.current) {
            ndefReaderRef.current.removeEventListener("reading", readingHandlerRef.current);
          }
          if (errorHandlerRef.current) {
            ndefReaderRef.current.removeEventListener("readingerror", errorHandlerRef.current);
          }
          if (scanControllerRef.current?.abort) {
            scanControllerRef.current.abort();
          }
        } catch (e) {
          console.error("Error cleaning up NFC reader:", e);
        }
        ndefReaderRef.current = null;
        scanControllerRef.current = null;
        readingHandlerRef.current = null;
        errorHandlerRef.current = null;
      }
      
      // Clear simulated scan timeout
      if (simulatedTimeoutRef.current) {
        clearTimeout(simulatedTimeoutRef.current);
        simulatedTimeoutRef.current = null;
      }
    }
  }, [open]);

  const handleScanNFC = async () => {
    setIsScanning(true);
    
    // Check if Web NFC is available
    if ('NDEFReader' in window) {
      try {
        const ndef = new (window as any).NDEFReader();
        const controller = new AbortController();
        ndefReaderRef.current = ndef;
        scanControllerRef.current = controller;
        await ndef.scan({ signal: controller.signal });
        
        toast({
          title: "NFC Scanner Active",
          description: "Please tap your NFC card to the device",
        });

        const readingHandler = ({ serialNumber }: any) => {
          const cardId = serialNumber.replace(/:/g, '').toUpperCase();
          toast({
            title: "Card Detected!",
            description: `Card ID: ${cardId}`,
          });
          onSubmit(cardId);
          setIsScanning(false);
          
          // Clean up immediately on successful scan
          if (readingHandlerRef.current) {
            ndef.removeEventListener("reading", readingHandlerRef.current);
          }
          if (errorHandlerRef.current) {
            ndef.removeEventListener("readingerror", errorHandlerRef.current);
          }
          if (scanControllerRef.current?.abort) {
            scanControllerRef.current.abort();
          }
          
          onOpenChange(false);
        };

        const errorHandler = () => {
          toast({
            title: "Scan Error",
            description: "Failed to read NFC card. Please try again.",
            variant: "destructive",
          });
          setIsScanning(false);
        };

        readingHandlerRef.current = readingHandler;
        errorHandlerRef.current = errorHandler;

        ndef.addEventListener("reading", readingHandler);
        ndef.addEventListener("readingerror", errorHandler);
      } catch (error: any) {
        toast({
          title: "NFC Not Supported",
          description: "Your browser doesn't support NFC scanning. Please use manual entry.",
          variant: "destructive",
        });
        setIsScanning(false);
        ndefReaderRef.current = null;
        scanControllerRef.current = null;
      }
    } else {
      // Simulate NFC scan for browsers without Web NFC support
      const simulatedCardId = `NFC-PARENT-${Date.now().toString().slice(-6)}`;
      
      const timeout = setTimeout(() => {
        toast({
          title: "Card Scanned (Simulated)",
          description: `Card ID: ${simulatedCardId}`,
        });
        onSubmit(simulatedCardId);
        setIsScanning(false);
        onOpenChange(false);
        simulatedTimeoutRef.current = null;
      }, 2000);
      
      simulatedTimeoutRef.current = timeout;
    }
  };

  const handleManualSubmit = () => {
    if (manualCardId.trim()) {
      onSubmit(manualCardId.trim());
      setManualCardId("");
      onOpenChange(false);
      toast({
        title: "NFC Card Linked",
        description: "Your NFC card has been successfully linked to your account.",
      });
    }
  };

  const handleRemoveCard = () => {
    onSubmit("");
    onOpenChange(false);
    toast({
      title: "NFC Card Removed",
      description: "Your NFC card has been unlinked from your account.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-link-nfc">
        <DialogHeader>
          <DialogTitle>
            {currentNFCCard ? "Manage NFC Card" : "Link NFC Card"}
          </DialogTitle>
          <DialogDescription>
            {currentNFCCard 
              ? "Update or remove your linked NFC card" 
              : "Link your NFC card to enable quick student dismissal at school gates"
            }
          </DialogDescription>
        </DialogHeader>

        {currentNFCCard && (
          <div className="mb-4 p-4 rounded-md bg-muted">
            <p className="text-sm text-muted-foreground mb-1">Current NFC Card</p>
            <p className="font-mono font-medium" data-testid="text-current-nfc">{currentNFCCard}</p>
            <Button 
              variant="destructive" 
              size="sm" 
              className="mt-3"
              onClick={handleRemoveCard}
              data-testid="button-remove-nfc"
            >
              Remove Card
            </Button>
          </div>
        )}

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan" data-testid="tab-scan">
              <Scan className="w-4 h-4 mr-2" />
              Scan Card
            </TabsTrigger>
            <TabsTrigger value="manual" data-testid="tab-manual">
              <Keyboard className="w-4 h-4 mr-2" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4 mt-4">
            <div className="text-center space-y-4 py-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Scan className="w-10 h-10 text-primary" />
              </div>
              <div>
                <p className="font-medium mb-2">Tap Your NFC Card</p>
                <p className="text-sm text-muted-foreground">
                  Place your NFC card near your device to scan
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={handleScanNFC}
                disabled={isScanning}
                data-testid="button-scan-nfc"
                className="w-full"
              >
                {isScanning ? "Scanning..." : "Start Scanning"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardId">NFC Card ID</Label>
                <Input
                  id="cardId"
                  placeholder="Enter your NFC card ID (e.g., NFC-123456)"
                  value={manualCardId}
                  onChange={(e) => setManualCardId(e.target.value)}
                  data-testid="input-manual-nfc"
                />
                <p className="text-xs text-muted-foreground">
                  You can find the card ID printed on your NFC card or ask school staff
                </p>
              </div>
              <Button 
                onClick={handleManualSubmit}
                disabled={!manualCardId.trim()}
                data-testid="button-submit-manual-nfc"
                className="w-full"
              >
                Link Card
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

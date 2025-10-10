import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NFCScanButton from "./NFCScanButton";
import DismissalCallCard from "./DismissalCallCard";

// todo: remove mock functionality
const mockDismissals = [
  {
    id: "1",
    studentName: "Emma Johnson",
    grade: "5",
    class: "A",
    parentName: "Sarah Johnson",
    status: "active" as const,
    time: "2:45 PM",
  },
  {
    id: "2",
    studentName: "Liam Smith",
    grade: "3",
    class: "B",
    parentName: "Michael Smith",
    status: "completed" as const,
    time: "2:43 PM",
  },
];

export default function SecurityDashboard() {
  const [dismissals, setDismissals] = useState(mockDismissals);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [selectedGate, setSelectedGate] = useState<string>("");

  const handleNFCScan = (nfcId: string) => {
    if (!selectedGate) {
      console.log('Please select a gate first');
      return;
    }
    setScanResult(nfcId);
    console.log('NFC scanned at gate:', selectedGate, 'NFC ID:', nfcId);
  };

  const handleComplete = (id: string) => {
    setDismissals(dismissals.map(d => 
      d.id === id ? { ...d, status: "completed" as const } : d
    ));
    console.log('Dismissal completed:', id);
  };

  const handleGateChange = (gate: string) => {
    setSelectedGate(gate);
    console.log('Gate selected:', gate);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Gate</h1>
        <p className="text-muted-foreground mt-1">Scan parent NFC cards and manage student pickups</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Your Gate</CardTitle>
          <CardDescription>Choose the gate where you are stationed</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedGate} onValueChange={handleGateChange}>
            <SelectTrigger className="w-full" data-testid="select-gate">
              <SelectValue placeholder="Select a gate">
                {selectedGate && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedGate}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Gate A">Gate A - Main Entrance</SelectItem>
              <SelectItem value="Gate B">Gate B - East Side</SelectItem>
              <SelectItem value="Gate C">Gate C - West Side</SelectItem>
              <SelectItem value="Gate D">Gate D - South Parking</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scan Parent NFC Card</CardTitle>
          <CardDescription>
            {selectedGate ? `Tap to scan NFC card at ${selectedGate}` : "Select a gate first to begin scanning"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <NFCScanButton onScan={handleNFCScan} className={!selectedGate ? "opacity-50" : ""} />
          {scanResult && (
            <p className="text-sm text-muted-foreground" data-testid="text-scan-result">
              Last scanned: {scanResult} at {selectedGate}
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Active Dismissals</h2>
        <div className="space-y-4">
          {dismissals.filter(d => d.status !== 'completed').map((dismissal) => (
            <div key={dismissal.id} className="flex gap-4 items-start">
              <div className="flex-1">
                <DismissalCallCard {...dismissal} />
              </div>
              <Button 
                size="lg"
                onClick={() => handleComplete(dismissal.id)}
                className="bg-[#00C851] hover:bg-[#00C851]/90"
                data-testid={`button-complete-${dismissal.id}`}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Completed Today</h2>
        <div className="space-y-4">
          {dismissals.filter(d => d.status === 'completed').map((dismissal) => (
            <DismissalCallCard key={dismissal.id} {...dismissal} />
          ))}
        </div>
      </div>
    </div>
  );
}

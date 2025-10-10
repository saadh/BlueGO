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
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Gate } from "@shared/schema";
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
  const { toast } = useToast();

  // Fetch gates from API
  const { data: gates = [] } = useQuery<Gate[]>({
    queryKey: ['/api/gates'],
  });

  const scanMutation = useMutation({
    mutationFn: async (data: { nfcCardId: string; gateId: string }) => {
      const response = await apiRequest("POST", "/api/security/scan", data);
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Scan Successful",
        description: data.message || `Dismissals created for ${data.parent?.name}`,
      });
      // Invalidate dismissals query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/dismissals'] });
    },
    onError: (error: any) => {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to process NFC scan",
        variant: "destructive",
      });
    },
  });

  const handleNFCScan = (nfcId: string) => {
    if (!selectedGate) {
      toast({
        title: "No Gate Selected",
        description: "Please select a gate before scanning",
        variant: "destructive",
      });
      return;
    }
    setScanResult(nfcId);
    scanMutation.mutate({ nfcCardId: nfcId, gateId: selectedGate });
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

  const selectedGateName = gates.find(g => g.id === selectedGate)?.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Gate</h1>
        <p className="text-muted-foreground mt-1">Scan parent NFC cards and manage student pickups</p>
      </div>

      <div className="flex items-center flex-wrap gap-3 p-4 bg-card rounded-lg border">
        <div className="flex-1 min-w-[200px]">
          <Select value={selectedGate} onValueChange={handleGateChange}>
            <SelectTrigger className="w-full" data-testid="select-gate">
              <SelectValue placeholder="Select a gate">
                {selectedGateName && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedGateName}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {gates.map((gate) => (
                <SelectItem key={gate.id} value={gate.id}>
                  {gate.name} - {gate.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <NFCScanButton onScan={handleNFCScan} gateSelected={!!selectedGate} />
        {scanResult && (
          <p className="text-xs text-muted-foreground" data-testid="text-scan-result">
            Last: {scanResult}
          </p>
        )}
      </div>

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

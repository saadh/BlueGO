import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone, CreditCard, Link as LinkIcon } from "lucide-react";
import StudentCard from "./StudentCard";
import AddStudentDialog from "./AddStudentDialog";
import LinkParentNFCDialog from "./LinkParentNFCDialog";
import { User, Student, InsertStudent, Dismissal } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";

interface ParentDashboardProps {
  user: User;
}

export default function ParentDashboard({ user }: ParentDashboardProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLinkNFCDialogOpen, setIsLinkNFCDialogOpen] = useState(false);
  const ws = useWebSocket();

  // Fetch students from database
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch active dismissals for all students
  const { data: dismissals = [] } = useQuery<Dismissal[]>({
    queryKey: ["/api/parent/dismissals"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const updateNFCMutation = useMutation({
    mutationFn: async (nfcCardId: string) => {
      const res = await apiRequest("POST", "/api/parent/nfc-card", { nfcCardId });
      return await res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "NFC Card Linked",
        description: "Your NFC card has been successfully linked to your account and all your children.",
      });
      setIsLinkNFCDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to link NFC card",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: async (student: Omit<InsertStudent, 'parentId'>) => {
      const res = await apiRequest("POST", "/api/students", student);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Added",
        description: "Your child has been successfully added to your account.",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddStudent = (student: any) => {
    addStudentMutation.mutate(student);
  };

  const handleLinkNFCCard = (nfcCardId: string) => {
    updateNFCMutation.mutate(nfcCardId);
  };

  const requestPickupMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await apiRequest("POST", "/api/parent/request-pickup", { studentId });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Pick-up Requested",
        description: "Your child's teacher has been notified. Please proceed to the school.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRequestPickup = (studentId: string) => {
    requestPickupMutation.mutate(studentId);
  };

  const confirmPickupMutation = useMutation({
    mutationFn: async (dismissalId: string) => {
      const res = await apiRequest("PATCH", `/api/parent/dismissals/${dismissalId}/confirm`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent/dismissals"] });
      toast({
        title: "Pick-up Confirmed",
        description: "Thank you for confirming you received your child!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Confirmation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirmPickup = (dismissalId: string) => {
    confirmPickupMutation.mutate(dismissalId);
  };

  // Listen for real-time dismissal updates via WebSocket
  useEffect(() => {
    if (!ws) return;

    const handleDismissalUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent/dismissals"] });
    };

    ws.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "dismissal-completed" || data.type === "dismissal-created") {
        handleDismissalUpdate();
      }
    });
  }, [ws]);

  // Create a map of studentId -> activeDismissal
  const dismissalMap = new Map<string, Dismissal>();
  dismissals.forEach((dismissal) => {
    // Only show the most recent active dismissal for each student
    if (!dismissalMap.has(dismissal.studentId)) {
      dismissalMap.set(dismissal.studentId, dismissal);
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Parent Information</CardTitle>
              <CardDescription>Your registered contact details and NFC card</CardDescription>
            </div>
            <Button 
              variant={user.nfcCardId ? "outline" : "default"}
              onClick={() => setIsLinkNFCDialogOpen(true)}
              data-testid="button-link-nfc"
            >
              {user.nfcCardId ? (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage NFC Card
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Link NFC Card
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {user.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium" data-testid="text-parent-email">{user.email}</p>
                </div>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium" data-testid="text-parent-phone">{user.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">NFC Card</p>
                {user.nfcCardId ? (
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium" data-testid="text-parent-nfc-card">{user.nfcCardId}</p>
                    <Badge variant="default" className="text-xs">Linked</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-nfc-card">Not linked - Click "Link NFC Card" to get started</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">My Children</h1>
          <p className="text-muted-foreground mt-1">Manage your children's profiles and NFC cards</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-student">
          <Plus className="w-4 h-4 mr-2" />
          Add Child
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      ) : students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {students.map((student) => {
            const activeDismissal = dismissalMap.get(student.id);
            return (
              <StudentCard
                key={student.id}
                id={student.id}
                name={student.name}
                school={student.school}
                grade={student.grade}
                class={student.class}
                gender={student.gender}
                avatarUrl={student.avatarUrl}
                nfcLinked={!!student.nfcCardId}
                activeDismissal={activeDismissal ? {
                  id: activeDismissal.id,
                  status: activeDismissal.status,
                  calledAt: activeDismissal.calledAt ? activeDismissal.calledAt.toString() : null,
                  completedAt: activeDismissal.completedAt ? activeDismissal.completedAt.toString() : null,
                  confirmedByParentAt: activeDismissal.confirmedByParentAt ? activeDismissal.confirmedByParentAt.toString() : null,
                } : undefined}
                onRequestPickup={handleRequestPickup}
                onConfirmPickup={handleConfirmPickup}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Children Added</CardTitle>
            <CardDescription>Get started by adding your first child's profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-child">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Child
            </Button>
          </CardContent>
        </Card>
      )}

      <AddStudentDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddStudent}
      />
      <LinkParentNFCDialog 
        open={isLinkNFCDialogOpen} 
        onOpenChange={setIsLinkNFCDialogOpen}
        onSubmit={handleLinkNFCCard}
        currentNFCCard={user.nfcCardId || ""}
      />
    </div>
  );
}

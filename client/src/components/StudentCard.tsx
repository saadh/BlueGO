import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, PhoneCall, CheckCircle, Clock } from "lucide-react";
import AvatarSelectionDialog from "./AvatarSelectionDialog";
import { getAvatarUrl } from "@/lib/avatars";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ActiveDismissal {
  id: string;
  status: string;
  calledAt: string | null;
  completedAt: string | null;
  confirmedByParentAt: string | null;
}

interface StudentCardProps {
  id: string;
  name: string;
  school?: string;
  grade: string;
  class: string;
  gender: "male" | "female";
  avatarUrl?: string | null;
  nfcLinked?: boolean;
  activeDismissal?: ActiveDismissal | null;
  onRequestPickup?: (studentId: string) => void;
  onConfirmPickup?: (dismissalId: string) => void;
  isRequestingPickup?: boolean;
  isConfirmingPickup?: boolean;
}

export default function StudentCard({
  id,
  name,
  school,
  grade,
  class: className,
  gender,
  avatarUrl,
  nfcLinked,
  activeDismissal,
  onRequestPickup,
  onConfirmPickup,
  isRequestingPickup,
  isConfirmingPickup
}: StudentCardProps) {
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const { toast } = useToast();
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const displayAvatarUrl = getAvatarUrl(avatarUrl);

  const updateAvatarMutation = useMutation({
    mutationFn: async (newAvatarUrl: string) => {
      const res = await apiRequest("PATCH", `/api/students/${id}/avatar`, { avatarUrl: newAvatarUrl });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Avatar Updated",
        description: `${name}'s avatar has been successfully updated!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAvatarSelect = (newAvatarUrl: string) => {
    updateAvatarMutation.mutate(newAvatarUrl);
  };

  return (
    <>
      <Card className="hover-elevate" data-testid={`card-student-${name.replace(/\s+/g, '-').toLowerCase()}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16 ring-2 ring-primary/10 transition-all group-hover:ring-primary/30">
                {displayAvatarUrl && <AvatarImage src={displayAvatarUrl} alt={name} />}
                <AvatarFallback className={gender === 'male' ? 'bg-primary/10 text-primary' : 'bg-[#FF3547]/10 text-[#FF3547]'}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsAvatarDialogOpen(true)}
                title="Edit avatar"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate" data-testid="text-student-name">{name}</h3>
              <div className="flex gap-2 mt-1 flex-wrap">
                {school && <Badge variant="outline" className="text-xs">{school}</Badge>}
                <Badge variant="secondary" className="text-xs">Grade {grade}</Badge>
                <Badge variant="secondary" className="text-xs">Class {className}</Badge>
                {nfcLinked && (
                  <Badge variant="outline" className="text-xs bg-[#00C851]/10 text-[#00C851] border-[#00C851]/20">
                    NFC Linked
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Dismissal Status Display */}
          {activeDismissal && (
            <div className="mt-4 pt-4 border-t">
              {activeDismissal.confirmedByParentAt ? (
                <div className="flex items-center gap-2 text-[#00C851] bg-[#00C851]/10 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Pick-up Confirmed</p>
                    <p className="text-xs opacity-75">Dismissal completed</p>
                  </div>
                </div>
              ) : activeDismissal.completedAt ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#00C851] bg-[#00C851]/10 p-3 rounded-lg">
                    <Clock className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Ready for Pick-up</p>
                      <p className="text-xs opacity-75">Teacher has released your child</p>
                    </div>
                  </div>
                  {onConfirmPickup && (
                    <Button
                      onClick={() => onConfirmPickup(activeDismissal.id)}
                      className="w-full bg-[#00C851] hover:bg-[#00A844]"
                      size="sm"
                      disabled={isConfirmingPickup}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isConfirmingPickup ? "Confirming..." : "Confirm I Received My Child"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#FF3547] bg-[#FF3547]/10 p-3 rounded-lg">
                  <Clock className="w-5 h-5 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Pick-up Requested</p>
                    <p className="text-xs opacity-75">Waiting for teacher...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Request Pickup Button - only show if no active dismissal */}
          {!activeDismissal && onRequestPickup && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => onRequestPickup(id)}
                className="w-full"
                variant="default"
                data-testid={`button-request-pickup-${id}`}
                disabled={isRequestingPickup}
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                {isRequestingPickup ? "Requesting..." : "Request Pick-up"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AvatarSelectionDialog
        open={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        onSelect={handleAvatarSelect}
        currentAvatarUrl={avatarUrl}
        studentName={name}
      />
    </>
  );
}

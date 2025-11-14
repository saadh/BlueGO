import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, PhoneCall } from "lucide-react";
import AvatarSelectionDialog from "./AvatarSelectionDialog";
import { getAvatarUrl } from "@/lib/avatars";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StudentCardProps {
  id: string;
  name: string;
  grade: string;
  class: string;
  gender: "male" | "female";
  avatarUrl?: string | null;
  nfcLinked?: boolean;
  onRequestPickup?: (studentId: string) => void;
}

export default function StudentCard({
  id,
  name,
  grade,
  class: className,
  gender,
  avatarUrl,
  nfcLinked,
  onRequestPickup
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
          {onRequestPickup && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => onRequestPickup(id)}
                className="w-full"
                variant="default"
                data-testid={`button-request-pickup-${id}`}
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                Request Pick-up
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

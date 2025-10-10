import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Class } from "@shared/schema";

interface AssignTeacherClassesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  teacherName: string;
}

export default function AssignTeacherClassesDialog({
  open,
  onOpenChange,
  teacherId,
  teacherName,
}: AssignTeacherClassesDialogProps) {
  const { toast } = useToast();
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Fetch all available classes
  const { data: allClasses = [] } = useQuery<Class[]>({
    queryKey: ["/api/admin/classes"],
    enabled: open,
  });

  // Fetch currently assigned classes for this teacher
  const { data: assignedClasses = [], isLoading } = useQuery<Class[]>({
    queryKey: ["/api/admin/teacher-classes", teacherId],
    enabled: open && !!teacherId,
  });

  // Initialize selected classes when data loads
  useEffect(() => {
    if (assignedClasses.length > 0) {
      setSelectedClasses(assignedClasses.map(c => c.id));
    } else {
      setSelectedClasses([]);
    }
  }, [assignedClasses]);

  const assignMutation = useMutation({
    mutationFn: async (classId: string) => {
      await apiRequest("POST", "/api/admin/teacher-classes", { teacherId, classId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teacher-classes", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign class",
        variant: "destructive",
      });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (classId: string) => {
      await apiRequest("DELETE", `/api/admin/teacher-classes/${teacherId}/${classId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teacher-classes", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove class assignment",
        variant: "destructive",
      });
    },
  });

  const handleToggleClass = (classId: string, checked: boolean) => {
    if (checked) {
      assignMutation.mutate(classId);
      setSelectedClasses([...selectedClasses, classId]);
    } else {
      unassignMutation.mutate(classId);
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Classes to {teacherName}</DialogTitle>
          <DialogDescription>
            Select which classes this teacher should be assigned to
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {allClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No classes available. Create classes first.
                </p>
              ) : (
                allClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center space-x-3 p-3 rounded-md border hover-elevate"
                    data-testid={`checkbox-class-${cls.id}`}
                  >
                    <Checkbox
                      checked={selectedClasses.includes(cls.id)}
                      onCheckedChange={(checked) => handleToggleClass(cls.id, checked as boolean)}
                      disabled={assignMutation.isPending || unassignMutation.isPending}
                    />
                    <label
                      className="flex-1 text-sm cursor-pointer"
                      onClick={() => {
                        const isChecked = selectedClasses.includes(cls.id);
                        handleToggleClass(cls.id, !isChecked);
                      }}
                    >
                      <span className="font-medium">Grade {cls.grade} - Section {cls.section}</span>
                      <span className="text-muted-foreground ml-2">({cls.school})</span>
                    </label>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

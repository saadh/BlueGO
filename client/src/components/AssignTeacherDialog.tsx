import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ClassOption {
  id: string;
  grade: string;
  class: string;
  label: string;
}

interface AssignTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: { id: string; name: string } | null;
  availableClasses: ClassOption[];
  currentAssignments: string[];
  onSubmit: (teacherId: string, assignedClassIds: string[]) => void;
}

export default function AssignTeacherDialog({ 
  open, 
  onOpenChange, 
  teacher,
  availableClasses,
  currentAssignments,
  onSubmit 
}: AssignTeacherDialogProps) {
  const [selectedClasses, setSelectedClasses] = useState<string[]>(currentAssignments);

  useEffect(() => {
    if (open && teacher) {
      setSelectedClasses(currentAssignments);
    }
  }, [open, teacher?.id, currentAssignments]);

  const handleToggleClass = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSubmit = () => {
    if (teacher) {
      onSubmit(teacher.id, selectedClasses);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-assign-teacher">
        <DialogHeader>
          <DialogTitle>Assign Classes to {teacher?.name}</DialogTitle>
          <DialogDescription>
            Select the grades and classes this teacher is responsible for
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {availableClasses.map((classOption) => (
              <div key={classOption.id} className="flex items-center space-x-2">
                <Checkbox
                  id={classOption.id}
                  checked={selectedClasses.includes(classOption.id)}
                  onCheckedChange={() => handleToggleClass(classOption.id)}
                  data-testid={`checkbox-class-${classOption.id}`}
                />
                <Label htmlFor={classOption.id} className="cursor-pointer">
                  {classOption.label}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleSubmit} data-testid="button-submit">Assign Classes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

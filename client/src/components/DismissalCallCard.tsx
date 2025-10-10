import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatusBadge, { type DismissalStatus } from "./StatusBadge";

interface DismissalCallCardProps {
  studentName: string;
  grade: string;
  class: string;
  parentName: string;
  status: DismissalStatus;
  time: string;
  isNew?: boolean;
}

export default function DismissalCallCard({ 
  studentName, 
  grade, 
  class: className, 
  parentName, 
  status, 
  time,
  isNew 
}: DismissalCallCardProps) {
  const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <Card 
      className={`hover-elevate ${isNew ? 'border-[#FF3547] border-2' : ''}`}
      data-testid={`card-dismissal-${studentName.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl truncate" data-testid="text-student-name">{studentName}</h3>
              <p className="text-sm text-muted-foreground">Grade {grade} • Class {className}</p>
              <p className="text-sm text-muted-foreground mt-1">Parent: {parentName}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={status} />
            <span className="text-xs text-muted-foreground" data-testid="text-time">{time}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

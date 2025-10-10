import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, CheckCircle } from "lucide-react";

interface CompactDismissalCardProps {
  studentName: string;
  grade: string;
  class: string;
  parentName: string;
  time: string;
  isNew?: boolean;
  isCompleted?: boolean;
}

export default function CompactDismissalCard({ 
  studentName, 
  grade, 
  class: className, 
  parentName, 
  time,
  isNew,
  isCompleted
}: CompactDismissalCardProps) {
  const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <Card 
      className={`hover-elevate ${isNew ? 'border-[#FF3547] border-2' : ''} ${isCompleted ? 'opacity-50' : ''}`}
      data-testid={`card-dismissal-${studentName.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base truncate" data-testid="text-student-name">{studentName}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>G{grade} • C{className}</span>
              <span className="truncate">• {parentName}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-[#00C851]" />
            ) : isNew ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#FF3547] animate-pulse" />
                <span className="text-xs font-semibold text-[#FF3547]">NEW</span>
              </div>
            ) : (
              <Clock className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground" data-testid="text-time">{time}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

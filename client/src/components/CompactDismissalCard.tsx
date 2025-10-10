import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, CheckCircle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompactDismissalCardProps {
  studentName: string;
  grade: string;
  class: string;
  parentName: string;
  time: string;
  gate: string;
  isNew?: boolean;
  isCompleted?: boolean;
}

export default function CompactDismissalCard({ 
  studentName, 
  grade, 
  class: className, 
  parentName, 
  time,
  gate,
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
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-base truncate" data-testid="text-student-name">{studentName}</h3>
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-[#00C851] flex-shrink-0" />
              ) : isNew ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#FF3547] animate-pulse" />
                  <span className="text-xs font-semibold text-[#FF3547]">NEW</span>
                </div>
              ) : (
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>G{grade} • C{className}</span>
              <span className="truncate">• {parentName}</span>
            </div>
            <div className="flex items-center justify-between mt-2 gap-2">
              <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20">
                <MapPin className="w-3 h-3 mr-1" />
                {gate}
              </Badge>
              <span className="text-xs text-muted-foreground" data-testid="text-time">{time}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

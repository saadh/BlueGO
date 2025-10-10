import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface StudentCardProps {
  name: string;
  grade: string;
  class: string;
  gender: "male" | "female";
  nfcLinked?: boolean;
}

export default function StudentCard({ name, grade, class: className, gender, nfcLinked }: StudentCardProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <Card className="hover-elevate" data-testid={`card-student-${name.replace(/\s+/g, '-').toLowerCase()}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="" alt={name} />
            <AvatarFallback className={gender === 'male' ? 'bg-primary/10 text-primary' : 'bg-[#FF3547]/10 text-[#FF3547]'}>
              {initials}
            </AvatarFallback>
          </Avatar>
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
      </CardContent>
    </Card>
  );
}

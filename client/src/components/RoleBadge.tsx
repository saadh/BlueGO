import { Badge } from "@/components/ui/badge";
import { User, Shield, GraduationCap, Users, Eye } from "lucide-react";

export type UserRole = "parent" | "security" | "teacher" | "section_manager" | "floor_supervisor" | "student";

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig = {
  parent: {
    label: "Parent",
    icon: User,
    variant: "default" as const,
  },
  security: {
    label: "Security",
    icon: Shield,
    variant: "destructive" as const,
  },
  teacher: {
    label: "Teacher",
    icon: GraduationCap,
    variant: "secondary" as const,
  },
  section_manager: {
    label: "Section Manager",
    icon: Users,
    variant: "secondary" as const,
  },
  floor_supervisor: {
    label: "Floor Supervisor",
    icon: Eye,
    variant: "secondary" as const,
  },
  student: {
    label: "Student",
    icon: GraduationCap,
    variant: "outline" as const,
  },
};

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className} data-testid={`badge-role-${role}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

import { Badge } from "@/components/ui/badge";
import { User, Shield, GraduationCap } from "lucide-react";
import type { UserRole } from "@shared/schema";

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
  admin: {
    label: "Admin",
    icon: Shield,
    variant: "default" as const,
  },
};

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];
  
  if (!config) {
    console.error(`Unknown role: ${role}`);
    return (
      <Badge variant="outline" className={className} data-testid={`badge-role-${role}`}>
        {role}
      </Badge>
    );
  }
  
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className} data-testid={`badge-role-${role}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

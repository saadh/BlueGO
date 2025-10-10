import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, Radio } from "lucide-react";

export type DismissalStatus = "pending" | "active" | "completed" | "alert";

interface StatusBadgeProps {
  status: DismissalStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-[#FFC107]/10 text-[#FFC107] border-[#FFC107]/20",
  },
  active: {
    label: "Active",
    icon: Radio,
    className: "bg-[#00C851]/10 text-[#00C851] border-[#00C851]/20",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    className: "bg-[#00C851]/10 text-[#00C851] border-[#00C851]/20",
  },
  alert: {
    label: "Alert",
    icon: AlertCircle,
    className: "bg-[#FF3547]/10 text-[#FF3547] border-[#FF3547]/20",
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className || ''}`}
      data-testid={`badge-status-${status}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

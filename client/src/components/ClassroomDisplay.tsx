import { useState, useEffect } from "react";
import DismissalCallCard from "./DismissalCallCard";

// todo: remove mock functionality
const mockCalls = [
  {
    id: "1",
    studentName: "Emma Johnson",
    grade: "5",
    class: "A",
    parentName: "Sarah Johnson",
    status: "alert" as const,
    time: "2:45 PM",
    isNew: true,
  },
  {
    id: "2",
    studentName: "Liam Smith",
    grade: "3",
    class: "B",
    parentName: "Michael Smith",
    status: "active" as const,
    time: "2:43 PM",
    isNew: false,
  },
  {
    id: "3",
    studentName: "Olivia Brown",
    grade: "4",
    class: "C",
    parentName: "Jennifer Brown",
    status: "active" as const,
    time: "2:41 PM",
    isNew: false,
  },
];

export default function ClassroomDisplay() {
  const [calls, setCalls] = useState(mockCalls);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Dismissal Queue</h1>
            <p className="text-muted-foreground mt-1">Grade 5 • Class A</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" data-testid="text-current-time">
              {currentTime.toLocaleTimeString()}
            </div>
            <p className="text-muted-foreground">Live Updates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {calls.map((call) => (
            <DismissalCallCard key={call.id} {...call} />
          ))}
        </div>

        {calls.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-muted-foreground">No Active Dismissals</h2>
            <p className="text-muted-foreground mt-2">Dismissal calls will appear here in real-time</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import CompactDismissalCard from "./CompactDismissalCard";

// todo: remove mock functionality - showing 30 students to demonstrate capacity
const mockCalls = [
  { id: "1", studentName: "Emma Johnson", grade: "5", class: "A", parentName: "Sarah Johnson", time: "2:45 PM", isNew: true },
  { id: "2", studentName: "Liam Smith", grade: "5", class: "A", parentName: "Michael Smith", time: "2:44 PM", isNew: true },
  { id: "3", studentName: "Olivia Brown", grade: "5", class: "A", parentName: "Jennifer Brown", time: "2:43 PM" },
  { id: "4", studentName: "Noah Davis", grade: "5", class: "A", parentName: "David Davis", time: "2:42 PM" },
  { id: "5", studentName: "Ava Wilson", grade: "5", class: "A", parentName: "Emily Wilson", time: "2:41 PM" },
  { id: "6", studentName: "Ethan Martinez", grade: "5", class: "A", parentName: "Carlos Martinez", time: "2:40 PM" },
  { id: "7", studentName: "Sophia Anderson", grade: "5", class: "A", parentName: "Linda Anderson", time: "2:39 PM" },
  { id: "8", studentName: "Mason Taylor", grade: "5", class: "A", parentName: "James Taylor", time: "2:38 PM" },
  { id: "9", studentName: "Isabella Thomas", grade: "5", class: "A", parentName: "Patricia Thomas", time: "2:37 PM" },
  { id: "10", studentName: "Lucas Jackson", grade: "5", class: "A", parentName: "Robert Jackson", time: "2:36 PM" },
  { id: "11", studentName: "Mia White", grade: "5", class: "A", parentName: "Mary White", time: "2:35 PM" },
  { id: "12", studentName: "Henry Harris", grade: "5", class: "A", parentName: "John Harris", time: "2:34 PM" },
  { id: "13", studentName: "Charlotte Martin", grade: "5", class: "A", parentName: "Barbara Martin", time: "2:33 PM" },
  { id: "14", studentName: "Alexander Lee", grade: "5", class: "A", parentName: "Susan Lee", time: "2:32 PM" },
  { id: "15", studentName: "Amelia Walker", grade: "5", class: "A", parentName: "Jessica Walker", time: "2:31 PM" },
  { id: "16", studentName: "Benjamin Hall", grade: "5", class: "A", parentName: "Daniel Hall", time: "2:30 PM", isCompleted: true },
  { id: "17", studentName: "Harper Allen", grade: "5", class: "A", parentName: "Sarah Allen", time: "2:29 PM", isCompleted: true },
  { id: "18", studentName: "Elijah Young", grade: "5", class: "A", parentName: "Nancy Young", time: "2:28 PM", isCompleted: true },
  { id: "19", studentName: "Evelyn King", grade: "5", class: "A", parentName: "Betty King", time: "2:27 PM", isCompleted: true },
  { id: "20", studentName: "James Wright", grade: "5", class: "A", parentName: "Helen Wright", time: "2:26 PM", isCompleted: true },
  { id: "21", studentName: "Abigail Lopez", grade: "5", class: "A", parentName: "Sandra Lopez", time: "2:25 PM", isCompleted: true },
  { id: "22", studentName: "William Hill", grade: "5", class: "A", parentName: "Ashley Hill", time: "2:24 PM", isCompleted: true },
  { id: "23", studentName: "Emily Scott", grade: "5", class: "A", parentName: "Donna Scott", time: "2:23 PM", isCompleted: true },
  { id: "24", studentName: "Michael Green", grade: "5", class: "A", parentName: "Carol Green", time: "2:22 PM", isCompleted: true },
  { id: "25", studentName: "Elizabeth Adams", grade: "5", class: "A", parentName: "Michelle Adams", time: "2:21 PM", isCompleted: true },
  { id: "26", studentName: "Daniel Baker", grade: "5", class: "A", parentName: "Kimberly Baker", time: "2:20 PM", isCompleted: true },
  { id: "27", studentName: "Sofia Nelson", grade: "5", class: "A", parentName: "Lisa Nelson", time: "2:19 PM", isCompleted: true },
  { id: "28", studentName: "Matthew Carter", grade: "5", class: "A", parentName: "Dorothy Carter", time: "2:18 PM", isCompleted: true },
  { id: "29", studentName: "Avery Mitchell", grade: "5", class: "A", parentName: "Karen Mitchell", time: "2:17 PM", isCompleted: true },
  { id: "30", studentName: "Joseph Perez", grade: "5", class: "A", parentName: "George Perez", time: "2:16 PM", isCompleted: true },
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

  const activeCalls = calls.filter(c => !c.isCompleted);
  const completedCalls = calls.filter(c => c.isCompleted);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dismissal Queue - Grade 5A</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Active: {activeCalls.length} • Completed: {completedCalls.length} • Total: {calls.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" data-testid="text-current-time">
              {currentTime.toLocaleTimeString()}
            </div>
            <p className="text-xs text-muted-foreground">Live Updates</p>
          </div>
        </div>

        {activeCalls.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 text-[#FF3547]">Active Dismissals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {activeCalls.map((call) => (
                <CompactDismissalCard key={call.id} {...call} />
              ))}
            </div>
          </div>
        )}

        {completedCalls.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-3 text-[#00C851]">Completed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {completedCalls.map((call) => (
                <CompactDismissalCard key={call.id} {...call} />
              ))}
            </div>
          </div>
        )}

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

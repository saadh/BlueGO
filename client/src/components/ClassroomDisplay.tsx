import { useState, useEffect } from "react";
import CompactDismissalCard from "./CompactDismissalCard";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";

// todo: remove mock functionality - showing diverse students across grades/classes
const mockCalls = [
  { id: "1", studentName: "Emma Johnson", grade: "5", class: "A", parentName: "Sarah Johnson", time: "2:45 PM", isNew: true, gate: "Gate A" },
  { id: "2", studentName: "Liam Smith", grade: "5", class: "B", parentName: "Michael Smith", time: "2:44 PM", isNew: true, gate: "Gate B" },
  { id: "3", studentName: "Olivia Brown", grade: "4", class: "A", parentName: "Jennifer Brown", time: "2:43 PM", isNew: true, gate: "Gate A" },
  { id: "4", studentName: "Noah Davis", grade: "4", class: "B", parentName: "David Davis", time: "2:42 PM", isNew: true, gate: "Gate C" },
  { id: "5", studentName: "Ava Wilson", grade: "3", class: "A", parentName: "Emily Wilson", time: "2:41 PM", isNew: true, gate: "Gate A" },
  { id: "6", studentName: "Ethan Martinez", grade: "3", class: "C", parentName: "Carlos Martinez", time: "2:40 PM", gate: "Gate B" },
  { id: "7", studentName: "Sophia Anderson", grade: "6", class: "A", parentName: "Linda Anderson", time: "2:39 PM", gate: "Gate A" },
  { id: "8", studentName: "Mason Taylor", grade: "6", class: "B", parentName: "James Taylor", time: "2:38 PM", gate: "Gate C" },
  { id: "9", studentName: "Isabella Thomas", grade: "2", class: "A", parentName: "Patricia Thomas", time: "2:37 PM", gate: "Gate A" },
  { id: "10", studentName: "Lucas Jackson", grade: "2", class: "B", parentName: "Robert Jackson", time: "2:36 PM", gate: "Gate B" },
  { id: "11", studentName: "Mia White", grade: "1", class: "A", parentName: "Mary White", time: "2:35 PM", gate: "Gate A" },
  { id: "12", studentName: "Henry Harris", grade: "1", class: "B", parentName: "John Harris", time: "2:34 PM", gate: "Gate C" },
  { id: "13", studentName: "Charlotte Martin", grade: "5", class: "C", parentName: "Barbara Martin", time: "2:33 PM", gate: "Gate B" },
  { id: "14", studentName: "Alexander Lee", grade: "4", class: "C", parentName: "Susan Lee", time: "2:32 PM", gate: "Gate A" },
  { id: "15", studentName: "Amelia Walker", grade: "3", class: "B", parentName: "Jessica Walker", time: "2:31 PM", gate: "Gate A" },
  { id: "16", studentName: "Benjamin Hall", grade: "5", class: "A", parentName: "Daniel Hall", time: "2:30 PM", isCompleted: true, gate: "Gate B" },
  { id: "17", studentName: "Harper Allen", grade: "5", class: "D", parentName: "Sarah Allen", time: "2:29 PM", isCompleted: true, gate: "Gate A" },
  { id: "18", studentName: "Elijah Young", grade: "4", class: "D", parentName: "Nancy Young", time: "2:28 PM", isCompleted: true, gate: "Gate C" },
  { id: "19", studentName: "Evelyn King", grade: "6", class: "C", parentName: "Betty King", time: "2:27 PM", isCompleted: true, gate: "Gate A" },
  { id: "20", studentName: "James Wright", grade: "2", class: "C", parentName: "Helen Wright", time: "2:26 PM", isCompleted: true, gate: "Gate B" },
  { id: "21", studentName: "Abigail Lopez", grade: "1", class: "C", parentName: "Sandra Lopez", time: "2:25 PM", isCompleted: true, gate: "Gate A" },
  { id: "22", studentName: "William Hill", grade: "6", class: "D", parentName: "Ashley Hill", time: "2:24 PM", isCompleted: true, gate: "Gate C" },
  { id: "23", studentName: "Emily Scott", grade: "3", class: "D", parentName: "Donna Scott", time: "2:23 PM", isCompleted: true, gate: "Gate B" },
  { id: "24", studentName: "Michael Green", grade: "4", class: "A", parentName: "Carol Green", time: "2:22 PM", isCompleted: true, gate: "Gate A" },
  { id: "25", studentName: "Elizabeth Adams", grade: "2", class: "D", parentName: "Michelle Adams", time: "2:21 PM", isCompleted: true, gate: "Gate A" },
  { id: "26", studentName: "Daniel Baker", grade: "1", class: "D", parentName: "Kimberly Baker", time: "2:20 PM", isCompleted: true, gate: "Gate B" },
  { id: "27", studentName: "Sofia Nelson", grade: "5", class: "B", parentName: "Lisa Nelson", time: "2:19 PM", isCompleted: true, gate: "Gate C" },
  { id: "28", studentName: "Matthew Carter", grade: "6", class: "A", parentName: "Dorothy Carter", time: "2:18 PM", isCompleted: true, gate: "Gate A" },
  { id: "29", studentName: "Avery Mitchell", grade: "3", class: "A", parentName: "Karen Mitchell", time: "2:17 PM", isCompleted: true, gate: "Gate B" },
  { id: "30", studentName: "Joseph Perez", grade: "2", class: "A", parentName: "George Perez", time: "2:16 PM", isCompleted: true, gate: "Gate A" },
];

const GRADES = ["1", "2", "3", "4", "5", "6"];
const CLASSES = ["A", "B", "C", "D"];

export default function ClassroomDisplay() {
  const [calls, setCalls] = useState(mockCalls);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedGrades, setSelectedGrades] = useState<string[]>(["5"]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(["A"]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filteredCalls = calls.filter(call => 
    selectedGrades.includes(call.grade) && selectedClasses.includes(call.class)
  );

  const activeCalls = filteredCalls.filter(c => !c.isCompleted);
  const completedCalls = filteredCalls.filter(c => c.isCompleted);

  const handleGradeChange = (grade: string, checked: boolean) => {
    if (checked) {
      setSelectedGrades([...selectedGrades, grade]);
    } else {
      if (selectedGrades.length > 1) {
        setSelectedGrades(selectedGrades.filter(g => g !== grade));
      }
    }
  };

  const handleClassChange = (classValue: string, checked: boolean) => {
    if (checked) {
      setSelectedClasses([...selectedClasses, classValue]);
    } else {
      if (selectedClasses.length > 1) {
        setSelectedClasses(selectedClasses.filter(c => c !== classValue));
      }
    }
  };

  const handleSelectAllGrades = (checked: boolean) => {
    if (checked) {
      setSelectedGrades([...GRADES]);
    } else {
      setSelectedGrades([GRADES[0]]);
    }
  };

  const handleSelectAllClasses = (checked: boolean) => {
    if (checked) {
      setSelectedClasses([...CLASSES]);
    } else {
      setSelectedClasses([CLASSES[0]]);
    }
  };

  const getGradeLabel = () => {
    if (selectedGrades.length === GRADES.length) return "All Grades";
    if (selectedGrades.length === 1) return `Grade ${selectedGrades[0]}`;
    return `${selectedGrades.length} Grades`;
  };

  const getClassLabel = () => {
    if (selectedClasses.length === CLASSES.length) return "All Classes";
    if (selectedClasses.length === 1) return `Class ${selectedClasses[0]}`;
    return `${selectedClasses.length} Classes`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">Dismissal Queue</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Active: {activeCalls.length} • Completed: {completedCalls.length} • Total: {filteredCalls.length}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[140px] justify-between" data-testid="button-grade-filter">
                    {getGradeLabel()}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <div className="p-2">
                    <div 
                      className="flex items-center space-x-2 p-2 rounded-md hover-elevate active-elevate-2"
                      data-testid="checkbox-select-all-grades"
                    >
                      <Checkbox 
                        checked={selectedGrades.length === GRADES.length}
                        onCheckedChange={handleSelectAllGrades}
                      />
                      <label 
                        className="text-sm font-medium cursor-pointer flex-1"
                        onClick={() => handleSelectAllGrades(selectedGrades.length !== GRADES.length)}
                      >
                        Select All
                      </label>
                    </div>
                    <div className="h-px bg-border my-1" />
                    {GRADES.map((grade) => (
                      <div
                        key={grade}
                        className="flex items-center space-x-2 p-2 rounded-md hover-elevate active-elevate-2"
                        data-testid={`checkbox-grade-${grade}`}
                      >
                        <Checkbox 
                          checked={selectedGrades.includes(grade)}
                          onCheckedChange={(checked) => handleGradeChange(grade, checked as boolean)}
                        />
                        <label 
                          className="text-sm cursor-pointer flex-1"
                          onClick={() => handleGradeChange(grade, !selectedGrades.includes(grade))}
                        >
                          Grade {grade}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[140px] justify-between" data-testid="button-class-filter">
                    {getClassLabel()}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <div className="p-2">
                    <div 
                      className="flex items-center space-x-2 p-2 rounded-md hover-elevate active-elevate-2"
                      data-testid="checkbox-select-all-classes"
                    >
                      <Checkbox 
                        checked={selectedClasses.length === CLASSES.length}
                        onCheckedChange={handleSelectAllClasses}
                      />
                      <label 
                        className="text-sm font-medium cursor-pointer flex-1"
                        onClick={() => handleSelectAllClasses(selectedClasses.length !== CLASSES.length)}
                      >
                        Select All
                      </label>
                    </div>
                    <div className="h-px bg-border my-1" />
                    {CLASSES.map((classValue) => (
                      <div
                        key={classValue}
                        className="flex items-center space-x-2 p-2 rounded-md hover-elevate active-elevate-2"
                        data-testid={`checkbox-class-${classValue}`}
                      >
                        <Checkbox 
                          checked={selectedClasses.includes(classValue)}
                          onCheckedChange={(checked) => handleClassChange(classValue, checked as boolean)}
                        />
                        <label 
                          className="text-sm cursor-pointer flex-1"
                          onClick={() => handleClassChange(classValue, !selectedClasses.includes(classValue))}
                        >
                          Class {classValue}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
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

        {filteredCalls.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-muted-foreground">No Dismissals for Selected Classes</h2>
            <p className="text-muted-foreground mt-2">Dismissal calls for the selected grade(s) and class(es) will appear here in real-time</p>
          </div>
        )}
      </div>
    </div>
  );
}

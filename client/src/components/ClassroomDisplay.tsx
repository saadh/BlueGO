import { useState, useEffect } from "react";
import CompactDismissalCard from "./CompactDismissalCard";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, LogOut } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DismissalCall {
  id: string;
  studentName: string;
  grade: string;
  class: string;
  parentName: string;
  time: string;
  isNew?: boolean;
  isCompleted?: boolean;
  gate: string;
}

export default function ClassroomDisplay() {
  // Fetch dismissals from API
  const { data: dismissalsData = [], isLoading } = useQuery({
    queryKey: ["/api/teacher/dismissals"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/dismissals", {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to fetch dismissals: ${res.statusText}`);
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds for new dismissals
  });

  // Transform API data to match expected format
  const calls: DismissalCall[] = dismissalsData.map((d: any) => ({
    id: d.id,
    studentName: d.studentName,
    grade: d.studentGrade,
    class: d.studentClass,
    parentName: `${d.parentFirstName} ${d.parentLastName}`,
    time: d.calledAt ? format(new Date(d.calledAt), "h:mm a") : "N/A",
    isNew: d.status === "called",
    isCompleted: d.status === "completed",
    gate: d.gateName || "Unknown",
  }));

  // Dynamically get unique grades and classes from the fetched data
  const uniqueGrades = Array.from(new Set(calls.map(c => c.grade))).sort();
  const uniqueClasses = Array.from(new Set(calls.map(c => c.class))).sort();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const { toast } = useToast();

  // Initialize selected grades and classes when data loads
  useEffect(() => {
    if (uniqueGrades.length > 0 && selectedGrades.length === 0) {
      setSelectedGrades(uniqueGrades);
    }
  }, [uniqueGrades]);

  useEffect(() => {
    if (uniqueClasses.length > 0 && selectedClasses.length === 0) {
      setSelectedClasses(uniqueClasses);
    }
  }, [uniqueClasses]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    },
  });

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
      setSelectedGrades([...uniqueGrades]);
    } else {
      setSelectedGrades(uniqueGrades[0] ? [uniqueGrades[0]] : []);
    }
  };

  const handleSelectAllClasses = (checked: boolean) => {
    if (checked) {
      setSelectedClasses([...uniqueClasses]);
    } else {
      setSelectedClasses(uniqueClasses[0] ? [uniqueClasses[0]] : []);
    }
  };

  const getGradeLabel = () => {
    if (selectedGrades.length === uniqueGrades.length) return "All Grades";
    if (selectedGrades.length === 1) return `Grade ${selectedGrades[0]}`;
    return `${selectedGrades.length} Grades`;
  };

  const getClassLabel = () => {
    if (selectedClasses.length === uniqueClasses.length) return "All Classes";
    if (selectedClasses.length === 1) return `Class ${selectedClasses[0]}`;
    return `${selectedClasses.length} Classes`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-lg text-muted-foreground">Loading dismissals...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                        checked={selectedGrades.length === uniqueGrades.length}
                        onCheckedChange={handleSelectAllGrades}
                      />
                      <label 
                        className="text-sm font-medium cursor-pointer flex-1"
                        onClick={() => handleSelectAllGrades(selectedGrades.length !== uniqueGrades.length)}
                      >
                        Select All
                      </label>
                    </div>
                    <div className="h-px bg-border my-1" />
                    {uniqueGrades.map((grade) => (
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
                        checked={selectedClasses.length === uniqueClasses.length}
                        onCheckedChange={handleSelectAllClasses}
                      />
                      <label 
                        className="text-sm font-medium cursor-pointer flex-1"
                        onClick={() => handleSelectAllClasses(selectedClasses.length !== uniqueClasses.length)}
                      >
                        Select All
                      </label>
                    </div>
                    <div className="h-px bg-border my-1" />
                    {uniqueClasses.map((classValue) => (
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
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold" data-testid="text-current-time">
                {currentTime.toLocaleTimeString()}
              </div>
              <p className="text-xs text-muted-foreground">Live Updates</p>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
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

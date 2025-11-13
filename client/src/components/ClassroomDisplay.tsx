import { useState, useEffect } from "react";
import AnimatedDismissalCard from "./AnimatedDismissalCard";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, LogOut, Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useWebSocket, WSEventType } from "@/hooks/use-websocket";
import { playNotificationSound, isSoundEnabled, toggleSoundNotifications } from "@/lib/sounds";

interface DismissalCall {
  id: string;
  studentName: string;
  studentAvatarUrl?: string | null;
  grade: string;
  class: string;
  parentName: string;
  time: string;
  isNew?: boolean;
  isCompleted?: boolean;
  gate: string;
}

interface TeacherClass {
  id: string;
  school: string;
  grade: string;
  section: string;
  teacherId: string | null;
  roomNumber: string | null;
}

export default function ClassroomDisplay() {
  // Fetch teacher's assigned classes (uses default fetcher)
  const { data: assignedClasses = [] } = useQuery<TeacherClass[]>({
    queryKey: ["/api/teacher/classes"],
  });

  // Fetch dismissals from API (no polling, using WebSocket for real-time updates)
  const { data: dismissalsData = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/teacher/dismissals"],
  });

  // WebSocket connection for real-time updates
  const { isConnected, on } = useWebSocket();

  // Sound toggle state
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled());

  // Transform API data to match expected format
  const calls: DismissalCall[] = dismissalsData.map((d: any) => ({
    id: d.id,
    studentName: d.studentName,
    studentAvatarUrl: d.studentAvatarUrl,
    grade: d.studentGrade,
    class: d.studentClass,
    parentName: `${d.parentFirstName} ${d.parentLastName}`,
    time: d.calledAt ? format(new Date(d.calledAt), "h:mm a") : "N/A",
    isNew: d.status === "called",
    isCompleted: d.status === "completed",
    gate: d.gateName || "Unknown",
  }));

  // Get unique grades and classes from teacher's assigned classes
  const uniqueGrades = Array.from(new Set(assignedClasses.map(c => c.grade))).sort();
  const uniqueClasses = Array.from(new Set(assignedClasses.map(c => c.section))).sort();
  
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

  // Listen for real-time dismissal events via WebSocket
  useEffect(() => {
    const unsubscribeCreated = on(WSEventType.DISMISSAL_CREATED, (data) => {
      console.log("New dismissal received via WebSocket:", data);

      // Play sound notification
      if (soundEnabled) {
        playNotificationSound();
      }

      // Show toast notification
      toast({
        title: "New Dismissal",
        description: `${data.studentName} is ready for pickup at ${data.gateName}`,
      });

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/dismissals"] });
    });

    const unsubscribeUpdated = on(WSEventType.DISMISSAL_UPDATED, () => {
      // Refresh dismissals list when updated
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/dismissals"] });
    });

    const unsubscribeCompleted = on(WSEventType.DISMISSAL_COMPLETED, () => {
      // Refresh dismissals list when completed
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/dismissals"] });
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeCompleted();
    };
  }, [on, soundEnabled, toast]);

  const handleToggleSound = () => {
    const newState = toggleSoundNotifications();
    setSoundEnabled(newState);
    toast({
      title: newState ? "Sound Enabled" : "Sound Muted",
      description: newState ? "You'll hear notifications for new dismissals" : "Sound notifications are muted",
    });
  };

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
              <div className="flex items-center gap-1 justify-end">
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-[#00C851]" />
                    <p className="text-xs text-[#00C851]">Live</p>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-[#FF3547]" />
                    <p className="text-xs text-[#FF3547]">Connecting...</p>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleSound}
              title={soundEnabled ? "Mute notifications" : "Enable sound notifications"}
              data-testid="button-toggle-sound"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
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
              {activeCalls.map((call, index) => (
                <AnimatedDismissalCard
                  key={call.id}
                  studentName={call.studentName}
                  avatarUrl={call.studentAvatarUrl}
                  grade={call.grade}
                  class={call.class}
                  parentName={call.parentName}
                  time={call.time}
                  gate={call.gate}
                  isNew={call.isNew}
                  isCompleted={call.isCompleted}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {completedCalls.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-3 text-[#00C851]">Completed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {completedCalls.map((call, index) => (
                <AnimatedDismissalCard
                  key={call.id}
                  studentName={call.studentName}
                  avatarUrl={call.studentAvatarUrl}
                  grade={call.grade}
                  class={call.class}
                  parentName={call.parentName}
                  time={call.time}
                  gate={call.gate}
                  isNew={call.isNew}
                  isCompleted={call.isCompleted}
                  index={index}
                />
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

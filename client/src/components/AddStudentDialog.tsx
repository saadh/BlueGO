import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Class, Organization } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  studentId: z.string().min(1, "Student ID is required"),
  organizationId: z.string().min(1, "School is required"),
  grade: z.string().min(1, "Grade is required"),
  class: z.string().min(1, "Class is required"),
  gender: z.enum(["male", "female"]),
});

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof studentSchema>) => void;
}

export default function AddStudentDialog({ open, onOpenChange, onSubmit }: AddStudentDialogProps) {
  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      studentId: "",
      organizationId: "",
      grade: "",
      class: "",
      gender: "male",
    },
  });

  // Watch form values for dynamic filtering
  const selectedOrganizationId = form.watch("organizationId");
  const selectedGrade = form.watch("grade");

  // Fetch organizations where parent is registered
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/parent/organizations"],
  });

  // Fetch classes for selected organization
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/parent/classes", selectedOrganizationId],
    queryFn: async () => {
      if (!selectedOrganizationId) return [];
      const response = await fetch(`/api/parent/classes/${selectedOrganizationId}`);
      if (!response.ok) throw new Error("Failed to fetch classes");
      return response.json();
    },
    enabled: !!selectedOrganizationId,
  });

  // Extract unique grades from classes
  const grades = Array.from(new Set(classes.map(c => c.grade))).sort();

  // Get unique classes (sections) for selected grade
  const availableClasses = classes
    .filter(c => !selectedGrade || c.grade === selectedGrade)
    .map(c => c.section)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();

  // Reset grade and class when organization changes
  useEffect(() => {
    if (selectedOrganizationId) {
      form.setValue("grade", "");
      form.setValue("class", "");
    }
  }, [selectedOrganizationId]);

  // Reset class when grade changes
  useEffect(() => {
    if (selectedGrade) {
      form.setValue("class", "");
    }
  }, [selectedGrade]);

  const handleSubmit = (data: z.infer<typeof studentSchema>) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-student">
        <DialogHeader>
          <DialogTitle>Add Child</DialogTitle>
          <DialogDescription>
            Enter your child's information to create their profile
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Emma Johnson" {...field} data-testid="input-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unique Identifier</FormLabel>
                  <FormControl>
                    <Input placeholder="Government ID, Passport, or School ID" {...field} data-testid="input-student-id" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-organization">
                        <SelectValue placeholder="Select school" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizations.length > 0 ? (
                        organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-orgs" disabled>
                          No schools available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-grade">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {grades.length > 0 ? (
                          grades.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              Grade {grade}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-grades" disabled>
                            {selectedOrganizationId ? "No grades available" : "Select school first"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-class">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableClasses.length > 0 ? (
                          availableClasses.map((cls) => (
                            <SelectItem key={cls} value={cls}>
                              Section {cls}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-classes" disabled>
                            {!selectedOrganizationId ? "Select school first" : !selectedGrade ? "Select grade first" : "No classes available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit">Add Child</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

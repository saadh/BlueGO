import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const classSchema = z.object({
  grade: z.string().min(1, "Grade is required"),
  class: z.string().min(1, "Class is required"),
  teacher: z.string().optional(),
});

interface Teacher {
  id: string;
  name: string;
}

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof classSchema>) => void;
  teachers: Teacher[];
}

export default function AddClassDialog({ open, onOpenChange, onSubmit, teachers }: AddClassDialogProps) {
  const form = useForm<z.infer<typeof classSchema>>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      grade: "",
      class: "",
      teacher: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof classSchema>) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-class">
        <DialogHeader>
          <DialogTitle>Add Class</DialogTitle>
          <DialogDescription>
            Create a new grade and class
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <FormControl>
                      <Input placeholder="5" {...field} data-testid="input-class-grade" />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="A" {...field} data-testid="input-class-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="teacher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-class-teacher">
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teachers.length === 0 ? (
                        <SelectItem value="none" disabled>No teachers available</SelectItem>
                      ) : (
                        teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </SelectItem>
                        ))
                      )}
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
              <Button type="submit" data-testid="button-submit">Add Class</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

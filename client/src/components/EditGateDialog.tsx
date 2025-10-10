import { useEffect } from "react";
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

const gateSchema = z.object({
  name: z.string().min(1, "Gate name is required"),
  location: z.string().min(1, "Location is required"),
  status: z.enum(["Active", "Inactive"]),
});

interface EditGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof gateSchema>) => void;
  gate: { id: string; name: string; location: string; status: string } | null;
}

export default function EditGateDialog({ open, onOpenChange, onSubmit, gate }: EditGateDialogProps) {
  const form = useForm<z.infer<typeof gateSchema>>({
    resolver: zodResolver(gateSchema),
    defaultValues: {
      name: "",
      location: "",
      status: "Active",
    },
  });

  useEffect(() => {
    if (gate) {
      form.reset({
        name: gate.name,
        location: gate.location,
        status: gate.status as "Active" | "Inactive",
      });
    }
  }, [gate, form]);

  const handleSubmit = (data: z.infer<typeof gateSchema>) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-edit-gate">
        <DialogHeader>
          <DialogTitle>Edit Gate</DialogTitle>
          <DialogDescription>
            Update gate information
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gate Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Gate A" {...field} data-testid="input-gate-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Entrance" {...field} data-testid="input-gate-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-gate-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
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
              <Button type="submit" data-testid="button-submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

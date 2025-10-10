import { useState } from 'react';
import AddStudentDialog from '../AddStudentDialog';
import { Button } from '@/components/ui/button';

export default function AddStudentDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <AddStudentDialog 
        open={open} 
        onOpenChange={setOpen}
        onSubmit={(data) => console.log('Submitted:', data)}
      />
    </div>
  );
}

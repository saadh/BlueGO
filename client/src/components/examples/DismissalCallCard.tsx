import DismissalCallCard from '../DismissalCallCard';

export default function DismissalCallCardExample() {
  return (
    <div className="space-y-4 p-4 max-w-2xl">
      <DismissalCallCard
        studentName="Emma Johnson"
        grade="5"
        class="A"
        parentName="Sarah Johnson"
        status="alert"
        time="2:45 PM"
        isNew={true}
      />
      <DismissalCallCard
        studentName="Liam Smith"
        grade="3"
        class="B"
        parentName="Michael Smith"
        status="active"
        time="2:43 PM"
      />
      <DismissalCallCard
        studentName="Olivia Brown"
        grade="4"
        class="C"
        parentName="Jennifer Brown"
        status="completed"
        time="2:40 PM"
      />
    </div>
  );
}

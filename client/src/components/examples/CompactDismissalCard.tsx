import CompactDismissalCard from '../CompactDismissalCard';

export default function CompactDismissalCardExample() {
  return (
    <div className="space-y-3 p-4 max-w-md">
      <CompactDismissalCard
        studentName="Emma Johnson"
        grade="5"
        class="A"
        parentName="Sarah Johnson"
        time="2:45 PM"
        isNew={true}
      />
      <CompactDismissalCard
        studentName="Liam Smith"
        grade="3"
        class="B"
        parentName="Michael Smith"
        time="2:43 PM"
      />
      <CompactDismissalCard
        studentName="Olivia Brown"
        grade="4"
        class="C"
        parentName="Jennifer Brown"
        time="2:40 PM"
        isCompleted={true}
      />
    </div>
  );
}

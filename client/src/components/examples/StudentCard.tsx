import StudentCard from '../StudentCard';

export default function StudentCardExample() {
  return (
    <div className="space-y-4 p-4 max-w-md">
      <StudentCard 
        name="Emma Johnson" 
        grade="5" 
        class="A" 
        gender="female" 
        nfcLinked={true}
      />
      <StudentCard 
        name="Liam Smith" 
        grade="3" 
        class="B" 
        gender="male" 
        nfcLinked={false}
      />
    </div>
  );
}

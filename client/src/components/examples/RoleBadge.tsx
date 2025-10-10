import RoleBadge from '../RoleBadge';

export default function RoleBadgeExample() {
  return (
    <div className="flex gap-2 flex-wrap p-4">
      <RoleBadge role="parent" />
      <RoleBadge role="security" />
      <RoleBadge role="teacher" />
      <RoleBadge role="section_manager" />
      <RoleBadge role="floor_supervisor" />
      <RoleBadge role="student" />
    </div>
  );
}

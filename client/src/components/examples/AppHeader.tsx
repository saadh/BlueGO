import AppHeader from '../AppHeader';

export default function AppHeaderExample() {
  return (
    <div>
      <AppHeader userName="Sarah Johnson" userRole="parent" />
      <div className="p-6">
        <p className="text-muted-foreground">Page content goes here...</p>
      </div>
    </div>
  );
}

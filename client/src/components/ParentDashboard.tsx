import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone, CreditCard, Link as LinkIcon } from "lucide-react";
import StudentCard from "./StudentCard";
import AddStudentDialog from "./AddStudentDialog";
import LinkParentNFCDialog from "./LinkParentNFCDialog";

// todo: remove mock functionality
const mockStudents = [
  { id: "1", name: "Emma Johnson", grade: "5", class: "A", gender: "female" as const, nfcLinked: true, school: "Riverside Elementary" },
  { id: "2", name: "Noah Johnson", grade: "2", class: "B", gender: "male" as const, nfcLinked: false, school: "Riverside Elementary" },
];

const mockParentInfo = {
  name: "Sarah Johnson",
  email: "sarah.johnson@email.com",
  phone: "+1 (555) 123-4567",
};

export default function ParentDashboard() {
  const [students, setStudents] = useState(mockStudents);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLinkNFCDialogOpen, setIsLinkNFCDialogOpen] = useState(false);
  const [parentNFCCard, setParentNFCCard] = useState<string>(""); // todo: load from database

  const handleAddStudent = (student: any) => {
    setStudents([...students, { ...student, id: Date.now().toString() }]);
    setIsAddDialogOpen(false);
    console.log('Student added:', student);
  };

  const handleLinkNFCCard = (nfcCardId: string) => {
    setParentNFCCard(nfcCardId);
    console.log('NFC card linked:', nfcCardId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Parent Information</CardTitle>
              <CardDescription>Your registered contact details and NFC card</CardDescription>
            </div>
            <Button 
              variant={parentNFCCard ? "outline" : "default"}
              onClick={() => setIsLinkNFCDialogOpen(true)}
              data-testid="button-link-nfc"
            >
              {parentNFCCard ? (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage NFC Card
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Link NFC Card
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium" data-testid="text-parent-email">{mockParentInfo.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium" data-testid="text-parent-phone">{mockParentInfo.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">NFC Card</p>
                {parentNFCCard ? (
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium" data-testid="text-parent-nfc-card">{parentNFCCard}</p>
                    <Badge variant="default" className="text-xs">Linked</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-nfc-card">Not linked - Click "Link NFC Card" to get started</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">My Children</h1>
          <p className="text-muted-foreground mt-1">Manage your children's profiles and NFC cards</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-student">
          <Plus className="w-4 h-4 mr-2" />
          Add Child
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {students.map((student) => (
          <StudentCard key={student.id} {...student} />
        ))}
      </div>

      {students.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Children Added</CardTitle>
            <CardDescription>Get started by adding your first child's profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Child
            </Button>
          </CardContent>
        </Card>
      )}

      <AddStudentDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddStudent}
      />
      <LinkParentNFCDialog 
        open={isLinkNFCDialogOpen} 
        onOpenChange={setIsLinkNFCDialogOpen}
        onSubmit={handleLinkNFCCard}
        currentNFCCard={parentNFCCard}
      />
    </div>
  );
}

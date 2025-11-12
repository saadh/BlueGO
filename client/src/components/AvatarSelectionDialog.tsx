import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Check } from "lucide-react";
import { PRESET_AVATARS, getAvatarUrl } from "@/lib/avatars";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AvatarSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (avatarUrl: string) => void;
  currentAvatarUrl?: string | null;
  studentName: string;
}

export default function AvatarSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  currentAvatarUrl,
  studentName,
}: AvatarSelectionDialogProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handlePresetSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("avatar", file);

      // TODO: Replace with actual upload endpoint
      // For now, we'll use a placeholder URL
      // In production, this would upload to your server or cloud storage
      const response = await fetch("/api/students/avatar/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setSelectedAvatar(data.url);

      toast({
        title: "Upload Successful",
        description: "Your custom avatar has been uploaded!",
      });
    } catch (error) {
      // Fallback: use data URL for preview (not recommended for production)
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setSelectedAvatar(dataUrl);
        toast({
          title: "Avatar Selected",
          description: "Custom avatar preview loaded (upload endpoint needed for production)",
        });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      onOpenChange(false);
    }
  };

  const currentDisplayUrl = getAvatarUrl(selectedAvatar);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Choose Avatar for {studentName}</DialogTitle>
          <DialogDescription>
            Select a preset avatar or upload a custom image
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Preset Avatars</TabsTrigger>
            <TabsTrigger value="custom">Custom Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="mt-4">
            <div className="grid grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-1">
              {PRESET_AVATARS.map((avatar, index) => (
                <motion.button
                  key={avatar.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handlePresetSelect(avatar.id)}
                  className={`
                    relative p-2 rounded-lg border-2 transition-all
                    hover:scale-110 hover:shadow-lg
                    ${
                      selectedAvatar === avatar.id
                        ? "border-primary shadow-lg ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }
                  `}
                  title={avatar.name}
                >
                  <Avatar className="w-full aspect-square">
                    <AvatarImage src={avatar.url} alt={avatar.name} />
                    <AvatarFallback>{avatar.emoji}</AvatarFallback>
                  </Avatar>
                  {selectedAvatar === avatar.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-primary rounded-full p-1"
                    >
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  )}
                  <p className="text-xs text-center mt-1 truncate">{avatar.name}</p>
                </motion.button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <div className="flex flex-col items-center justify-center space-y-4 p-8 border-2 border-dashed border-border rounded-lg">
              {currentDisplayUrl && selectedAvatar && !PRESET_AVATARS.find(a => a.id === selectedAvatar) ? (
                <div className="text-center">
                  <Avatar className="w-32 h-32 mx-auto mb-4 ring-4 ring-primary/20">
                    <AvatarImage src={currentDisplayUrl} alt="Custom avatar" />
                    <AvatarFallback>
                      {studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground mb-4">Current custom avatar</p>
                </div>
              ) : (
                <div className="text-center mb-4">
                  <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Upload a custom avatar image
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, or GIF (max 5MB)
                  </p>
                </div>
              )}

              <label htmlFor="avatar-upload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  asChild
                >
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? "Uploading..." : "Choose File"}
                  </span>
                </Button>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center gap-3 mt-4">
          {selectedAvatar && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentDisplayUrl || undefined} alt="Selected" />
                <AvatarFallback className="text-xs">
                  {studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>Selected avatar</span>
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!selectedAvatar}>
              Save Avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

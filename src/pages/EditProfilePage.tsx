import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Camera, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import useAuth from "@/hooks/useAuth";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { profile, user, updateProfile, refreshProfile } = useAuth();
  
  const [name, setName] = useState(profile?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${user?.id || Date.now()}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image");
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(urlData.publicUrl);
      toast.success("Avatar uploaded successfully");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsLoading(true);
    
    try {
      const updates: { name?: string; avatar_url?: string } = {};
      
      if (name.trim() !== profile?.name) {
        updates.name = name.trim();
      }
      
      if (avatarUrl && avatarUrl !== profile?.avatar_url) {
        updates.avatar_url = avatarUrl;
      }
      
      if (Object.keys(updates).length > 0) {
        const { error } = await updateProfile(updates);
        if (error) {
          toast.error("Failed to update profile");
          return;
        }
      }
      
      toast.success("Profile updated successfully");
      await refreshProfile();
      navigate(-1);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading if profile not loaded yet
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
      </div>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <button 
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gradient-gold glow-gold"
            >
              {isUploadingAvatar ? (
                <Loader2 size={32} className="text-primary-foreground animate-spin" />
              ) : avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-primary-foreground">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
            <button 
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Camera size={16} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {isUploadingAvatar ? "Uploading..." : "Tap to change avatar"}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <label className="text-sm text-muted-foreground mb-2 block">Full Name</label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your name"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isLoading || isUploadingAvatar}
          className="w-full py-4 bg-gradient-gold rounded-xl font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Save size={20} />
          )}
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </main>
    </div>
  );
};

export default EditProfilePage;
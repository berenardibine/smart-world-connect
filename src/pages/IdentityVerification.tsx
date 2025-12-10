import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supaseClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, Clock } from "lucide-react";

export default function IdentityVerification() {
  const [loading, setLoading] = useState(false);
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [backPhoto, setBackPhoto] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>("");
  const [backPreview, setBackPreview] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("identity_verified, id_front_photo, id_back_photo")
      .eq("id", session.user.id)
      .single();

    if (profile?.identity_verified) {
      setVerificationStatus("verified");
    } else if (profile?.id_front_photo && profile?.id_back_photo) {
      setVerificationStatus("pending");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (side === 'front') {
        setFrontPhoto(file);
        setFrontPreview(URL.createObjectURL(file));
      } else {
        setBackPhoto(file);
        setBackPreview(URL.createObjectURL(file));
      }
    }
  };

  const uploadPhoto = async (file: File, side: 'front' | 'back') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${side}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!frontPhoto || !backPhoto) {
      toast({
        title: "Error",
        description: "Please upload both front and back photos of your ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const frontUrl = await uploadPhoto(frontPhoto, 'front');
      const backUrl = await uploadPhoto(backPhoto, 'back');

      const { error } = await supabase
        .from("profiles")
        .update({
          id_front_photo: frontUrl,
          id_back_photo: backUrl,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Identity documents submitted. Please wait for admin verification.",
      });
      
      setVerificationStatus("pending");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verificationStatus === "verified") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center">Identity Verified</CardTitle>
            <CardDescription className="text-center">
              Your identity has been verified. You can now use all seller features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/seller/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === "pending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Clock className="h-16 w-16 text-yellow-500" />
            </div>
            <CardTitle className="text-center">Verification Pending</CardTitle>
            <CardDescription className="text-center">
              Your identity documents are under review. You will be notified once verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Identity Verification</CardTitle>
          <CardDescription>
            Please upload clear photos of both sides of your government-issued ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>ID Front Photo</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {frontPreview ? (
                  <img src={frontPreview} alt="ID Front" className="max-h-48 mx-auto" />
                ) : (
                  <div className="py-8">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload front of ID</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'front')}
                  className="hidden"
                  id="front-upload"
                />
                <Label htmlFor="front-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" className="mt-2" onClick={() => document.getElementById('front-upload')?.click()}>
                    {frontPreview ? 'Change Photo' : 'Upload Front'}
                  </Button>
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ID Back Photo</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {backPreview ? (
                  <img src={backPreview} alt="ID Back" className="max-h-48 mx-auto" />
                ) : (
                  <div className="py-8">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload back of ID</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'back')}
                  className="hidden"
                  id="back-upload"
                />
                <Label htmlFor="back-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" className="mt-2" onClick={() => document.getElementById('back-upload')?.click()}>
                    {backPreview ? 'Change Photo' : 'Upload Back'}
                  </Button>
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit for Verification"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

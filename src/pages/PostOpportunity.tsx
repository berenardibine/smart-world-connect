import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Upload, X } from "lucide-react";

const PostOpportunity = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    location: "",
    salary: "",
    jobType: "",
    description: "",
    requirements: "",
    contactEmail: "",
    applyLink: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages([...images, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreviews(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to post opportunities");
        navigate("/auth");
        return;
      }

      // Upload images
      const imageUrls: string[] = [];
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        imageUrls.push(publicUrl);
      }

      // Upload video if exists
      let videoUrl = null;
      if (video) {
        const fileExt = video.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('product-videos')
          .upload(fileName, video);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-videos')
          .getPublicUrl(fileName);
        
        videoUrl = publicUrl;
      }

      // Insert opportunity
      const { error: insertError } = await supabase
        .from('opportunities')
        .insert({
          seller_id: user.id,
          title: formData.title,
          company_name: formData.companyName,
          location: formData.location,
          salary: formData.salary || null,
          job_type: formData.jobType,
          description: formData.description,
          requirements: formData.requirements || null,
          contact_email: formData.contactEmail || null,
          apply_link: formData.applyLink || null,
          images: imageUrls,
          video_url: videoUrl,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast.success("Opportunity posted successfully! It will be reviewed by admin.");
      navigate("/seller-dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to post opportunity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Post a Opportunity</CardTitle>
            <CardDescription>
              Fill in the details to post a job opportunity on Rwanda Smart Market
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Opportunity Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Electronics Technician"
                />
              </div>

              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g., Smart Rwanda Ltd"
                />
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Kigali City"
                />
              </div>

              <div>
                <Label htmlFor="salary">Salary (Optional)</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g., 200,000 RWF per month or Negotiable"
                />
              </div>

              <div>
                <Label htmlFor="jobType">Job Type *</Label>
                <Select value={formData.jobType} onValueChange={(value) => setFormData({ ...formData, jobType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the job responsibilities and qualifications..."
                  rows={5}
                />
              </div>

              <div>
                <Label htmlFor="requirements">Requirements (Optional)</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="List the required skills or experience..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="e.g., jobs@rwandasmartmarket.com"
                />
              </div>

              <div>
                <Label htmlFor="applyLink">Apply Link (Optional)</Label>
                <Input
                  id="applyLink"
                  type="url"
                  value={formData.applyLink}
                  onChange={(e) => setFormData({ ...formData, applyLink: e.target.value })}
                  placeholder="e.g., https://example.com/apply"
                />
              </div>

              <div>
                <Label htmlFor="images">Images (Optional)</Label>
                <div className="mt-2">
                  <label htmlFor="images" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="mt-2 text-sm text-muted-foreground">Upload Images</span>
                    </div>
                    <input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="video">Video (Optional)</Label>
                <div className="mt-2">
                  <label htmlFor="video" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="mt-2 text-sm text-muted-foreground">Upload Video</span>
                    </div>
                    <input
                      id="video"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {videoPreviews && (
                  <div className="mt-2">
                    <video src={videoPreviews} controls className="w-full rounded" />
                  </div>
                )}
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Posting..." : "Post Opportunity"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

export default PostOpportunity;
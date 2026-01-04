import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supaseClient";
import { toast } from "sonner";
import { 
  Cog, Plus, Users, Folder, TrendingUp, Clock, 
  CheckCircle2, CircleDot, Beaker, Rocket, Search
} from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  title: string;
  description: string;
  objective: string;
  creator_id: string;
  members: string[];
  status: string;
  progress: number;
  is_featured: boolean;
  created_at: string;
  profile?: {
    full_name: string;
    profile_image: string;
  };
}

const STATUS_OPTIONS = [
  { value: "ideation", label: "Ideation", icon: CircleDot, color: "bg-blue-500" },
  { value: "prototype", label: "Prototype", icon: Beaker, color: "bg-yellow-500" },
  { value: "testing", label: "Testing", icon: Cog, color: "bg-purple-500" },
  { value: "ready", label: "Ready for Investors", icon: Rocket, color: "bg-green-500" }
];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", description: "", objective: "" });
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    checkUser();
    
    const channel = supabase
      .channel('projects-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'innovation_projects' }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
    }
  };

  const fetchProjects = async () => {
    let query = supabase
      .from('innovation_projects')
      .select(`
        *,
        profile:profiles!innovation_projects_creator_id_fkey(full_name, profile_image)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleCreateProject = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to create projects");
      return;
    }

    if (!newProject.title.trim() || !newProject.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('innovation_projects')
      .insert({
        creator_id: currentUserId,
        title: newProject.title,
        description: newProject.description,
        objective: newProject.objective,
        members: [currentUserId]
      });

    if (error) {
      toast.error("Failed to create project");
      console.error(error);
    } else {
      toast.success("Project created successfully! 🚀");
      setNewProject({ title: "", description: "", objective: "" });
      setShowCreateDialog(false);
      fetchProjects();
    }
    setSubmitting(false);
  };

  const handleJoinProject = async (projectId: string, currentMembers: string[]) => {
    if (!currentUserId) {
      toast.error("Please sign in to join projects");
      return;
    }

    if (currentMembers.includes(currentUserId)) {
      toast.info("You're already a member of this project");
      return;
    }

    const { error } = await supabase
      .from('innovation_projects')
      .update({ members: [...currentMembers, currentUserId] })
      .eq('id', projectId);

    if (error) {
      toast.error("Failed to join project");
    } else {
      toast.success("You've joined the project! 🎉");
      fetchProjects();
    }
  };

  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary via-orange-500 to-yellow-500 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Cog className="h-8 w-8 text-white animate-spin-slow" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Projects Hub</h1>
          </div>
          <p className="text-white/90 mb-6">Collaborative research workspaces for innovators</p>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-white text-primary hover:bg-white/90 rounded-full px-6 shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-primary" />
                  Create New Project
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Project Title"
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Project Description"
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
                <Textarea
                  placeholder="Objective (What do you want to achieve?)"
                  value={newProject.objective}
                  onChange={(e) => setNewProject(prev => ({ ...prev, objective: e.target.value }))}
                  rows={3}
                />
                <Button 
                  className="w-full rounded-full" 
                  onClick={handleCreateProject}
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Project 🚀"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Badge 
              variant={statusFilter === "all" ? "default" : "outline"}
              className="cursor-pointer shrink-0"
              onClick={() => setStatusFilter("all")}
            >
              All Projects
            </Badge>
            {STATUS_OPTIONS.map(status => (
              <Badge
                key={status.value}
                variant={statusFilter === status.value ? "default" : "outline"}
                className="cursor-pointer shrink-0 whitespace-nowrap"
                onClick={() => setStatusFilter(status.value)}
              >
                {status.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1,2,3,4].map(i => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <Cog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">Start your first innovation project!</p>
            <Button onClick={() => setShowCreateDialog(true)} className="rounded-full">
              <Plus className="h-4 w-4 mr-2" /> Create Project
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredProjects.map(project => {
              const statusInfo = getStatusInfo(project.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={project.id} className="p-5 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={`${statusInfo.color} text-white`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                    {project.is_featured && (
                      <Badge variant="secondary">⭐ Featured</Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    ⚙️ {project.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                    {project.description}
                  </p>
                  
                  {project.objective && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      🎯 {project.objective}
                    </p>
                  )}
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {project.members?.length || 1} member{(project.members?.length || 1) > 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant={project.members?.includes(currentUserId || '') ? "secondary" : "default"}
                      className="rounded-full"
                      onClick={() => handleJoinProject(project.id, project.members || [])}
                    >
                      {project.members?.includes(currentUserId || '') ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Joined
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3 mr-1" />
                          Join
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

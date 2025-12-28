import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Gift, Plus, Edit, Trash2, Loader2, Target, Calendar, Star,
  Trophy, Flame, Zap, CheckCircle, XCircle, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supaseClient";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

interface RewardTask {
  id: string;
  title: string;
  description: string;
  reward_points: number;
  reward_coins: number;
  task_type: string;
  category: string;
  requirement_count: number;
  icon: string | null;
  color: string | null;
  expires_at: string | null;
  is_active: boolean;
  requires_evidence: boolean;
}

interface TaskSubmission {
  id: string;
  user_id: string;
  task_id: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  status: string;
  evidence_url: string | null;
  evidence_text: string | null;
  created_at: string;
  reward_tasks?: RewardTask;
  profiles?: { full_name: string; email: string };
}

const iconOptions = ["trophy", "target", "flame", "star", "gift", "zap"];
const colorOptions = ["orange", "blue", "green", "purple", "red", "yellow"];
const taskTypes = ["daily", "weekly", "challenge", "achievement"];
const categories = ["Promotion", "Posting", "Sharing", "Engagement", "Referral", "General"];

export default function RewardsManagement() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<RewardTask[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RewardTask | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reward_points: 100,
    reward_coins: 10,
    task_type: "challenge",
    category: "General",
    requirement_count: 1,
    icon: "target",
    color: "orange",
    expires_at: "",
    is_active: true,
    requires_evidence: false,
  });

  useEffect(() => {
    loadTasks();
    loadSubmissions();
  }, []);

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from("reward_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setTasks(data);
    setLoading(false);
  };

  const loadSubmissions = async () => {
    const { data: subsData } = await supabase
      .from("user_task_progress")
      .select(`*, reward_tasks(*)`)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (subsData) {
      // Fetch user profiles separately
      const userIds = [...new Set(subsData.map(s => s.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const enrichedSubs = subsData.map(s => ({
        ...s,
        profiles: profilesMap.get(s.user_id) || { full_name: "Unknown", email: "" }
      }));
      
      setSubmissions(enrichedSubs as TaskSubmission[]);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      reward_points: 100,
      reward_coins: 10,
      task_type: "challenge",
      category: "General",
      requirement_count: 1,
      icon: "target",
      color: "orange",
      expires_at: "",
      is_active: true,
      requires_evidence: false,
    });
    setEditingTask(null);
  };

  const handleEdit = (task: RewardTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      reward_points: task.reward_points,
      reward_coins: task.reward_coins,
      task_type: task.task_type,
      category: task.category || "General",
      requirement_count: task.requirement_count,
      icon: task.icon || "target",
      color: task.color || "orange",
      expires_at: task.expires_at || "",
      is_active: task.is_active,
      requires_evidence: task.requires_evidence || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast({ title: "Error", description: "Title and description are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        expires_at: formData.expires_at || null,
      };

      if (editingTask) {
        const { error } = await supabase
          .from("reward_tasks")
          .update(payload)
          .eq("id", editingTask.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Task updated successfully" });
      } else {
        const { error } = await supabase
          .from("reward_tasks")
          .insert(payload);
        
        if (error) throw error;
        toast({ title: "Success", description: "Task created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      loadTasks();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const { error } = await supabase
      .from("reward_tasks")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Task deleted successfully" });
      loadTasks();
    }
  };

  const handleApproval = async (submission: TaskSubmission, approve: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Update submission status
      await supabase
        .from("user_task_progress")
        .update({
          status: approve ? "approved" : "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: session?.user.id,
          claimed: approve,
          claimed_at: approve ? new Date().toISOString() : null,
        })
        .eq("id", submission.id);

      // If approved, add rewards to user
      if (approve && submission.reward_tasks) {
        const { data: userRewards } = await supabase
          .from("user_rewards")
          .select("*")
          .eq("user_id", submission.user_id)
          .maybeSingle();

        const newPoints = (userRewards?.points || 0) + submission.reward_tasks.reward_points;
        const newCoins = (userRewards?.coins || 0) + submission.reward_tasks.reward_coins;
        const newLevel = Math.floor(newPoints / 500) + 1;
        const badge = newPoints >= 20000 ? "Platinum" : newPoints >= 5000 ? "Gold" : newPoints >= 1000 ? "Silver" : "Bronze";

        await supabase
          .from("user_rewards")
          .upsert({
            user_id: submission.user_id,
            points: newPoints,
            coins: newCoins,
            level: newLevel,
            badge,
          }, { onConflict: "user_id" });
      }

      toast({ 
        title: approve ? "Approved!" : "Rejected", 
        description: `Submission ${approve ? "approved" : "rejected"} successfully` 
      });
      loadSubmissions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Rewards Management - Admin</title>
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              Rewards Management
            </h1>
            <p className="text-muted-foreground">Create and manage reward tasks</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2">
                <Plus className="h-4 w-4" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Complete your profile"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add all your details to complete your profile"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Points Reward</Label>
                    <Input
                      type="number"
                      value={formData.reward_points}
                      onChange={(e) => setFormData({ ...formData, reward_points: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Coins Reward</Label>
                    <Input
                      type="number"
                      value={formData.reward_coins}
                      onChange={(e) => setFormData({ ...formData, reward_coins: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Task Type</Label>
                    <Select value={formData.task_type} onValueChange={(v) => setFormData({ ...formData, task_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {taskTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {iconOptions.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {colorOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Requirement Count</Label>
                  <Input
                    type="number"
                    value={formData.requirement_count}
                    onChange={(e) => setFormData({ ...formData, requirement_count: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expires At (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active</Label>
                    <p className="text-sm text-muted-foreground">Task is visible to users</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Requires Evidence</Label>
                    <p className="text-sm text-muted-foreground">User must submit proof</p>
                  </div>
                  <Switch
                    checked={formData.requires_evidence}
                    onCheckedChange={(c) => setFormData({ ...formData, requires_evidence: c })}
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingTask ? "Update Task" : "Create Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks" className="gap-2">
              <Target className="h-4 w-4" />
              Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Eye className="h-4 w-4" />
              Pending Approvals ({submissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <div className="grid gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="glass-card p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-${task.color || "orange"}-500/10`}>
                      {task.icon === "trophy" ? <Trophy className="h-5 w-5" /> :
                       task.icon === "flame" ? <Flame className="h-5 w-5" /> :
                       task.icon === "star" ? <Star className="h-5 w-5" /> :
                       task.icon === "zap" ? <Zap className="h-5 w-5" /> :
                       <Target className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge variant={task.is_active ? "default" : "secondary"}>
                          {task.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{task.task_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-primary">🪙 {task.reward_coins} coins</span>
                        <span className="text-info">⭐ {task.reward_points} points</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(task)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-12 glass-card">
                  <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No reward tasks created yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <div className="grid gap-4">
              {submissions.map((sub) => (
                <div key={sub.id} className="glass-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{sub.reward_tasks?.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted by: {sub.profiles?.full_name} ({sub.profiles?.email})
                      </p>
                    </div>
                    <Badge variant="outline">Pending Review</Badge>
                  </div>
                  
                  {(sub.evidence_url || sub.evidence_text) && (
                    <div className="bg-muted/50 p-4 rounded-xl">
                      <p className="text-sm font-medium mb-2">Evidence Submitted:</p>
                      {sub.evidence_text && <p className="text-sm">{sub.evidence_text}</p>}
                      {sub.evidence_url && (
                        <a href={sub.evidence_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                          View Evidence
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => handleApproval(sub, true)}
                      className="gap-2 flex-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleApproval(sub, false)}
                      className="gap-2 flex-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <div className="text-center py-12 glass-card">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No pending submissions</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

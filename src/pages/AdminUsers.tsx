import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Ban, Check, Trash2, Mail, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    whatsapp_number: "",
    call_number: "",
    business_name: "",
    location: "",
    bio: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      navigate("/");
      return;
    }

    await fetchUsers();
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
      return;
    }

    setUsers(data || []);
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-user-status', {
        body: { userId, status }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "User status updated successfully",
      });
      
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Call the secure edge function to delete user
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) {
        toast({
          title: "Error",
          description: `Failed to delete user: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (!data?.success) {
        toast({
          title: "Error",
          description: data?.error || "Failed to delete user",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      fetchUsers();
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const sendNotification = async () => {
    if (!selectedUser || !notificationTitle || !notificationMessage) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: selectedUser.id,
        title: notificationTitle,
        message: notificationMessage,
        type: "info",
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Notification sent successfully",
      });
      setNotificationTitle("");
      setNotificationMessage("");
      setSelectedUser(null);
    }
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      whatsapp_number: user.whatsapp_number || "",
      call_number: user.call_number || "",
      business_name: user.business_name || "",
      location: user.location || "",
      bio: user.bio || "",
    });
  };

  const updateUserInfo = async () => {
    if (!editingUser) return;

    const { error } = await supabase
      .from("profiles")
      .update(editFormData)
      .eq("id", editingUser.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user information",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "User information updated successfully",
      });
      setEditingUser(null);
      fetchUsers();
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage all users and their status</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Call Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone_number || "-"}</TableCell>
                    <TableCell>{user.whatsapp_number || "-"}</TableCell>
                    <TableCell>{user.call_number || "-"}</TableCell>
                    <TableCell className="capitalize">{user.user_type}</TableCell>
                    <TableCell>
                      <Select
                        value={user.status || "active"}
                        onValueChange={(value) => updateUserStatus(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="banned">Banned</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{user.business_name || "-"}</TableCell>
                    <TableCell>{user.location || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit User Information</DialogTitle>
                              <DialogDescription>
                                Update information for {user.full_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input
                                  value={editFormData.full_name}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, full_name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                  value={editFormData.email}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, email: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Phone Number</label>
                                <Input
                                  value={editFormData.phone_number}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, phone_number: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">WhatsApp Number</label>
                                <Input
                                  value={editFormData.whatsapp_number}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, whatsapp_number: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Call Number</label>
                                <Input
                                  value={editFormData.call_number}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, call_number: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Business Name</label>
                                <Input
                                  value={editFormData.business_name}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, business_name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Location</label>
                                <Input
                                  value={editFormData.location}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, location: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Bio</label>
                                <Textarea
                                  value={editFormData.bio}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, bio: e.target.value })
                                  }
                                />
                              </div>
                              <Button onClick={updateUserInfo} className="w-full">
                                Update User Information
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send Notification</DialogTitle>
                              <DialogDescription>
                                Send a notification to {user.full_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Input
                                placeholder="Title"
                                value={notificationTitle}
                                onChange={(e) => setNotificationTitle(e.target.value)}
                              />
                              <Textarea
                                placeholder="Message"
                                value={notificationMessage}
                                onChange={(e) => setNotificationMessage(e.target.value)}
                              />
                              <Button onClick={sendNotification} className="w-full">
                                Send Notification
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.full_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUser(user.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

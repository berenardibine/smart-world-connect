import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, MapPin, Building2, Map, Users, Package } from "lucide-react";
import { toast } from "sonner";

interface Province {
  id: string;
  name: string;
  _count?: { districts: number; users: number; products: number };
}

interface District {
  id: string;
  name: string;
  province_id: string;
  province?: { name: string };
  _count?: { sectors: number; users: number };
}

interface Sector {
  id: string;
  name: string;
  district_id: string;
  district?: { name: string; province?: { name: string } };
  _count?: { users: number };
}

export default function LocationManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [stats, setStats] = useState({
    totalProvinces: 0,
    totalDistricts: 0,
    totalSectors: 0,
    usersWithLocation: 0,
  });

  // Filters
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>("");
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>("");

  // New item forms
  const [newProvinceName, setNewProvinceName] = useState("");
  const [newDistrictName, setNewDistrictName] = useState("");
  const [newDistrictProvinceId, setNewDistrictProvinceId] = useState("");
  const [newSectorName, setNewSectorName] = useState("");
  const [newSectorDistrictId, setNewSectorDistrictId] = useState("");

  const [dialogOpen, setDialogOpen] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
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
      .maybeSingle();

    if (!roleData) {
      navigate("/");
      return;
    }

    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch provinces
    const { data: provincesData } = await supabase
      .from("provinces")
      .select("*")
      .order("name");
    
    // Fetch districts
    const { data: districtsData } = await supabase
      .from("districts")
      .select("*, province:provinces(name)")
      .order("name");
    
    // Fetch sectors with filters
    let sectorsQuery = supabase
      .from("sectors")
      .select("*, district:districts(name, province:provinces(name))")
      .order("name");

    if (selectedDistrictFilter) {
      sectorsQuery = sectorsQuery.eq("district_id", selectedDistrictFilter);
    }
    
    const { data: sectorsData } = await sectorsQuery;

    // Fetch stats
    const { count: usersWithLocation } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .not("province_id", "is", null);

    setProvinces(provincesData || []);
    setDistricts(districtsData || []);
    setSectors(sectorsData || []);
    setStats({
      totalProvinces: provincesData?.length || 0,
      totalDistricts: districtsData?.length || 0,
      totalSectors: sectorsData?.length || 0,
      usersWithLocation: usersWithLocation || 0,
    });
    
    setLoading(false);
  };

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [selectedDistrictFilter]);

  const addProvince = async () => {
    if (!newProvinceName.trim()) {
      toast.error("Province name is required");
      return;
    }

    const { error } = await supabase
      .from("provinces")
      .insert({ name: newProvinceName.trim() });

    if (error) {
      toast.error("Failed to add province");
      return;
    }

    toast.success("Province added successfully");
    setNewProvinceName("");
    setDialogOpen(null);
    fetchData();
  };

  const addDistrict = async () => {
    if (!newDistrictName.trim() || !newDistrictProvinceId) {
      toast.error("District name and province are required");
      return;
    }

    const { error } = await supabase
      .from("districts")
      .insert({ 
        name: newDistrictName.trim(),
        province_id: newDistrictProvinceId
      });

    if (error) {
      toast.error("Failed to add district");
      return;
    }

    toast.success("District added successfully");
    setNewDistrictName("");
    setNewDistrictProvinceId("");
    setDialogOpen(null);
    fetchData();
  };

  const addSector = async () => {
    if (!newSectorName.trim() || !newSectorDistrictId) {
      toast.error("Sector name and district are required");
      return;
    }

    const { error } = await supabase
      .from("sectors")
      .insert({ 
        name: newSectorName.trim(),
        district_id: newSectorDistrictId
      });

    if (error) {
      toast.error("Failed to add sector");
      return;
    }

    toast.success("Sector added successfully");
    setNewSectorName("");
    setNewSectorDistrictId("");
    setDialogOpen(null);
    fetchData();
  };

  const filteredDistricts = selectedProvinceFilter
    ? districts.filter(d => d.province_id === selectedProvinceFilter)
    : districts;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Location Management</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Map className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Provinces</p>
                  <p className="text-xl font-bold">{stats.totalProvinces}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Districts</p>
                  <p className="text-xl font-bold">{stats.totalDistricts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sectors</p>
                  <p className="text-xl font-bold">{stats.totalSectors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Users with Location</p>
                  <p className="text-xl font-bold">{stats.usersWithLocation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different location types */}
        <Tabs defaultValue="provinces" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="provinces">Provinces</TabsTrigger>
            <TabsTrigger value="districts">Districts</TabsTrigger>
            <TabsTrigger value="sectors">Sectors</TabsTrigger>
          </TabsList>

          {/* Provinces Tab */}
          <TabsContent value="provinces">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Provinces ({provinces.length})</CardTitle>
                <Dialog open={dialogOpen === "province"} onOpenChange={(open) => setDialogOpen(open ? "province" : null)}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Province
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Province</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="provinceName">Province Name</Label>
                        <Input
                          id="provinceName"
                          value={newProvinceName}
                          onChange={(e) => setNewProvinceName(e.target.value)}
                          placeholder="Enter province name"
                        />
                      </div>
                      <Button onClick={addProvince} className="w-full">
                        Add Province
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Districts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {provinces.map((province) => {
                      const districtCount = districts.filter(d => d.province_id === province.id).length;
                      return (
                        <TableRow key={province.id}>
                          <TableCell className="font-medium">{province.name}</TableCell>
                          <TableCell className="text-right">{districtCount}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Districts Tab */}
          <TabsContent value="districts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                <CardTitle className="text-lg">Districts ({filteredDistricts.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={selectedProvinceFilter} onValueChange={setSelectedProvinceFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Provinces</SelectItem>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={dialogOpen === "district"} onOpenChange={(open) => setDialogOpen(open ? "district" : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add District
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New District</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="districtProvince">Province</Label>
                          <Select value={newDistrictProvinceId} onValueChange={setNewDistrictProvinceId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select province" />
                            </SelectTrigger>
                            <SelectContent>
                              {provinces.map((province) => (
                                <SelectItem key={province.id} value={province.id}>
                                  {province.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="districtName">District Name</Label>
                          <Input
                            id="districtName"
                            value={newDistrictName}
                            onChange={(e) => setNewDistrictName(e.target.value)}
                            placeholder="Enter district name"
                          />
                        </div>
                        <Button onClick={addDistrict} className="w-full">
                          Add District
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Province</TableHead>
                      <TableHead className="text-right">Sectors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDistricts.map((district) => {
                      const sectorCount = sectors.filter(s => s.district_id === district.id).length;
                      return (
                        <TableRow key={district.id}>
                          <TableCell className="font-medium">{district.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {district.province?.name}
                          </TableCell>
                          <TableCell className="text-right">{sectorCount}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sectors Tab */}
          <TabsContent value="sectors">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                <CardTitle className="text-lg">Sectors ({sectors.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={selectedDistrictFilter} onValueChange={setSelectedDistrictFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by district" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Districts</SelectItem>
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={dialogOpen === "sector"} onOpenChange={(open) => setDialogOpen(open ? "sector" : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Sector
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Sector</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="sectorDistrict">District</Label>
                          <Select value={newSectorDistrictId} onValueChange={setNewSectorDistrictId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select district" />
                            </SelectTrigger>
                            <SelectContent>
                              {districts.map((district) => (
                                <SelectItem key={district.id} value={district.id}>
                                  {district.name} ({district.province?.name})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sectorName">Sector Name</Label>
                          <Input
                            id="sectorName"
                            value={newSectorName}
                            onChange={(e) => setNewSectorName(e.target.value)}
                            placeholder="Enter sector name"
                          />
                        </div>
                        <Button onClick={addSector} className="w-full">
                          Add Sector
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>Province</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sectors.map((sector) => (
                        <TableRow key={sector.id}>
                          <TableCell className="font-medium">{sector.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {sector.district?.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {sector.district?.province?.name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

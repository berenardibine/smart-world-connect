import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Brain, AlertTriangle, TrendingUp, Users, 
  Eye, MousePointer, CheckCircle, XCircle,
  BarChart3, FileText, Bell, RefreshCw
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { Skeleton } from "@/components/ui/skeleton";

interface AIReport {
  id: string;
  report_type: string;
  title: string;
  content: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

interface ReferralLog {
  id: string;
  referral_code: string;
  status: string;
  reason: string;
  detected_by: string;
  created_at: string;
}

interface MarketingStats {
  totalPosts: number;
  activePosts: number;
  pendingPosts: number;
  totalImpressions: number;
  totalClicks: number;
  avgEngagement: number;
  topPerformers: any[];
  lowPerformers: any[];
}

interface ReferralStats {
  totalReferrals: number;
  validReferrals: number;
  invalidReferrals: number;
  suspectedReferrals: number;
}

const AIManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [aiReports, setAiReports] = useState<AIReport[]>([]);
  const [referralLogs, setReferralLogs] = useState<ReferralLog[]>([]);
  const [marketingStats, setMarketingStats] = useState<MarketingStats>({
    totalPosts: 0,
    activePosts: 0,
    pendingPosts: 0,
    totalImpressions: 0,
    totalClicks: 0,
    avgEngagement: 0,
    topPerformers: [],
    lowPerformers: []
  });
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    validReferrals: 0,
    invalidReferrals: 0,
    suspectedReferrals: 0
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch AI reports
      const { data: reports } = await supabase
        .from("ai_manager_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (reports) {
        setAiReports(reports);
      }

      // Fetch referral logs
      const { data: logs } = await supabase
        .from("referral_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (logs) {
        setReferralLogs(logs);
        
        // Calculate referral stats from logs
        const validCount = logs.filter(l => l.status === "valid").length;
        const invalidCount = logs.filter(l => l.status === "invalid").length;
        const suspectedCount = logs.filter(l => l.status === "suspected").length;
        
        setReferralStats({
          totalReferrals: logs.length,
          validReferrals: validCount,
          invalidReferrals: invalidCount,
          suspectedReferrals: suspectedCount
        });
      }

      // Fetch marketing posts for stats
      const { data: posts } = await supabase
        .from("marketing_posts")
        .select("*");

      if (posts) {
        const totalImpressions = posts.reduce((sum, p) => sum + (p.impressions || 0), 0);
        const totalClicks = posts.reduce((sum, p) => sum + (p.clicks || 0), 0);
        
        // Calculate engagement for each post
        const postsWithEngagement = posts.map(p => ({
          ...p,
          engagement: p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0
        }));

        // Sort by engagement
        const sorted = [...postsWithEngagement].sort((a, b) => b.engagement - a.engagement);
        
        setMarketingStats({
          totalPosts: posts.length,
          activePosts: posts.filter(p => p.is_active && p.status === "active").length,
          pendingPosts: posts.filter(p => p.status === "pending").length,
          totalImpressions,
          totalClicks,
          avgEngagement: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 100) : 0,
          topPerformers: sorted.slice(0, 5),
          lowPerformers: sorted.filter(p => p.engagement < 2).slice(0, 5)
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load AI Manager data");
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyReport = async () => {
    setIsGenerating(true);
    try {
      // Generate a summary report
      const reportContent = `
**Weekly Performance Summary**

📊 **Marketing Performance:**
- Total Posts: ${marketingStats.totalPosts}
- Active Posts: ${marketingStats.activePosts}
- Total Impressions: ${marketingStats.totalImpressions}
- Total Clicks: ${marketingStats.totalClicks}
- Average Engagement: ${marketingStats.avgEngagement}%

👥 **Referral Analysis:**
- Total Referrals Processed: ${referralStats.totalReferrals}
- Valid Referrals: ${referralStats.validReferrals}
- Invalid/Suspected: ${referralStats.invalidReferrals + referralStats.suspectedReferrals}

⚠️ **Alerts:**
${marketingStats.lowPerformers.length > 0 ? `- ${marketingStats.lowPerformers.length} posts with low engagement (<2%)` : "- No low-performing posts"}
${referralStats.suspectedReferrals > 0 ? `- ${referralStats.suspectedReferrals} suspected fraudulent referrals` : "- No suspected fraud detected"}
      `.trim();

      const { error } = await supabase
        .from("ai_manager_reports")
        .insert([{
          report_type: "weekly_summary",
          title: "Weekly AI Manager Report",
          content: reportContent,
          data: {
            marketing: marketingStats,
            referrals: referralStats
          }
        }]);

      if (error) throw error;

      toast.success("Weekly report generated!");
      fetchData();
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const markReportAsRead = async (reportId: string) => {
    await supabase
      .from("ai_manager_reports")
      .update({ is_read: true })
      .eq("id", reportId);
    
    setAiReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, is_read: true } : r
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "invalid":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "suspected":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-24">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Manager Dashboard</h1>
              <p className="text-sm text-muted-foreground">Intelligent analytics & monitoring</p>
            </div>
          </div>
          <Button onClick={generateWeeklyReport} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
            Generate Report
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{referralStats.validReferrals}</p>
                  <p className="text-xs text-muted-foreground">Valid Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{referralStats.suspectedReferrals}</p>
                  <p className="text-xs text-muted-foreground">Suspected Fraud</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-full">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{marketingStats.totalImpressions}</p>
                  <p className="text-xs text-muted-foreground">Ad Impressions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-full">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{marketingStats.avgEngagement}%</p>
                  <p className="text-xs text-muted-foreground">Avg Engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <Users className="h-4 w-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="marketing">
              <TrendingUp className="h-4 w-4 mr-2" />
              Marketing
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>AI Generated Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {aiReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reports generated yet</p>
                    <p className="text-sm">Click "Generate Report" to create a weekly summary</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiReports.map((report) => (
                      <div
                        key={report.id}
                        className={`p-4 rounded-lg border ${report.is_read ? "bg-muted/30" : "bg-primary/5 border-primary/20"}`}
                        onClick={() => !report.is_read && markReportAsRead(report.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{report.title}</h3>
                          {!report.is_read && (
                            <Badge className="bg-primary">New</Badge>
                          )}
                        </div>
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                          {report.content}
                        </pre>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(report.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>Referral Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {referralLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No referral logs yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {referralLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="font-mono text-sm">{log.referral_code}</p>
                            <p className="text-xs text-muted-foreground">{log.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            log.status === "valid" ? "default" :
                            log.status === "invalid" ? "destructive" :
                            "secondary"
                          }>
                            {log.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketing">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {marketingStats.topPerformers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {marketingStats.topPerformers.map((post, i) => (
                        <div key={post.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">#{i + 1}</span>
                            <span className="text-sm truncate max-w-[150px]">{post.title}</span>
                          </div>
                          <Badge className="bg-green-500">{post.engagement.toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Low Performers (&lt;2%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {marketingStats.lowPerformers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">All posts performing well!</p>
                  ) : (
                    <div className="space-y-3">
                      {marketingStats.lowPerformers.map((post) => (
                        <div key={post.id} className="flex items-center justify-between">
                          <span className="text-sm truncate max-w-[180px]">{post.title}</span>
                          <Badge variant="destructive">{post.engagement.toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Smart Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referralStats.suspectedReferrals > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Fraud Alert</p>
                        <p className="text-sm text-muted-foreground">
                          {referralStats.suspectedReferrals} suspected fraudulent referrals detected. 
                          Please review the referral logs for details.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {marketingStats.lowPerformers.length > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Low Performance Alert</p>
                        <p className="text-sm text-muted-foreground">
                          {marketingStats.lowPerformers.length} marketing posts have engagement below 2%. 
                          Consider optimizing or deactivating these ads.
                        </p>
                      </div>
                    </div>
                  )}

                  {marketingStats.pendingPosts > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Pending Approvals</p>
                        <p className="text-sm text-muted-foreground">
                          {marketingStats.pendingPosts} marketing posts awaiting your approval.
                        </p>
                      </div>
                    </div>
                  )}

                  {referralStats.suspectedReferrals === 0 && 
                   marketingStats.lowPerformers.length === 0 && 
                   marketingStats.pendingPosts === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p className="font-medium">All Clear!</p>
                      <p className="text-sm">No alerts at this time. Everything is running smoothly.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <DashboardFloatingButton />
      <BottomNav />
    </div>
  );
};

export default AIManagerDashboard;

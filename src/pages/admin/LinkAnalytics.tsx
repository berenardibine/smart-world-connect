import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Link2, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Share2,
  BarChart3,
  ExternalLink
} from "lucide-react";
import { Helmet } from "react-helmet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductAnalytics {
  product_id: string;
  product_title: string;
  product_image: string;
  total_views: number;
  total_clicks: number;
  sources: {
    whatsapp: number;
    facebook: number;
    twitter: number;
    telegram: number;
    linkedin: number;
    direct: number;
  };
  ctr: number;
}

export default function LinkAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<ProductAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalViews: 0,
    totalClicks: 0,
    totalProducts: 0,
    avgCtr: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all link analytics
      const { data: rawAnalytics, error: analyticsError } = await supabase
        .from("link_analytics")
        .select("product_id, source, event, created_at");

      if (analyticsError) throw analyticsError;

      // Fetch products
      const productIds = [...new Set(rawAnalytics?.map(a => a.product_id) || [])];
      
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, title, images")
        .in("id", productIds);

      if (productsError) throw productsError;

      // Process analytics by product
      const productMap: Record<string, ProductAnalytics> = {};
      
      rawAnalytics?.forEach(item => {
        if (!productMap[item.product_id]) {
          const product = products?.find(p => p.id === item.product_id);
          productMap[item.product_id] = {
            product_id: item.product_id,
            product_title: product?.title || "Unknown Product",
            product_image: product?.images?.[0] || "/placeholder.svg",
            total_views: 0,
            total_clicks: 0,
            sources: {
              whatsapp: 0,
              facebook: 0,
              twitter: 0,
              telegram: 0,
              linkedin: 0,
              direct: 0
            },
            ctr: 0
          };
        }

        if (item.event === "view") {
          productMap[item.product_id].total_views++;
        } else if (item.event === "click") {
          productMap[item.product_id].total_clicks++;
        }

        // Count by source
        const source = (item.source || "direct").toLowerCase();
        if (source in productMap[item.product_id].sources) {
          productMap[item.product_id].sources[source as keyof typeof productMap[string]["sources"]]++;
        } else {
          productMap[item.product_id].sources.direct++;
        }
      });

      // Calculate CTR for each product
      Object.values(productMap).forEach(p => {
        p.ctr = p.total_views > 0 ? Math.round((p.total_clicks / p.total_views) * 100) : 0;
      });

      // Sort by total views descending
      const sortedAnalytics = Object.values(productMap).sort((a, b) => b.total_views - a.total_views);

      // Calculate totals
      const totalViews = sortedAnalytics.reduce((sum, p) => sum + p.total_views, 0);
      const totalClicks = sortedAnalytics.reduce((sum, p) => sum + p.total_clicks, 0);
      const avgCtr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;

      setAnalytics(sortedAnalytics);
      setTotals({
        totalViews,
        totalClicks,
        totalProducts: sortedAnalytics.length,
        avgCtr
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "whatsapp":
        return "🟢";
      case "facebook":
        return "🔵";
      case "twitter":
        return "⚫";
      case "telegram":
        return "🔵";
      case "linkedin":
        return "🔷";
      default:
        return "🔗";
    }
  };

  return (
    <>
      <Helmet>
        <title>Link Analytics - Admin Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-background pb-8">
        <header className="bg-card border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 h-16 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Link Analytics
              </h1>
              <p className="text-xs text-muted-foreground">Product link performance</p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totals.totalViews.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <MousePointer className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totals.totalClicks.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Clicks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Share2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totals.totalProducts}</p>
                    <p className="text-xs text-muted-foreground">Products Shared</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totals.avgCtr}%</p>
                    <p className="text-xs text-muted-foreground">Avg. CTR</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Product Link Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : analytics.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No link analytics data yet</p>
                  <p className="text-sm">Share product links to start tracking</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Views</TableHead>
                        <TableHead className="text-center">Clicks</TableHead>
                        <TableHead className="text-center">CTR</TableHead>
                        <TableHead className="text-center">Sources</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={item.product_image}
                                alt={item.product_title}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                              <span className="font-medium line-clamp-1 max-w-[200px]">
                                {item.product_title}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {item.total_views.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-green-600">
                            {item.total_clicks.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-semibold ${
                              item.ctr >= 20 ? "text-green-600" : 
                              item.ctr >= 10 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {item.ctr}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1 text-xs">
                              {Object.entries(item.sources)
                                .filter(([_, count]) => count > 0)
                                .map(([source, count]) => (
                                  <span key={source} title={`${source}: ${count}`}>
                                    {getSourceIcon(source)}
                                  </span>
                                ))
                              }
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/product/${item.product_id}`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}

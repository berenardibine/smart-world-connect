import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action } = await req.json();

    console.log("AI Manager action:", action);

    // Fetch all necessary data
    const [referralsResult, marketingResult, referralLogsResult] = await Promise.all([
      supabase.from("referrals").select("*"),
      supabase.from("marketing_posts").select("*"),
      supabase.from("referral_logs").select("*").order("created_at", { ascending: false }).limit(100)
    ]);

    const referrals = referralsResult.data || [];
    const marketingPosts = marketingResult.data || [];
    const referralLogs = referralLogsResult.data || [];

    // Detect fraud in referrals
    const fraudDetection = await detectReferralFraud(supabase, referrals);
    
    // Analyze marketing performance
    const marketingAnalysis = analyzeMarketingPerformance(marketingPosts);
    
    // Generate AI insights using Lovable AI
    let aiInsights = "";
    if (lovableApiKey) {
      aiInsights = await generateAIInsights(marketingAnalysis, fraudDetection, referrals.length);
    }

    // Create weekly report
    const reportContent = generateReportContent(marketingAnalysis, fraudDetection, aiInsights);

    // Save report to database (admin only)
    const { error: reportError } = await supabase
      .from("ai_manager_reports")
      .insert({
        report_type: "weekly_summary",
        title: `AI Weekly Report - ${new Date().toLocaleDateString()}`,
        content: reportContent,
        data: {
          marketing: {
            totalPosts: marketingAnalysis.totalPosts,
            activePosts: marketingAnalysis.activePosts,
            totalImpressions: marketingAnalysis.totalImpressions,
            totalClicks: marketingAnalysis.totalClicks,
            avgEngagement: marketingAnalysis.avgEngagement
          },
          fraud: {
            suspectedCount: fraudDetection.suspectedCount,
            flaggedReferrals: fraudDetection.flaggedCodes
          }
        }
      });

    if (reportError) {
      console.error("Error saving report:", reportError);
    }

    // Log fraud detections
    for (const fraud of fraudDetection.fraudLogs) {
      await supabase.from("referral_logs").insert({
        referral_code: fraud.code,
        status: "suspected",
        reason: fraud.reason,
        detected_by: "AI Manager",
        referral_id: fraud.referralId
      });
    }

    // Create AI suggestions for affected sellers
    if (marketingAnalysis.lowPerformers.length > 0) {
      for (const post of marketingAnalysis.lowPerformers.slice(0, 5)) {
        if (post.seller_id) {
          await supabase.from("ai_suggestions").insert({
            seller_id: post.seller_id,
            suggestion_type: "marketing",
            title: "Low Performing Ad",
            message: `Your ad "${post.title}" has low engagement (${post.engagement.toFixed(1)}%). Consider updating the content or adjusting your target audience.`
          });
        }
      }
    }

    console.log("AI Manager completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        report: reportContent,
        fraudDetected: fraudDetection.suspectedCount,
        lowPerformingAds: marketingAnalysis.lowPerformers.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("AI Manager error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function detectReferralFraud(supabase: any, referrals: any[]) {
  const fraudLogs: { code: string; reason: string; referralId: string }[] = [];
  const flaggedCodes: string[] = [];
  
  // Check for duplicate referrals from same referrer in short time
  const referrerGroups: { [key: string]: any[] } = {};
  referrals.forEach(r => {
    if (!referrerGroups[r.referrer_id]) {
      referrerGroups[r.referrer_id] = [];
    }
    referrerGroups[r.referrer_id].push(r);
  });

  for (const [referrerId, refs] of Object.entries(referrerGroups)) {
    // Check for mass signups (more than 5 referrals in 24 hours)
    const last24h = refs.filter(r => {
      const created = new Date(r.created_at);
      const now = new Date();
      return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
    });

    if (last24h.length > 5) {
      for (const ref of last24h.slice(5)) {
        fraudLogs.push({
          code: ref.referral_code,
          reason: `Mass signup detected: ${last24h.length} referrals in 24 hours`,
          referralId: ref.id
        });
        flaggedCodes.push(ref.referral_code);
        
        // Mark as invalid
        await supabase
          .from("referrals")
          .update({ is_valid: false, status: "suspected" })
          .eq("id", ref.id);
      }
    }
  }

  // Check for self-referrals
  for (const ref of referrals) {
    if (ref.referrer_id === ref.referred_user_id) {
      fraudLogs.push({
        code: ref.referral_code,
        reason: "Self-referral detected",
        referralId: ref.id
      });
      flaggedCodes.push(ref.referral_code);
      
      await supabase
        .from("referrals")
        .update({ is_valid: false, status: "invalid" })
        .eq("id", ref.id);
    }
  }

  return {
    suspectedCount: fraudLogs.length,
    fraudLogs,
    flaggedCodes
  };
}

function analyzeMarketingPerformance(posts: any[]) {
  const totalImpressions = posts.reduce((sum, p) => sum + (p.impressions || 0), 0);
  const totalClicks = posts.reduce((sum, p) => sum + (p.clicks || 0), 0);
  
  const postsWithEngagement = posts.map(p => ({
    ...p,
    engagement: p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0
  }));

  const sorted = [...postsWithEngagement].sort((a, b) => b.engagement - a.engagement);
  
  return {
    totalPosts: posts.length,
    activePosts: posts.filter(p => p.is_active && p.status === "active").length,
    pendingPosts: posts.filter(p => p.status === "pending").length,
    totalImpressions,
    totalClicks,
    avgEngagement: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 100) : 0,
    topPerformers: sorted.slice(0, 5),
    lowPerformers: sorted.filter(p => p.engagement < 2)
  };
}

async function generateAIInsights(marketing: any, fraud: any, totalReferrals: number): Promise<string> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an AI marketing analyst. Provide brief, actionable insights based on the data. Keep response under 200 words."
          },
          {
            role: "user",
            content: `Analyze this data:
- Total marketing posts: ${marketing.totalPosts}
- Active posts: ${marketing.activePosts}
- Total impressions: ${marketing.totalImpressions}
- Total clicks: ${marketing.totalClicks}
- Average engagement: ${marketing.avgEngagement}%
- Low performing ads: ${marketing.lowPerformers.length}
- Suspected fraud cases: ${fraud.suspectedCount}
- Total referrals: ${totalReferrals}

Provide 3-4 key insights and recommendations.`
          }
        ]
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return "";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return "";
  }
}

function generateReportContent(marketing: any, fraud: any, aiInsights: string): string {
  return `
**Weekly AI Manager Report**
Generated: ${new Date().toLocaleString()}

📊 **Marketing Performance:**
- Total Posts: ${marketing.totalPosts}
- Active Posts: ${marketing.activePosts}
- Pending Posts: ${marketing.pendingPosts}
- Total Impressions: ${marketing.totalImpressions}
- Total Clicks: ${marketing.totalClicks}
- Average Engagement: ${marketing.avgEngagement}%

⚠️ **Fraud Detection:**
- Suspected Cases: ${fraud.suspectedCount}
- Flagged Codes: ${fraud.flaggedCodes.join(", ") || "None"}

🔍 **Low Performing Ads:** ${marketing.lowPerformers.length} ads below 2% engagement

${aiInsights ? `\n🤖 **AI Insights:**\n${aiInsights}` : ""}

---
This report is auto-generated by AI Manager for admin review only.
  `.trim();
}

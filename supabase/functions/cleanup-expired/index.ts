import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting cleanup of expired content...');

    // Delete expired opportunities
    const { data: deletedOpportunities, error: oppError } = await supabase
      .from('opportunities')
      .delete()
      .lt('expire_date', new Date().toISOString())
      .select('id');

    if (oppError) {
      console.error('Error deleting expired opportunities:', oppError);
    } else {
      console.log(`Deleted ${deletedOpportunities?.length || 0} expired opportunities`);
    }

    // Reset expired discounts on products
    const { data: resetProducts, error: discountError } = await supabase
      .from('products')
      .update({ discount: 0, discount_expiry: null })
      .lt('discount_expiry', new Date().toISOString())
      .gt('discount', 0)
      .select('id');

    if (discountError) {
      console.error('Error resetting expired discounts:', discountError);
    } else {
      console.log(`Reset discounts on ${resetProducts?.length || 0} products`);
    }

    // Delete expired ads
    const { data: deletedAds, error: adsError } = await supabase
      .from('ads')
      .update({ is_active: false })
      .lt('end_date', new Date().toISOString())
      .eq('is_active', true)
      .select('id');

    if (adsError) {
      console.error('Error deactivating expired ads:', adsError);
    } else {
      console.log(`Deactivated ${deletedAds?.length || 0} expired ads`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedOpportunities: deletedOpportunities?.length || 0,
        resetDiscounts: resetProducts?.length || 0,
        deactivatedAds: deletedAds?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cleanup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

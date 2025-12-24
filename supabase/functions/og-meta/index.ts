import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://rwanda-smart-market.vercel.app';
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;
const SITE_NAME = 'Rwanda Smart Market';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('id');

    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch product data
    const { data: product, error } = await supabase
      .from('products')
      .select('id, title, description, images, price, category')
      .eq('id', productId)
      .eq('status', 'approved')
      .maybeSingle();

    if (error) {
      console.error('Error fetching product:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch product' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this view for analytics
    const source = url.searchParams.get('source') || 'direct';
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';

    await supabase.from('link_analytics').insert({
      product_id: productId,
      source,
      event: 'view',
      user_agent: userAgent,
      referrer
    });

    // If product not found, return default meta
    if (!product) {
      return new Response(
        JSON.stringify({
          title: SITE_NAME,
          description: 'Discover great products and opportunities on Rwanda Smart Market.',
          image: DEFAULT_IMAGE,
          url: SITE_URL
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the main image URL
    const imageUrl = product.images && product.images.length > 0
      ? product.images[0]
      : DEFAULT_IMAGE;

    // Truncate description for meta
    const shortDescription = product.description
      ? product.description.substring(0, 160) + (product.description.length > 160 ? '...' : '')
      : `${product.title} available on Rwanda Smart Market`;

    const productUrl = `${SITE_URL}/product/${product.id}`;

    const metaData = {
      title: `${product.title} | ${SITE_NAME}`,
      description: shortDescription,
      image: imageUrl,
      url: productUrl,
      price: product.price,
      category: product.category,
      siteName: SITE_NAME
    };

    console.log('Returning meta data for product:', product.id);

    return new Response(
      JSON.stringify(metaData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in og-meta function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

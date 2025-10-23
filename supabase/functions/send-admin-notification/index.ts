import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Send admin notification request received');

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Invalid user session:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Verify user has admin role using RPC
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('User is not admin:', roleError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin role verified');

    // Parse request body
    const { title, message, recipient, specificUserId } = await req.json();

    if (!title || !message || !recipient) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, message, and recipient' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending notifications:', { title, recipient });

    // Use service role for inserting notifications
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let targetUserIds: string[] = [];

    // Determine target users based on recipient type
    if (recipient === 'all') {
      const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select('id');
      
      if (error) {
        console.error('Error fetching all users:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch users', details: error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      targetUserIds = users?.map(u => u.id) || [];
    } else if (recipient === 'sellers' || recipient === 'buyers') {
      const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_type', recipient === 'sellers' ? 'seller' : 'buyer');
      
      if (error) {
        console.error(`Error fetching ${recipient}:`, error);
        return new Response(
          JSON.stringify({ error: `Failed to fetch ${recipient}`, details: error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      targetUserIds = users?.map(u => u.id) || [];
    } else if (recipient === 'specific' && specificUserId) {
      targetUserIds = [specificUserId];
    } else {
      console.error('Invalid recipient type');
      return new Response(
        JSON.stringify({ error: 'Invalid recipient type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (targetUserIds.length === 0) {
      console.log('No users to notify');
      return new Response(
        JSON.stringify({ success: true, message: 'No users match the criteria', count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending notifications to ${targetUserIds.length} users`);

    // Create notification records
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type: 'info'
    }));

    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to send notifications', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Notifications sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notifications sent successfully', 
        count: targetUserIds.length 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

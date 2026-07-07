import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase admin keys not set')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the JWT from the Authorization header to verify caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: callerError } = await supabaseAdmin.auth.getUser(token)

    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify caller is super_admin
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('system_role')
      .eq('id', callerUser.id)
      .single()

    if (profileError || callerProfile?.system_role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Only super_admin can create users' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Parse request body
    const { email, password, full_name, system_role, categories, club_id } = await req.json()

    if (!email || !password || !full_name || !system_role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const userId = authData.user.id

    // 2. Update user_profiles table
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        system_role: system_role,
        force_password_change: true,
        default_club_id: club_id || callerUser.user_metadata?.club_id // Optional
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      // Cleanup the user if profile update fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({ error: 'Failed to update user profile' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Assign categories if needed (Coach/Assistant Coach)
    if (categories && categories.length > 0 && club_id) {
      const categoryAssignments = categories.map((cat: string) => ({
        user_id: userId,
        category: cat,
        club_id: club_id
      }))

      const { error: categoryError } = await supabaseAdmin
        .from('user_category_assignments')
        .insert(categoryAssignments)

      if (categoryError) {
         console.error('Error assigning categories:', categoryError)
         // Not a fatal error, user is created but without categories
      }
    }

    return new Response(JSON.stringify({ user: authData.user, message: 'User created successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

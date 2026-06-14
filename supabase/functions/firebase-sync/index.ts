import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIREBASE_AUTH_TOKEN = '1hI1zkAiGvtkQEXwlbV8bm63qgtcIiythBTK5Z3I';
const FIREBASE_LICENSE_URL = 'https://amprousers-default-rtdb.firebaseio.com/license_keys';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, keyData, firebaseId } = await req.json();
    
    console.log('Firebase sync action:', action, 'keyData:', keyData, 'firebaseId:', firebaseId);

    if (action === 'create') {
      // Create (or overwrite) key in Firebase using the license key as the document id.
      // IMPORTANT: Some external tools check keys by hitting:
      //   /license_keys/{licenseKey}.json
      // So we MUST write using PUT to that exact path (not POST which generates a random id).

      const nodeKey = encodeURIComponent(String(keyData?.key_value ?? ''));
      if (!nodeKey) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing key_value' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(
        `${FIREBASE_LICENSE_URL}/${nodeKey}.json?auth=${FIREBASE_AUTH_TOKEN}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: keyData.key_value,
            hwid: keyData.hwid || null,
            expiryDate: keyData.expires_at,
            daysLeft: keyData.duration_days,
            isActive: keyData.is_active,
            createdAt: new Date().toISOString(),
            username: keyData.username || null,
            password: keyData.password || null,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));
      console.log('Firebase create/put result:', result);

      if (!response.ok) {
        return new Response(
          JSON.stringify({ success: false, error: result?.error ?? 'Firebase PUT failed' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          // We return the same id that external tools will use to read the key.
          firebaseId: keyData.key_value,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'update') {
      // Update existing key in Firebase
      const nodeKey = encodeURIComponent(String(firebaseId ?? keyData?.key_value ?? ''));
      if (!nodeKey) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing firebaseId/key_value' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`${FIREBASE_LICENSE_URL}/${nodeKey}.json?auth=${FIREBASE_AUTH_TOKEN}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyData),
      });

      const result = await response.json();
      console.log('Firebase update result:', result);

      return new Response(
        JSON.stringify({
          success: true,
          result,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'delete') {
      // Delete key from Firebase
      const nodeKey = encodeURIComponent(String(firebaseId ?? keyData?.key_value ?? ''));
      if (!nodeKey) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing firebaseId/key_value' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`${FIREBASE_LICENSE_URL}/${nodeKey}.json?auth=${FIREBASE_AUTH_TOKEN}`, {
        method: 'DELETE',
      });

      console.log('Firebase delete response status:', response.status);

      return new Response(
        JSON.stringify({
          success: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'add_password') {
      // Add password to Firebase key (for manager only)
      const response = await fetch(`${FIREBASE_LICENSE_URL}/${firebaseId}.json?auth=${FIREBASE_AUTH_TOKEN}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: keyData.username,
          password: keyData.password,
        }),
      });

      const result = await response.json();
      console.log('Firebase add password result:', result);

      return new Response(
        JSON.stringify({
          success: true,
          result,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unknown action',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error syncing with Firebase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

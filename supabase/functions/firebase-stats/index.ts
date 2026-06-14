import crypto from 'crypto';

const ALLOWED_ORIGIN = 'https://your-site.com';
const API_SECRET = 'SUPER_SECRET_TOKEN';

const FIREBASE_LICENSE_URL = 'https://amprousers-default-rtdb.firebaseio.com';
const FIREBASE_AUTH_TOKEN = '1hI1zkAiGvtkQEXwlbV8bm63qgtcIiythBTK5Z3I';

const SUPABASE_URL = 'https://YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_SERVICE_KEY';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-secret',
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

function hashHWID(hwid: string) {
  return crypto.createHash('sha256').update(hwid).digest('hex');
}

async function getLicense(key: string) {
  const res = await fetch(
    `${FIREBASE_LICENSE_URL}/${encodeURIComponent(key)}.json?auth=${FIREBASE_AUTH_TOKEN}`
  );
  return res.json();
}

async function patchFirebase(key: string, data: any) {
  await fetch(
    `${FIREBASE_LICENSE_URL}/${encodeURIComponent(key)}.json?auth=${FIREBASE_AUTH_TOKEN}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
}

async function patchSupabase(key: string, data: any) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/activation_keys?key=eq.${encodeURIComponent(key)}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data),
    }
  );
}

async function logAction(key: string, action: string, ip: string) {
  await fetch(
    `${FIREBASE_LICENSE_URL}/${encodeURIComponent(key)}/logs.json?auth=${FIREBASE_AUTH_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        ip,
        time: Date.now(),
      }),
    }
  );
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

    if (req.headers.get('x-api-secret') !== API_SECRET) {
      return json({ error: 'UNAUTHORIZED' }, 401);
    }

    try {
      const ip = req.headers.get('cf-connecting-ip') || 'unknown';
      const body = await req.json();
      const { action } = body;

      /* ================= CREATE ================= */
      if (action === 'create') {
        if (body.role !== 'admin') return json({ error: 'FORBIDDEN' }, 403);

        const license = {
          key: body.key,
          username: body.username,
          password: body.password,
          expiresAt: body.expiresAt,
          hwid: null,
          isActive: false,
          resetCount: 0,
          lastReset: 0,
          createdAt: Date.now(),
        };

        // Firebase (المصدر الأساسي)
        await fetch(
          `${FIREBASE_LICENSE_URL}/${encodeURIComponent(body.key)}.json?auth=${FIREBASE_AUTH_TOKEN}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(license),
          }
        );

        // Supabase (نسخة لوحة الموقع)
        await fetch(`${SUPABASE_URL}/rest/v1/activation_keys`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            key: body.key,
            username: body.username,
            password: body.password,
            expires_at: body.expiresAt,
            hwid: null,
            is_active: false
          })
        });

        return json({ success: true });
      }

      /* ================= ACTIVATE ================= */
      if (action === 'activate') {
        const license = await getLicense(body.key);
        if (!license) return json({ error: 'INVALID_KEY' }, 404);
        if (license.expiresAt < Date.now()) return json({ error: 'EXPIRED' }, 403);

        const hwidHash = hashHWID(body.hwid);

        if (!license.hwid) {
          await patchFirebase(body.key, {
            hwid: hwidHash,
            isActive: true,
          });

          await patchSupabase(body.key, {
            hwid: hwidHash,
            is_active: true
          });

          await logAction(body.key, 'FIRST_ACTIVATION', ip);
          return json({ success: true });
        }

        if (license.hwid !== hwidHash) {
          return json({ error: 'HWID_MISMATCH' }, 403);
        }

        return json({ success: true });
      }

      /* ================= RESET HWID ================= */
      if (action === 'reset_hwid') {
        const license = await getLicense(body.key);
        if (!license) return json({ error: 'INVALID_KEY' }, 404);

        const DAY = 86400000;
        let resetCount = license.resetCount || 0;
        let lastReset = license.lastReset || 0;
        let expiresAt = license.expiresAt;

        if (Date.now() - lastReset < DAY) resetCount++;
        else resetCount = 1;

        if (resetCount >= 2) expiresAt -= 10 * DAY;

        await patchFirebase(body.key, {
          hwid: null,
          resetCount,
          lastReset: Date.now(),
          expiresAt,
        });

        await patchSupabase(body.key, {
          hwid: null,
          expires_at: expiresAt
        });

        await logAction(body.key, 'RESET_HWID', ip);

        return json({ success: true, resetCount, expiresAt });
      }

      /* ================= DELETE ================= */
      if (action === 'delete') {
        if (body.role !== 'admin') return json({ error: 'FORBIDDEN' }, 403);

        // Firebase
        await fetch(
          `${FIREBASE_LICENSE_URL}/${encodeURIComponent(body.key)}.json?auth=${FIREBASE_AUTH_TOKEN}`,
          { method: 'DELETE' }
        );

        // Supabase
        await fetch(
          `${SUPABASE_URL}/rest/v1/activation_keys?key=eq.${encodeURIComponent(body.key)}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            }
          }
        );

        return json({ success: true });
      }

      return json({ error: 'UNKNOWN_ACTION' }, 400);

    } catch (err: any) {
      return json({ error: 'SERVER_ERROR', message: err.message }, 500);
    }
  },
};

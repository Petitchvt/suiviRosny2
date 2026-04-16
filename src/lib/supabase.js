const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function ensureSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.",
    );
  }
}

function buildHeaders() {
  ensureSupabaseConfig();

  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function getBaseUrl() {
  ensureSupabaseConfig();
  return `${SUPABASE_URL}/rest/v1`;
}

export async function supabaseGet(table, query = "") {
  const res = await fetch(`${getBaseUrl()}/${table}?${query}`, {
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.statusText}`);
  return res.json();
}

export async function supabasePost(table, data) {
  const res = await fetch(`${getBaseUrl()}/${table}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`POST ${table} failed: ${res.statusText}`);
  return res.json();
}

export async function supabasePatch(table, query, data) {
  const res = await fetch(`${getBaseUrl()}/${table}?${query}`, {
    method: "PATCH",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH ${table} failed: ${res.statusText}`);
  return res.json();
}

export async function supabaseDelete(table, query) {
  const res = await fetch(`${getBaseUrl()}/${table}?${query}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE ${table} failed: ${res.statusText}`);
  return res;
}

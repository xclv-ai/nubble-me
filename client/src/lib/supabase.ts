import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iyyuxilkacylpbweulsa.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eXV4aWxrYWN5bHBid2V1bHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MDk3MjgsImV4cCI6MjA2NzE4NTcyOH0.Bvu4dV15xMJSKPG2uqIj7FEwgBzbbhbnVyyWp0MpGe8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const STORAGE_BUCKET = "nubble-documents";

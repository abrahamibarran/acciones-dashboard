import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nhcbakoxxaajymbkzcvg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oY2Jha294eGFhanltYmt6Y3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MTg2NjcsImV4cCI6MjA4NDE5NDY2N30.lTgsMRX762HSgOyeszTzaLset35-Aml7R_IYOQRuYGE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

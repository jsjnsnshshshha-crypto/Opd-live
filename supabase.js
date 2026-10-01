// OPD LIVE - Supabase Connection

const SUPABASE_URL = "https://azsyfbvjogcwpfcfcgyh.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_p3sA9WEQ2IrzR6no3qws-w_HM0JbKGw";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

console.log("OPD LIVE: Supabase connected");

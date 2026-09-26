import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://iurnqrrpcajohastsrdw.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_Uv5g26tr7GX6M073BU8Enw_dspXoutR";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://pqavqywsgrasdwtxtmff.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qSgq_OmCGxoSV27-a_5SNw_m24UAffO";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  education_level: "high_school" | "university" | null;
  grade_year: string | null;
  school_name: string | null;
  gcal_connected: boolean;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setProfile(null); setLoading(false); return; }
    setEmail(userData.user.email ?? null);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, education_level, grade_year, school_name, gcal_connected")
      .eq("id", userData.user.id)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { profile, email, loading, reload: load, setProfile };
}

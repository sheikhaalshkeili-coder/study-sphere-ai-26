import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type CommunityProfile = {
  id: string;
  full_name: string;
  grade_year: string | null;
  gems_status: "member" | "not_member" | null;
  gems_verified: boolean;
  community_visible: boolean;
  display_name: string | null;
};

export type SharedDeck = {
  id: string;
  owner_id: string;
  course_id: string;
  title: string;
  topic: string | null;
  creator_name: string;
  cards: { question: string; answer: string }[];
  card_count: number;
  created_at: string;
};

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useCommunityProfile() {
  return useQuery({
    queryKey: ["community-profile"],
    queryFn: async (): Promise<CommunityProfile | null> => {
      const id = await uid();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, grade_year, gems_status, gems_verified, community_visible, display_name")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as CommunityProfile | null;
    },
  });
}

export function useUpdateCommunityProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<CommunityProfile, "gems_status" | "community_visible" | "display_name">>) => {
      const id = await uid();
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-profile"] });
      qc.invalidateQueries({ queryKey: ["community-members"] });
    },
    onError: () => toast.error("Couldn't save that change"),
  });
}

export function useEnrollments() {
  return useQuery({
    queryKey: ["gems-enrollments"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from("gems_enrollments").select("course_id").order("created_at");
      if (error) throw error;
      return (data ?? []).map((r) => r.course_id);
    },
  });
}

export function useSetEnrollments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ add, remove }: { add: string[]; remove: string[] }) => {
      const user_id = await uid();
      if (add.length) {
        const { error } = await supabase.from("gems_enrollments").insert(add.map((course_id) => ({ user_id, course_id })));
        if (error) throw error;
      }
      if (remove.length) {
        const { error } = await supabase.from("gems_enrollments").delete().in("course_id", remove).eq("user_id", user_id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gems-enrollments"] });
      toast.success("Your courses are saved");
    },
    onError: () => toast.error("Couldn't save your courses"),
  });
}

export function useCommunityMembers(courseId: string) {
  return useQuery({
    queryKey: ["community-members", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("community_members", { _course: courseId });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSharedDecks(courseId: string) {
  return useQuery({
    queryKey: ["shared-decks", courseId],
    queryFn: async (): Promise<SharedDeck[]> => {
      const { data, error } = await supabase
        .from("shared_decks")
        .select("id, owner_id, course_id, title, topic, creator_name, cards, card_count, created_at")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SharedDeck[];
    },
  });
}

export function useShareDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { course_id: string; title: string; topic: string | null; cards: { question: string; answer: string }[] }) => {
      const owner_id = await uid();
      const { error } = await supabase.from("shared_decks").insert({ ...input, owner_id });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["shared-decks", v.course_id] });
      toast.success("Deck shared with your class");
    },
    onError: () => toast.error("Couldn't share that deck"),
  });
}

export function useDeleteSharedDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deck: SharedDeck) => {
      const { error } = await supabase.from("shared_decks").delete().eq("id", deck.id);
      if (error) throw error;
    },
    onSuccess: (_d, deck) => {
      qc.invalidateQueries({ queryKey: ["shared-decks", deck.course_id] });
      toast.success("Deck removed from the class");
    },
    onError: () => toast.error("Couldn't remove that deck"),
  });
}

export function useReportDeck() {
  return useMutation({
    mutationFn: async ({ deck_id, reason }: { deck_id: string; reason: string }) => {
      const reporter_id = await uid();
      const { error } = await supabase.from("deck_reports").insert({ deck_id, reporter_id, reason });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => toast.success("Thanks — the deck has been reported"),
    onError: () => toast.error("Couldn't send that report"),
  });
}

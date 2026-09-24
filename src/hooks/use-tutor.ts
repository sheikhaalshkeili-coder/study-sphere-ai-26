import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type ConversationRow = {
  id: string;
  title: string;
  class_id: string | null;
  updated_at: string;
};

export type TutorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

async function requireUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

export function useConversations() {
  return useQuery({
    queryKey: ["tutor_conversations"],
    queryFn: async (): Promise<ConversationRow[]> => {
      const { data, error } = await supabase
        .from("tutor_conversations")
        .select("id, title, class_id, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ConversationRow[];
    },
  });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    enabled: !!conversationId,
    queryKey: ["tutor_messages", conversationId],
    queryFn: async (): Promise<TutorMessage[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content")
        .eq("conversation_id", conversationId as string)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TutorMessage[];
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title?: string; class_id?: string | null }) => {
      const user_id = await requireUserId();
      const { data, error } = await supabase
        .from("tutor_conversations")
        .insert({
          user_id,
          title: input.title?.slice(0, 80) || "New conversation",
          class_id: input.class_id || null,
        })
        .select("id, title, class_id, updated_at")
        .single();
      if (error) throw error;
      return data as ConversationRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tutor_conversations"] }),
    onError: (e: Error) => toast.error(e.message || "Couldn't start the conversation"),
  });
}

export function useUpdateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; title?: string; class_id?: string | null }) => {
      const patch: Record<string, unknown> = {};
      if (input.title !== undefined) patch.title = input.title.slice(0, 80);
      if (input.class_id !== undefined) patch.class_id = input.class_id || null;
      const { error } = await supabase.from("tutor_conversations").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tutor_conversations"] }),
    onError: (e: Error) => toast.error(e.message || "Couldn't update the conversation"),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tutor_conversations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor_conversations"] });
      toast.success("Conversation deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't delete the conversation"),
  });
}

export async function saveTutorMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
) {
  const user_id = await requireUserId();
  await supabase.from("chat_messages").insert({ user_id, role, content, conversation_id: conversationId });
  await supabase.from("tutor_conversations").update({ title: undefined }).eq("id", conversationId);
}

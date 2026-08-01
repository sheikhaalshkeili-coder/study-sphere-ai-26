import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type ClassRow = {
  id: string;
  subject: string;
  teacher: string | null;
  room: string | null;
  color: string;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
};

export type AssignmentRow = {
  id: string;
  title: string;
  subject: string | null;
  class_id: string | null;
  type: string;
  priority: string;
  due_at: string | null;
  notes: string | null;
  done: boolean;
};

export type ExamRow = {
  id: string;
  title: string;
  subject: string | null;
  class_id: string | null;
  exam_at: string;
  notes: string | null;
};

async function requireUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async (): Promise<ClassRow[]> => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, subject, teacher, room, color, day_of_week, start_time, end_time")
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ClassRow[];
    },
  });
}

export function useAssignments() {
  return useQuery({
    queryKey: ["assignments"],
    queryFn: async (): Promise<AssignmentRow[]> => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title, subject, class_id, type, priority, due_at, notes, done")
        .order("due_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as AssignmentRow[];
    },
  });
}

export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: async (): Promise<ExamRow[]> => {
      const { data, error } = await supabase
        .from("exams")
        .select("id, title, subject, class_id, exam_at, notes")
        .order("exam_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ExamRow[];
    },
  });
}

function useInvalidate(keys: string[]) {
  const qc = useQueryClient();
  return () => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useSaveClass() {
  const invalidate = useInvalidate(["classes", "assignments", "exams"]);
  return useMutation({
    mutationFn: async (input: Partial<ClassRow> & { subject: string }) => {
      const user_id = await requireUserId();
      const payload = {
        subject: input.subject,
        teacher: input.teacher || null,
        room: input.room || null,
        color: input.color || "blue",
        day_of_week: input.day_of_week ?? null,
        start_time: input.start_time || null,
        end_time: input.end_time || null,
      };
      if (input.id) {
        const { error } = await supabase.from("classes").update(payload).eq("id", input.id);
        if (error) throw error;
        return "updated" as const;
      }
      const { error } = await supabase.from("classes").insert({ ...payload, user_id });
      if (error) throw error;
      return "created" as const;
    },
    onSuccess: (mode) => {
      invalidate();
      toast.success(mode === "updated" ? "Class updated" : "Class added");
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't save the class"),
  });
}

export function useDeleteClass() {
  const invalidate = useInvalidate(["classes", "assignments", "exams"]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: snapshot } = await supabase.from("classes").select("*").eq("id", id).maybeSingle();
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
      return snapshot as Record<string, unknown> | null;
    },
    onSuccess: (snapshot) => {
      invalidate();
      toast.success("Class deleted", {
        action: snapshot
          ? {
              label: "Undo",
              onClick: async () => {
                const { error } = await supabase.from("classes").insert(snapshot as never);
                if (error) toast.error("Couldn't restore the class");
                else {
                  invalidate();
                  toast.success("Class restored");
                }
              },
            }
          : undefined,
      });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't delete the class"),
  });
}


export type TaskInput = {
  id?: string;
  kind: "task" | "exam";
  title: string;
  type: string;
  class_id: string | null;
  subject: string | null;
  due_at: string | null;
  priority: string;
  notes: string | null;
};

export function useSaveTask() {
  const invalidate = useInvalidate(["assignments", "exams"]);
  return useMutation({
    mutationFn: async (input: TaskInput) => {
      const user_id = await requireUserId();
      if (input.kind === "exam") {
        if (!input.due_at) throw new Error("Pick a date for the exam.");
        const payload = {
          title: input.title,
          subject: input.subject,
          class_id: input.class_id,
          exam_at: input.due_at,
          notes: input.notes,
        };
        if (input.id) {
          const { error } = await supabase.from("exams").update(payload).eq("id", input.id);
          if (error) throw error;
          return "updated" as const;
        }
        const { error } = await supabase.from("exams").insert({ ...payload, user_id });
        if (error) throw error;
        return "created" as const;
      }
      const payload = {
        title: input.title,
        subject: input.subject,
        class_id: input.class_id,
        type: input.type,
        priority: input.priority,
        due_at: input.due_at,
        notes: input.notes,
      };
      if (input.id) {
        const { error } = await supabase.from("assignments").update(payload).eq("id", input.id);
        if (error) throw error;
        return "updated" as const;
      }
      const { error } = await supabase.from("assignments").insert({ ...payload, user_id });
      if (error) throw error;
      return "created" as const;
    },
    onSuccess: (mode) => {
      invalidate();
      toast.success(mode === "updated" ? "Saved changes" : "Added to your planner");
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't save that"),
  });
}

export function useToggleDone() {
  const invalidate = useInvalidate(["assignments"]);
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("assignments").update({ done }).eq("id", id);
      if (error) throw error;
      return done;
    },
    onSuccess: (done) => {
      invalidate();
      toast.success(done ? "Nice work — marked done" : "Marked as not done");
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't update that task"),
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidate(["assignments", "exams"]);
  return useMutation({
    mutationFn: async ({ id, kind }: { id: string; kind: "task" | "exam" }) => {
      const table: "exams" | "assignments" = kind === "exam" ? "exams" : "assignments";
      const { data: snapshot } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return { table, snapshot: snapshot as Record<string, unknown> | null };
    },
    onSuccess: ({ table, snapshot }) => {
      invalidate();
      toast.success("Deleted", {
        action: snapshot
          ? {
              label: "Undo",
              onClick: async () => {
                const { error } = await supabase.from(table).insert(snapshot as never);
                if (error) toast.error("Couldn't restore that");
                else {
                  invalidate();
                  toast.success("Restored");
                }
              },
            }
          : undefined,
      });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't delete that"),
  });
}


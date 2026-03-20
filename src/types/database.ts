export interface RecruitmentStatusRow {
  role: string;
  roleKey?: string;
  count?: number; // total (deprecated - use total)
  total?: number;
  filled?: number;
  status?: "recruiting" | "urgent";
}

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    Tables: {
      projects: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          summary: string | null;
          content: string | null;
          goal: string | null;
          tech_stack: string[];
          manner_temp_target: string;
          gradient: string | null;
          team_leader_id: string | null;
          category: string | null;
          recruitment_status: RecruitmentStatusRow[] | null;
          visibility: string | null;
          duration_months: number | null;
          est_launch: string | null;
          status: "active" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          summary?: string | null;
          content?: string | null;
          goal?: string | null;
          tech_stack: string[];
          manner_temp_target: string;
          gradient?: string | null;
          team_leader_id?: string | null;
          category?: string | null;
          recruitment_status?: RecruitmentStatusRow[] | null;
          status?: "active" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          summary?: string | null;
          content?: string | null;
          goal?: string | null;
          tech_stack?: string[];
          manner_temp_target?: string;
          gradient?: string | null;
          team_leader_id?: string | null;
          category?: string | null;
          recruitment_status?: RecruitmentStatusRow[] | null;
          status?: "active" | "completed";
          created_at?: string;
          updated_at?: string;
        };
      };
      peer_evaluations: {
        Row: {
          id: string;
          project_id: string;
          evaluator_id: string;
          evaluatee_id: string;
          score: number;
          quick_feedback: string[];
          additional_feedback: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          evaluator_id: string;
          evaluatee_id: string;
          score: number;
          quick_feedback?: string[];
          additional_feedback?: string | null;
          created_at?: string;
        };
        Update: {
          score?: number;
          quick_feedback?: string[];
          additional_feedback?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          category: string;
          priority: "high" | "medium" | "low";
          status: "todo" | "doing" | "done";
          assignee_id: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          category?: string;
          priority?: "high" | "medium" | "low";
          status?: "todo" | "doing" | "done";
          assignee_id?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          category?: string;
          priority?: "high" | "medium" | "low";
          status?: "todo" | "doing" | "done";
          assignee_id?: string | null;
          due_date?: string | null;
          updated_at?: string;
        };
      };
      notices: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          content: string;
          category: string;
          author_id: string;
          pinned: boolean;
          send_email: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          content: string;
          category?: string;
          author_id: string;
          pinned?: boolean;
          send_email?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          category?: string;
          pinned?: boolean;
          send_email?: boolean;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          title?: string;
          message?: string;
          link?: string | null;
          read?: boolean;
        };
      };
      applications: {
        Row: {
          id: string;
          project_id: string;
          applicant_id: string;
          role: string | null;
          message: string | null;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          applicant_id: string;
          role?: string | null;
          message?: string | null;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          applicant_id?: string;
          message?: string | null;
          status?: "pending" | "accepted" | "rejected";
          updated_at?: string;
        };
      };
      chat_channels: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          project_id: string;
          channel_id: string | null;
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          channel_id?: string | null;
          author_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
          channel_id?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: string | null;
          avatar_url: string | null;
          success_rate: string | null;
          manner_temp: number | null;
          manner_temp_target: string | null;
          badges: string[];
          tech_stack: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          success_rate?: string | null;
          manner_temp?: number | null;
          manner_temp_target?: string | null;
          badges?: string[];
          tech_stack?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          success_rate?: string | null;
          manner_temp?: number | null;
          manner_temp_target?: string | null;
          badges?: string[];
          tech_stack?: string[];
          updated_at?: string;
        };
      };
    };
  };
}

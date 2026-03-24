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
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          category: string;
          author_id: string;
          pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          category?: string;
          author_id: string;
          pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          category?: string;
          pinned?: boolean;
          updated_at?: string;
        };
      };
      project_posts: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          content: string;
          category: string;
          author_id: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          category?: string;
          updated_at?: string;
        };
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          project_id: string;
          author_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          project_id: string;
          author_id: string;
          content: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          parent_id?: string | null;
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
          is_ai_recommendation: boolean;
          ai_comment: string | null;
          source_project_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          link?: string | null;
          read?: boolean;
          is_ai_recommendation?: boolean;
          ai_comment?: string | null;
          source_project_id?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          title?: string;
          message?: string;
          link?: string | null;
          read?: boolean;
          is_ai_recommendation?: boolean;
          ai_comment?: string | null;
          source_project_id?: string | null;
        };
      };
      /** 지원서 — 사용자 식별은 auth.users.id 와 동일한 `applicant_id` (컬럼명 user_id 아님) */
      applications: {
        Row: {
          id: string;
          project_id: string;
          applicant_id: string;
          role: string | null;
          tech_stack: string | null;
          message: string | null;
          status: "pending" | "accepted" | "rejected" | "canceled";
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          applicant_id: string;
          role?: string | null;
          tech_stack?: string | null;
          message?: string | null;
          status?: "pending" | "accepted" | "rejected" | "canceled";
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          applicant_id?: string;
          message?: string | null;
          role?: string | null;
          tech_stack?: string | null;
          status?: "pending" | "accepted" | "rejected" | "canceled";
          rejection_reason?: string | null;
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
          /** auth.users.email 과 동기화 (민감 정보 — RLS로 리더/팀원 등만 조회) */
          email: string | null;
          full_name: string | null;
          role: string | null;
          avatar_url: string | null;
          success_rate: string | null;
          manner_temp: number | null;
          manner_temp_target: string | null;
          badges: string[];
          tech_stack: string[];
          primary_stack: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          success_rate?: string | null;
          manner_temp?: number | null;
          manner_temp_target?: string | null;
          badges?: string[];
          tech_stack?: string[];
          primary_stack?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          success_rate?: string | null;
          manner_temp?: number | null;
          manner_temp_target?: string | null;
          badges?: string[];
          tech_stack?: string[];
          primary_stack?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}

export type SessionStatus = "draft" | "active" | "completed";
export type NoteCategory = "bug" | "feature" | "ux" | "performance" | "other";
export type PollQuestionType = "radio" | "checkbox";

export interface Session { id: string; name: string; description: string | null; build_version: string | null; status: SessionStatus; ai_summary: string | null; share_token: string | null; join_code: string; issue_options: string[]; created_at: string; started_at: string | null; ended_at: string | null; first_ended_at: string | null; last_restarted_at: string | null; restart_count: number; }
export interface Scene { id: string; session_id: string; name: string; description: string | null; order_index: number; poll_questions?: PollQuestion[]; }
export interface PollQuestion { id: string; scene_id: string; question: string; question_type: PollQuestionType; options: string[]; order_index: number; required: boolean; created_at: string; }
export interface PollResponse { id: string; poll_question_id: string; tester_id: string; selected_options: string[]; created_at: string; }
export interface Tester { id: string; session_id: string; user_id?: string | null; first_name: string; last_name: string; email: string | null; invite_token: string; invite_sent_at: string | null; report_sent_at: string | null; reported_issues: string[]; left_at: string | null; created_at: string; }
export interface Note { id: string; session_id: string; scene_id: string; tester_id: string; audio_url: string | null; raw_transcript: string | null; edited_transcript: string | null; category: NoteCategory; auto_classified: boolean; ai_summary: string | null; created_at: string; }
export interface SessionWithScenes extends Session { scenes: Scene[]; }
export interface SessionWithDetails extends Session { scenes: Scene[]; testers: Tester[]; notes: NoteWithDetails[]; }
export interface NoteWithDetails extends Note { scene: Scene; tester: Tester; }
export interface SceneWithPollQuestions extends Scene { poll_questions: PollQuestion[]; }

export interface Team { id: string; name: string; invite_token: string; created_at: string; }
export interface TeamMember { id: string; team_id: string; user_id?: string | null; first_name: string; last_name: string; email: string | null; created_at: string; }
export interface TeamWithMembers extends Team { members: TeamMember[]; }

export interface User { id: string; first_name: string; last_name: string; email: string; password_hash: string; created_at: string; }

export type InviteType = "session" | "team";
export interface PendingInvite { id: string; email: string; invite_type: InviteType; target_id: string; invited_by: string | null; created_at: string; expires_at: string; claimed_at: string | null; }

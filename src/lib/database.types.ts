
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "action_items": {
                  Row: {
                    "assignee_id": string | null,"completed_at": string | null,"created_at": string,"created_by": string,"description": string,"due_date": string | null,"edited_at": string | null,"edited_by": string | null,"id": string,"meeting_id": string,"needs_review": boolean,"owner": string | null,"position": number,"priority": string | null,"source_quote": string | null,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assignee_id"?: string | null,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string,"description": string,"due_date"?: string | null,"edited_at"?: string | null,"edited_by"?: string | null,"id"?: string,"meeting_id": string,"needs_review"?: boolean,"owner"?: string | null,"position"?: number,"priority"?: string | null,"source_quote"?: string | null,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "assignee_id"?: string | null,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string,"description"?: string,"due_date"?: string | null,"edited_at"?: string | null,"edited_by"?: string | null,"id"?: string,"meeting_id"?: string,"needs_review"?: boolean,"owner"?: string | null,"position"?: number,"priority"?: string | null,"source_quote"?: string | null,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "action_items_assignee_id_fkey"
      columns: ["assignee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "action_items_edited_by_fkey"
      columns: ["edited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "action_items_meeting_id_user_id_fkey"
      columns: ["meeting_id","user_id"]
isOneToOne: false
      referencedRelation: "meetings"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"analysis_runs": {
                  Row: {
                    "completion_tokens": number | null,"created_at": string,"duration_ms": number | null,"error": string | null,"id": string,"meeting_id": string,"model": string,"prompt_tokens": number | null,"raw_response": Json | null,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completion_tokens"?: number | null,"created_at"?: string,"duration_ms"?: number | null,"error"?: string | null,"id"?: string,"meeting_id": string,"model": string,"prompt_tokens"?: number | null,"raw_response"?: Json | null,"status": string,"user_id"?: string
                  }
                  Update: {
                    "completion_tokens"?: number | null,"created_at"?: string,"duration_ms"?: number | null,"error"?: string | null,"id"?: string,"meeting_id"?: string,"model"?: string,"prompt_tokens"?: number | null,"raw_response"?: Json | null,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "analysis_runs_meeting_id_fkey"
      columns: ["meeting_id"]
isOneToOne: false
      referencedRelation: "meetings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "analysis_runs_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"calendar_feeds": {
                  Row: {
                    "created_at": string,"token_hash": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"token_hash": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"token_hash"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "calendar_feeds_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"decisions": {
                  Row: {
                    "created_at": string,"created_by": string,"description": string,"edited_at": string | null,"edited_by": string | null,"id": string,"meeting_id": string,"source_quote": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string,"description": string,"edited_at"?: string | null,"edited_by"?: string | null,"id"?: string,"meeting_id": string,"source_quote"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"description"?: string,"edited_at"?: string | null,"edited_by"?: string | null,"id"?: string,"meeting_id"?: string,"source_quote"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "decisions_edited_by_fkey"
      columns: ["edited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "decisions_meeting_id_user_id_fkey"
      columns: ["meeting_id","user_id"]
isOneToOne: false
      referencedRelation: "meetings"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"edit_history": {
                  Row: {
                    "action": string,"changed_by": string | null,"changes": NonNullable<Json>,"created_at": string,"entity_id": string,"entity_type": string,"id": string,"label": string,"meeting_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"changed_by"?: string | null,"changes"?: NonNullable<Json>,"created_at"?: string,"entity_id": string,"entity_type": string,"id"?: string,"label": string,"meeting_id": string,"user_id": string
                  }
                  Update: {
                    "action"?: string,"changed_by"?: string | null,"changes"?: NonNullable<Json>,"created_at"?: string,"entity_id"?: string,"entity_type"?: string,"id"?: string,"label"?: string,"meeting_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "edit_history_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "edit_history_meeting_id_fkey"
      columns: ["meeting_id"]
isOneToOne: false
      referencedRelation: "meetings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "edit_history_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"meetings": {
                  Row: {
                    "analysis_error": string | null,"analysis_status": string,"archived_at": string | null,"created_at": string,"file_name": string | null,"id": string,"is_starred": boolean,"meeting_date": string,"source": string,"start_time": string | null,"summary": string | null,"summary_edited_at": string | null,"summary_edited_by": string | null,"title": string,"transcript": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "analysis_error"?: string | null,"analysis_status"?: string,"archived_at"?: string | null,"created_at"?: string,"file_name"?: string | null,"id"?: string,"is_starred"?: boolean,"meeting_date"?: string,"source"?: string,"start_time"?: string | null,"summary"?: string | null,"summary_edited_at"?: string | null,"summary_edited_by"?: string | null,"title": string,"transcript": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "analysis_error"?: string | null,"analysis_status"?: string,"archived_at"?: string | null,"created_at"?: string,"file_name"?: string | null,"id"?: string,"is_starred"?: boolean,"meeting_date"?: string,"source"?: string,"start_time"?: string | null,"summary"?: string | null,"summary_edited_at"?: string | null,"summary_edited_by"?: string | null,"title"?: string,"transcript"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meetings_summary_edited_by_fkey"
      columns: ["summary_edited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meetings_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"display_name": string | null,"id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"display_name"?: string | null,"id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"display_name"?: string | null,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "calendar_feed_items":
{ Args: { "p_token": string }; Returns: {
              "description": string,"due_date": string,"id": string,"meeting_title": string,"owner": string,"status": string,"updated_at": string
            }[]
                           },
"create_calendar_feed":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"delete_calendar_feed":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"is_active_user":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"save_analysis":
{ Args: { "p_action_items": Json,"p_decisions": Json,"p_meeting_id": string,"p_summary": string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const

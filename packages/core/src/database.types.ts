
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "audit_log": {
                  Row: {
                    "action": string,"actor": string | null,"changed_at": string,"id": number,"new_data": Json | null,"old_data": Json | null,"row_id": string,"table_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor"?: string | null,"changed_at"?: string,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null,"row_id": string,"table_name": string
                  }
                  Update: {
                    "action"?: string,"actor"?: string | null,"changed_at"?: string,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null,"row_id"?: string,"table_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "id": number,"name": string,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"name": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "id"?: never,"name"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"events": {
                  Row: {
                    "accessibility_notes": string | null,"age_rating": Database["public"]['Enums']["age_rating"] | null,"category_id": number,"cover_credit": string | null,"cover_path": string | null,"cover_rights": Database["public"]['Enums']["image_rights"] | null,"created_at": string,"created_by": string | null,"description": string | null,"id": string,"is_sponsored": boolean,"organization_id": string | null,"published_at": string | null,"slug": string,"status": Database["public"]['Enums']["event_status"],"status_note": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accessibility_notes"?: string | null,"age_rating"?: Database["public"]['Enums']["age_rating"] | null,"category_id": number,"cover_credit"?: string | null,"cover_path"?: string | null,"cover_rights"?: Database["public"]['Enums']["image_rights"] | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_sponsored"?: boolean,"organization_id"?: string | null,"published_at"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["event_status"],"status_note"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "accessibility_notes"?: string | null,"age_rating"?: Database["public"]['Enums']["age_rating"] | null,"category_id"?: number,"cover_credit"?: string | null,"cover_path"?: string | null,"cover_rights"?: Database["public"]['Enums']["image_rights"] | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_sponsored"?: boolean,"organization_id"?: string | null,"published_at"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["event_status"],"status_note"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"organization_contacts": {
                  Row: {
                    "contact_name": string | null,"email": string | null,"notes": string | null,"organization_id": string,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_name"?: string | null,"email"?: string | null,"notes"?: string | null,"organization_id": string,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "contact_name"?: string | null,"email"?: string | null,"notes"?: string | null,"organization_id"?: string,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organization_contacts_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: true
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "created_at": string,"id": string,"instagram_handle": string | null,"name": string,"slug": string,"updated_at": string,"verified": boolean,"website_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"instagram_handle"?: string | null,"name": string,"slug": string,"updated_at"?: string,"verified"?: boolean,"website_url"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"instagram_handle"?: string | null,"name"?: string,"slug"?: string,"updated_at"?: string,"verified"?: boolean,"website_url"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"regions": {
                  Row: {
                    "id": number,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id": number,"name": string,"slug": string
                  }
                  Update: {
                    "id"?: number,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"details": string | null,"event_id": string,"id": string,"reason": Database["public"]['Enums']["report_reason"],"resolution_note": string | null,"resolved_at": string | null,"resolved_by": string | null,"session_id": string | null,"status": Database["public"]['Enums']["report_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"details"?: string | null,"event_id": string,"id"?: string,"reason": Database["public"]['Enums']["report_reason"],"resolution_note"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"session_id"?: string | null,"status"?: Database["public"]['Enums']["report_status"]
                  }
                  Update: {
                    "created_at"?: string,"details"?: string | null,"event_id"?: string,"id"?: string,"reason"?: Database["public"]['Enums']["report_reason"],"resolution_note"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"session_id"?: string | null,"status"?: Database["public"]['Enums']["report_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "discoverable_sessions"
      referencedColumns: ["session_id"]
    },{
      foreignKeyName: "reports_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"sessions": {
                  Row: {
                    "created_at": string,"ends_at": string | null,"event_id": string,"id": string,"notes": string | null,"price_kind": Database["public"]['Enums']["price_kind"],"price_max_cents": number | null,"price_min_cents": number | null,"starts_at": string,"status": Database["public"]['Enums']["session_status"],"ticket_url": string | null,"ticket_url_checked_at": string | null,"ticket_url_status": Database["public"]['Enums']["link_status"],"time_confirmed": boolean,"updated_at": string,"venue_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ends_at"?: string | null,"event_id": string,"id"?: string,"notes"?: string | null,"price_kind"?: Database["public"]['Enums']["price_kind"],"price_max_cents"?: number | null,"price_min_cents"?: number | null,"starts_at": string,"status"?: Database["public"]['Enums']["session_status"],"ticket_url"?: string | null,"ticket_url_checked_at"?: string | null,"ticket_url_status"?: Database["public"]['Enums']["link_status"],"time_confirmed"?: boolean,"updated_at"?: string,"venue_id": string
                  }
                  Update: {
                    "created_at"?: string,"ends_at"?: string | null,"event_id"?: string,"id"?: string,"notes"?: string | null,"price_kind"?: Database["public"]['Enums']["price_kind"],"price_max_cents"?: number | null,"price_min_cents"?: number | null,"starts_at"?: string,"status"?: Database["public"]['Enums']["session_status"],"ticket_url"?: string | null,"ticket_url_checked_at"?: string | null,"ticket_url_status"?: Database["public"]['Enums']["link_status"],"time_confirmed"?: boolean,"updated_at"?: string,"venue_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sessions_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sessions_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    }
                  ]
                },"sources": {
                  Row: {
                    "created_at": string,"description": string | null,"event_id": string,"id": string,"kind": Database["public"]['Enums']["source_kind"],"last_verified_at": string | null,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"event_id": string,"id"?: string,"kind": Database["public"]['Enums']["source_kind"],"last_verified_at"?: string | null,"url"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"event_id"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["source_kind"],"last_verified_at"?: string | null,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "sources_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"staff": {
                  Row: {
                    "created_at": string,"display_name": string,"role": Database["public"]['Enums']["staff_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name": string,"role"?: Database["public"]['Enums']["staff_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"role"?: Database["public"]['Enums']["staff_role"],"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"submissions": {
                  Row: {
                    "contact_email": string | null,"created_at": string,"event_id": string | null,"id": string,"payload": NonNullable<Json>,"protocol": string,"public_note": string | null,"status": Database["public"]['Enums']["submission_status"],"tracking_token_hash": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_email"?: string | null,"created_at"?: string,"event_id"?: string | null,"id"?: string,"payload": NonNullable<Json>,"protocol": string,"public_note"?: string | null,"status"?: Database["public"]['Enums']["submission_status"],"tracking_token_hash": string,"updated_at"?: string
                  }
                  Update: {
                    "contact_email"?: string | null,"created_at"?: string,"event_id"?: string | null,"id"?: string,"payload"?: NonNullable<Json>,"protocol"?: string,"public_note"?: string | null,"status"?: Database["public"]['Enums']["submission_status"],"tracking_token_hash"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "submissions_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"venues": {
                  Row: {
                    "accessibility_notes": string | null,"address": string,"created_at": string,"id": string,"latitude": number | null,"longitude": number | null,"name": string,"region_id": number,"slug": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accessibility_notes"?: string | null,"address": string,"created_at"?: string,"id"?: string,"latitude"?: number | null,"longitude"?: number | null,"name": string,"region_id": number,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "accessibility_notes"?: string | null,"address"?: string,"created_at"?: string,"id"?: string,"latitude"?: number | null,"longitude"?: number | null,"name"?: string,"region_id"?: number,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "venues_region_id_fkey"
      columns: ["region_id"]
isOneToOne: false
      referencedRelation: "regions"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "discoverable_sessions": {
                  Row: {
                    "category_id": number | null,"cover_path": string | null,"ends_at": string | null,"event_id": string | null,"event_slug": string | null,"is_sponsored": boolean | null,"price_kind": Database["public"]['Enums']["price_kind"] | null,"price_max_cents": number | null,"price_min_cents": number | null,"region_id": number | null,"session_id": string | null,"session_status": Database["public"]['Enums']["session_status"] | null,"starts_at": string | null,"ticket_url": string | null,"time_confirmed": boolean | null,"title": string | null,"venue_id": string | null,"venue_name": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "events_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sessions_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sessions_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "venues_region_id_fkey"
      columns: ["region_id"]
isOneToOne: false
      referencedRelation: "regions"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "event_transition_allowed":
{ Args: { "from_status": Database["public"]['Enums']["event_status"],"to_status": Database["public"]['Enums']["event_status"] }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            "age_rating": "L"|"10"|"12"|"14"|"16"|"18","event_status": "draft"|"in_review"|"changes_requested"|"published"|"rejected"|"postponed"|"cancelled"|"suspended"|"archived","image_rights": "own"|"licensed"|"authorized_by_organizer"|"public_domain","link_status": "unchecked"|"ok"|"broken"|"suspicious","price_kind": "free"|"fixed"|"from"|"range"|"on_request"|"unknown","report_reason": "wrong_info"|"cancelled_or_changed"|"suspicious_link"|"fraud"|"offensive"|"image_rights"|"other","report_status": "open"|"investigating"|"resolved"|"dismissed","session_status": "scheduled"|"postponed"|"cancelled"|"sold_out","source_kind": "official_site"|"ticketing"|"social"|"submission"|"press"|"other","staff_role": "curator"|"admin","submission_status": "received"|"in_review"|"needs_info"|"accepted"|"rejected"
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
  "public": {
          Enums: {
            "age_rating": ["L", "10", "12", "14", "16", "18"],"event_status": ["draft", "in_review", "changes_requested", "published", "rejected", "postponed", "cancelled", "suspended", "archived"],"image_rights": ["own", "licensed", "authorized_by_organizer", "public_domain"],"link_status": ["unchecked", "ok", "broken", "suspicious"],"price_kind": ["free", "fixed", "from", "range", "on_request", "unknown"],"report_reason": ["wrong_info", "cancelled_or_changed", "suspicious_link", "fraud", "offensive", "image_rights", "other"],"report_status": ["open", "investigating", "resolved", "dismissed"],"session_status": ["scheduled", "postponed", "cancelled", "sold_out"],"source_kind": ["official_site", "ticketing", "social", "submission", "press", "other"],"staff_role": ["curator", "admin"],"submission_status": ["received", "in_review", "needs_info", "accepted", "rejected"]
          }
        }
} as const


export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "admin_roles": {
                  Row: {
                    "granted_at": string,"granted_by": string | null,"role": Database["public"]['Enums']["staff_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "granted_at"?: string,"granted_by"?: string | null,"role": Database["public"]['Enums']["staff_role"],"user_id": string
                  }
                  Update: {
                    "granted_at"?: string,"granted_by"?: string | null,"role"?: Database["public"]['Enums']["staff_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_roles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"adoption_interests": {
                  Row: {
                    "animal_id": string,"conversation_id": string | null,"created_at": string,"housing_info": string | null,"id": string,"interested_id": string,"message": string,"owner_id": string,"owner_note": string | null,"status": Database["public"]['Enums']["interest_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "animal_id": string,"conversation_id"?: string | null,"created_at"?: string,"housing_info"?: string | null,"id"?: string,"interested_id": string,"message": string,"owner_id": string,"owner_note"?: string | null,"status"?: Database["public"]['Enums']["interest_status"],"updated_at"?: string
                  }
                  Update: {
                    "animal_id"?: string,"conversation_id"?: string | null,"created_at"?: string,"housing_info"?: string | null,"id"?: string,"interested_id"?: string,"message"?: string,"owner_id"?: string,"owner_note"?: string | null,"status"?: Database["public"]['Enums']["interest_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "adoption_interests_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "animals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "adoption_interests_conversation_fk"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "adoption_interests_interested_id_fkey"
      columns: ["interested_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "adoption_interests_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"adoption_stories": {
                  Row: {
                    "animal_id": string | null,"author_id": string | null,"body": string,"created_at": string,"id": string,"is_published": boolean,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "animal_id"?: string | null,"author_id"?: string | null,"body": string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"title": string
                  }
                  Update: {
                    "animal_id"?: string | null,"author_id"?: string | null,"body"?: string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "adoption_stories_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "animals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "adoption_stories_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"animal_contacts": {
                  Row: {
                    "animal_id": string,"phone": string | null,"updated_at": string,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "animal_id": string,"phone"?: string | null,"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Update: {
                    "animal_id"?: string,"phone"?: string | null,"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "animal_contacts_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: true
      referencedRelation: "animals"
      referencedColumns: ["id"]
    }
                  ]
                },"animal_images": {
                  Row: {
                    "alt_text": string | null,"animal_id": string,"created_at": string,"height": number | null,"id": string,"is_primary": boolean,"position": number,"storage_path": string,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string | null,"animal_id": string,"created_at"?: string,"height"?: number | null,"id"?: string,"is_primary"?: boolean,"position"?: number,"storage_path": string,"width"?: number | null
                  }
                  Update: {
                    "alt_text"?: string | null,"animal_id"?: string,"created_at"?: string,"height"?: number | null,"id"?: string,"is_primary"?: boolean,"position"?: number,"storage_path"?: string,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "animal_images_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "animals"
      referencedColumns: ["id"]
    }
                  ]
                },"animals": {
                  Row: {
                    "accepts_messages": boolean,"adopted_at": string | null,"age_group": Database["public"]['Enums']["animal_age_group"],"age_months": number | null,"breed": string | null,"city_id": number,"contact_preference": Database["public"]['Enums']["contact_preference"],"created_at": string,"description": string,"dewormed": Database["public"]['Enums']["health_info"],"favorite_count": number,"good_with": (string)[],"health_verified": boolean,"id": string,"moderation_locked": boolean,"name": string,"neutered": Database["public"]['Enums']["health_info"],"owner_id": string,"personality": string | null,"published_at": string,"region": string | null,"risk_flags": (string)[],"search_vector": unknown,"sex": Database["public"]['Enums']["animal_sex"],"size": Database["public"]['Enums']["animal_size"],"slug": string,"special_needs": boolean,"special_needs_details": string | null,"species": Database["public"]['Enums']["animal_species"],"species_other": string | null,"status": Database["public"]['Enums']["animal_status"],"status_reason": string | null,"story": string | null,"temperament": (string)[],"uf": string,"updated_at": string,"vaccinated": Database["public"]['Enums']["health_info"],"vet_info": string | null,"view_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "accepts_messages"?: boolean,"adopted_at"?: string | null,"age_group": Database["public"]['Enums']["animal_age_group"],"age_months"?: number | null,"breed"?: string | null,"city_id": number,"contact_preference"?: Database["public"]['Enums']["contact_preference"],"created_at"?: string,"description": string,"dewormed"?: Database["public"]['Enums']["health_info"],"favorite_count"?: number,"good_with"?: (string)[],"health_verified"?: boolean,"id"?: string,"moderation_locked"?: boolean,"name": string,"neutered"?: Database["public"]['Enums']["health_info"],"owner_id": string,"personality"?: string | null,"published_at"?: string,"region"?: string | null,"risk_flags"?: (string)[],"search_vector"?: unknown,"sex": Database["public"]['Enums']["animal_sex"],"size": Database["public"]['Enums']["animal_size"],"slug": string,"special_needs"?: boolean,"special_needs_details"?: string | null,"species": Database["public"]['Enums']["animal_species"],"species_other"?: string | null,"status"?: Database["public"]['Enums']["animal_status"],"status_reason"?: string | null,"story"?: string | null,"temperament"?: (string)[],"uf": string,"updated_at"?: string,"vaccinated"?: Database["public"]['Enums']["health_info"],"vet_info"?: string | null,"view_count"?: number
                  }
                  Update: {
                    "accepts_messages"?: boolean,"adopted_at"?: string | null,"age_group"?: Database["public"]['Enums']["animal_age_group"],"age_months"?: number | null,"breed"?: string | null,"city_id"?: number,"contact_preference"?: Database["public"]['Enums']["contact_preference"],"created_at"?: string,"description"?: string,"dewormed"?: Database["public"]['Enums']["health_info"],"favorite_count"?: number,"good_with"?: (string)[],"health_verified"?: boolean,"id"?: string,"moderation_locked"?: boolean,"name"?: string,"neutered"?: Database["public"]['Enums']["health_info"],"owner_id"?: string,"personality"?: string | null,"published_at"?: string,"region"?: string | null,"risk_flags"?: (string)[],"search_vector"?: unknown,"sex"?: Database["public"]['Enums']["animal_sex"],"size"?: Database["public"]['Enums']["animal_size"],"slug"?: string,"special_needs"?: boolean,"special_needs_details"?: string | null,"species"?: Database["public"]['Enums']["animal_species"],"species_other"?: string | null,"status"?: Database["public"]['Enums']["animal_status"],"status_reason"?: string | null,"story"?: string | null,"temperament"?: (string)[],"uf"?: string,"updated_at"?: string,"vaccinated"?: Database["public"]['Enums']["health_info"],"vet_info"?: string | null,"view_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "animals_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "animals_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "animals_uf_fkey"
      columns: ["uf"]
isOneToOne: false
      referencedRelation: "states"
      referencedColumns: ["uf"]
    }
                  ]
                },"cities": {
                  Row: {
                    "id": number,"is_capital": boolean,"latitude": number,"longitude": number,"name": string,"slug": string,"uf": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id": number,"is_capital"?: boolean,"latitude": number,"longitude": number,"name": string,"slug": string,"uf": string
                  }
                  Update: {
                    "id"?: number,"is_capital"?: boolean,"latitude"?: number,"longitude"?: number,"name"?: string,"slug"?: string,"uf"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cities_uf_fkey"
      columns: ["uf"]
isOneToOne: false
      referencedRelation: "states"
      referencedColumns: ["uf"]
    }
                  ]
                },"contact_messages": {
                  Row: {
                    "created_at": string,"email": string,"handled_at": string | null,"handled_by": string | null,"id": string,"ip_hash": string | null,"message": string,"name": string,"subject": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"handled_at"?: string | null,"handled_by"?: string | null,"id"?: string,"ip_hash"?: string | null,"message": string,"name": string,"subject": string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"handled_at"?: string | null,"handled_by"?: string | null,"id"?: string,"ip_hash"?: string | null,"message"?: string,"name"?: string,"subject"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "contact_messages_handled_by_fkey"
      columns: ["handled_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contact_messages_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conversation_participants": {
                  Row: {
                    "conversation_id": string,"joined_at": string,"last_read_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "conversation_id": string,"joined_at"?: string,"last_read_at"?: string,"user_id": string
                  }
                  Update: {
                    "conversation_id"?: string,"joined_at"?: string,"last_read_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversation_participants_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversation_participants_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "animal_id": string | null,"created_at": string,"created_by": string | null,"id": string,"last_message_at": string,"last_message_preview": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "animal_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"last_message_at"?: string,"last_message_preview"?: string | null
                  }
                  Update: {
                    "animal_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"last_message_at"?: string,"last_message_preview"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "animals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"favorites": {
                  Row: {
                    "animal_id": string,"created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "animal_id": string,"created_at"?: string,"user_id": string
                  }
                  Update: {
                    "animal_id"?: string,"created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "animals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string,"conversation_id": string,"created_at": string,"flagged": boolean,"id": string,"sender_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"conversation_id": string,"created_at"?: string,"flagged"?: boolean,"id"?: string,"sender_id"?: string | null
                  }
                  Update: {
                    "body"?: string,"conversation_id"?: string,"created_at"?: string,"flagged"?: boolean,"id"?: string,"sender_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"moderation_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_role": string | null,"created_at": string,"id": number,"metadata": NonNullable<Json>,"reason": string | null,"target_id": string | null,"target_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_role"?: string | null,"created_at"?: string,"id"?: never,"metadata"?: NonNullable<Json>,"reason"?: string | null,"target_id"?: string | null,"target_type": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_role"?: string | null,"created_at"?: string,"id"?: never,"metadata"?: NonNullable<Json>,"reason"?: string | null,"target_id"?: string | null,"target_type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"id": string,"link": string | null,"read_at": string | null,"title": string,"type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"link"?: string | null,"read_at"?: string | null,"title": string,"type": string,"user_id": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"link"?: string | null,"read_at"?: string | null,"title"?: string,"type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organization_verifications": {
                  Row: {
                    "created_at": string,"id": string,"message": string | null,"organization_id": string,"requested_by": string | null,"reviewed_at": string | null,"reviewer_id": string | null,"reviewer_note": string | null,"status": Database["public"]['Enums']["verification_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"message"?: string | null,"organization_id": string,"requested_by"?: string | null,"reviewed_at"?: string | null,"reviewer_id"?: string | null,"reviewer_note"?: string | null,"status"?: Database["public"]['Enums']["verification_status"]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"message"?: string | null,"organization_id"?: string,"requested_by"?: string | null,"reviewed_at"?: string | null,"reviewer_id"?: string | null,"reviewer_note"?: string | null,"status"?: Database["public"]['Enums']["verification_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "organization_verifications_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_verifications_requested_by_fkey"
      columns: ["requested_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_verifications_reviewer_id_fkey"
      columns: ["reviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "city_id": number | null,"cnpj": string | null,"created_at": string,"description": string | null,"id": string,"instagram": string | null,"name": string,"owner_id": string,"slug": string,"uf": string | null,"updated_at": string,"verified_at": string | null,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "city_id"?: number | null,"cnpj"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"instagram"?: string | null,"name": string,"owner_id": string,"slug": string,"uf"?: string | null,"updated_at"?: string,"verified_at"?: string | null,"website"?: string | null
                  }
                  Update: {
                    "city_id"?: number | null,"cnpj"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"instagram"?: string | null,"name"?: string,"owner_id"?: string,"slug"?: string,"uf"?: string | null,"updated_at"?: string,"verified_at"?: string | null,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "organizations_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organizations_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organizations_uf_fkey"
      columns: ["uf"]
isOneToOne: false
      referencedRelation: "states"
      referencedColumns: ["uf"]
    }
                  ]
                },"platform_settings": {
                  Row: {
                    "description": string | null,"key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"key": string,"updated_at"?: string,"updated_by"?: string | null,"value": NonNullable<Json>
                  }
                  Update: {
                    "description"?: string | null,"key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "account_status": Database["public"]['Enums']["account_status"],"avatar_url": string | null,"bio": string | null,"city_id": number | null,"created_at": string,"full_name": string,"id": string,"is_verified": boolean,"profile_type": Database["public"]['Enums']["profile_type"],"slug": string,"status_reason": string | null,"uf": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_status"?: Database["public"]['Enums']["account_status"],"avatar_url"?: string | null,"bio"?: string | null,"city_id"?: number | null,"created_at"?: string,"full_name": string,"id": string,"is_verified"?: boolean,"profile_type"?: Database["public"]['Enums']["profile_type"],"slug": string,"status_reason"?: string | null,"uf"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "account_status"?: Database["public"]['Enums']["account_status"],"avatar_url"?: string | null,"bio"?: string | null,"city_id"?: number | null,"created_at"?: string,"full_name"?: string,"id"?: string,"is_verified"?: boolean,"profile_type"?: Database["public"]['Enums']["profile_type"],"slug"?: string,"status_reason"?: string | null,"uf"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profiles_uf_fkey"
      columns: ["uf"]
isOneToOne: false
      referencedRelation: "states"
      referencedColumns: ["uf"]
    }
                  ]
                },"profiles_private": {
                  Row: {
                    "birth_date": string,"created_at": string,"id": string,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "birth_date": string,"created_at"?: string,"id": string,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "birth_date"?: string,"created_at"?: string,"id"?: string,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_private_id_fkey"
      columns: ["id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"rate_limit_events": {
                  Row: {
                    "action": string,"created_at": string,"id": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"created_at"?: string,"id"?: never,"user_id": string
                  }
                  Update: {
                    "action"?: string,"created_at"?: string,"id"?: never,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "animal_id": string | null,"conversation_id": string | null,"created_at": string,"description": string | null,"id": string,"reason": Database["public"]['Enums']["report_reason"],"reported_user_id": string | null,"reporter_id": string | null,"resolution_note": string | null,"resolved_at": string | null,"resolved_by": string | null,"status": Database["public"]['Enums']["report_status"],"target_type": Database["public"]['Enums']["report_target"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "animal_id"?: string | null,"conversation_id"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"reason": Database["public"]['Enums']["report_reason"],"reported_user_id"?: string | null,"reporter_id"?: string | null,"resolution_note"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"target_type": Database["public"]['Enums']["report_target"],"updated_at"?: string
                  }
                  Update: {
                    "animal_id"?: string | null,"conversation_id"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"reason"?: Database["public"]['Enums']["report_reason"],"reported_user_id"?: string | null,"reporter_id"?: string | null,"resolution_note"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"target_type"?: Database["public"]['Enums']["report_target"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "animals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reported_user_id_fkey"
      columns: ["reported_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_resolved_by_fkey"
      columns: ["resolved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"staff_permissions": {
                  Row: {
                    "permission": string,"role": Database["public"]['Enums']["staff_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "permission": string,"role": Database["public"]['Enums']["staff_role"]
                  }
                  Update: {
                    "permission"?: string,"role"?: Database["public"]['Enums']["staff_role"]
                  }
                  Relationships: [
                    
                  ]
                },"states": {
                  Row: {
                    "name": string,"region": string,"uf": string
                  }
                  ComputedFields: never
                  Insert: {
                    "name": string,"region": string,"uf": string
                  }
                  Update: {
                    "name"?: string,"region"?: string,"uf"?: string
                  }
                  Relationships: [
                    
                  ]
                },"terms_acceptances": {
                  Row: {
                    "accepted_at": string,"document": Database["public"]['Enums']["legal_document"],"id": string,"user_id": string,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string,"document": Database["public"]['Enums']["legal_document"],"id"?: string,"user_id": string,"version": string
                  }
                  Update: {
                    "accepted_at"?: string,"document"?: Database["public"]['Enums']["legal_document"],"id"?: string,"user_id"?: string,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "terms_acceptances_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked_id": string,"blocker_id": string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_clear_animal_flags":
{ Args: { "p_animal": string,"p_reason": string }; Returns: undefined
                           },
"admin_dashboard_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_set_animal_status":
{ Args: { "p_animal": string,"p_reason": string,"p_status": Database["public"]['Enums']["animal_status"] }; Returns: undefined
                           },
"admin_set_health_verified":
{ Args: { "p_animal": string,"p_reason": string,"p_verified": boolean }; Returns: undefined
                           },
"admin_set_profile_verified":
{ Args: { "p_reason": string,"p_user": string,"p_verified": boolean }; Returns: undefined
                           },
"admin_set_user_status":
{ Args: { "p_reason": string,"p_status": Database["public"]['Enums']["account_status"],"p_user": string }; Returns: undefined
                           },
"admin_update_report":
{ Args: { "p_note": string,"p_report": string,"p_status": Database["public"]['Enums']["report_status"] }; Returns: undefined
                           },
"admin_update_setting":
{ Args: { "p_key": string,"p_value": Json }; Returns: undefined
                           },
"detect_risk_flags":
{ Args: { "content": string }; Returns: (string)[]
                           },
"distance_km":
{ Args: { "lat1": number,"lat2": number,"lon1": number,"lon2": number }; Returns: number
                           },
"enforce_rate_limit":
{ Args: { "action_name": string }; Returns: undefined
                           },
"export_my_data":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"get_animal_whatsapp":
{ Args: { "p_animal": string }; Returns: string
                           },
"has_permission":
{ Args: { "perm": string }; Returns: boolean
                           },
"increment_animal_view":
{ Args: { "p_animal": string }; Returns: undefined
                           },
"is_active_user":
{ Args: { "uid"?: string }; Returns: boolean
                           },
"is_blocked_between":
{ Args: { "a": string,"b": string }; Returns: boolean
                           },
"is_client_request":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_conversation_participant":
{ Args: { "conv": string,"uid"?: string }; Returns: boolean
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"log_moderation":
{ Args: { "p_action": string,"p_metadata"?: Json,"p_reason": string,"p_target_id": string,"p_target_type": string }; Returns: undefined
                           },
"mark_conversation_read":
{ Args: { "p_conversation": string }; Returns: undefined
                           },
"my_conversations":
{ Args: Record<PropertyKey, never>; Returns: {
              "animal_id": string,"animal_name": string,"animal_slug": string,"conversation_id": string,"is_blocked": boolean,"last_message_at": string,"last_message_preview": string,"other_user_avatar": string,"other_user_id": string,"other_user_name": string,"unread_count": number
            }[]
                           },
"normalize_text":
{ Args: { "value": string }; Returns: string
                           },
"notify":
{ Args: { "p_body": string,"p_link": string,"p_title": string,"p_type": string,"p_user": string }; Returns: undefined
                           },
"public_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"purge_expired_data":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"search_animals":
{ Args: { "p_age_group"?: (Database["public"]['Enums']["animal_age_group"])[],"p_breed"?: string,"p_city"?: number,"p_limit"?: number,"p_neutered"?: boolean,"p_offset"?: number,"p_query"?: string,"p_radius_km"?: number,"p_ref_city"?: number,"p_sex"?: Database["public"]['Enums']["animal_sex"],"p_size"?: (Database["public"]['Enums']["animal_size"])[],"p_sort"?: string,"p_special_needs"?: boolean,"p_species"?: (Database["public"]['Enums']["animal_species"])[],"p_status"?: Database["public"]['Enums']["animal_status"],"p_uf"?: string,"p_vaccinated"?: boolean }; Returns: {
              "adopted_at": string,"age_group": Database["public"]['Enums']["animal_age_group"],"age_months": number,"breed": string,"city_name": string,"distance_km": number,"id": string,"image_path": string,"name": string,"neutered": Database["public"]['Enums']["health_info"],"owner_name": string,"owner_type": Database["public"]['Enums']["profile_type"],"owner_verified": boolean,"published_at": string,"sex": Database["public"]['Enums']["animal_sex"],"size": Database["public"]['Enums']["animal_size"],"slug": string,"special_needs": boolean,"species": Database["public"]['Enums']["animal_species"],"species_other": string,"status": Database["public"]['Enums']["animal_status"],"total_count": number,"uf": string,"updated_at": string,"vaccinated": Database["public"]['Enums']["health_info"],"view_count": number
            }[]
                           },
"set_primary_image":
{ Args: { "p_image": string }; Returns: undefined
                           },
"set_privileged":
{ Args: { "enabled": boolean }; Returns: undefined
                           },
"setting":
{ Args: { "setting_key": string }; Returns: Json
                           },
"slugify":
{ Args: { "value": string }; Returns: string
                           },
"staff_role_of":
{ Args: { "uid": string }; Returns: Database["public"]['Enums']["staff_role"]
                           },
"start_conversation":
{ Args: { "p_animal": string,"p_message": string }; Returns: string
                           },
"start_conversation_from_interest":
{ Args: { "p_interest": string }; Returns: string
                           },
"unread_messages_count":
{ Args: Record<PropertyKey, never>; Returns: number
                           }
          }
          Enums: {
            "account_status": "ativo"|"suspenso"|"bloqueado","animal_age_group": "filhote"|"jovem"|"adulto"|"idoso","animal_sex": "macho"|"femea","animal_size": "pequeno"|"medio"|"grande","animal_species": "cachorro"|"gato"|"outro","animal_status": "disponivel"|"adotado"|"pausado"|"suspenso"|"removido","contact_preference": "chat"|"whatsapp"|"ambos","health_info": "sim"|"nao"|"parcial"|"nao_informado","interest_status": "enviado"|"visualizado"|"em_conversa"|"aceito"|"recusado"|"cancelado","legal_document": "termos_uso"|"politica_privacidade"|"diretrizes_comunidade"|"politica_adocao","profile_type": "pessoa_fisica"|"protetor_independente"|"ong_abrigo"|"organizacao_parceira","report_reason": "golpe"|"venda_de_animal"|"maus_tratos"|"informacao_falsa"|"spam"|"conteudo_inadequado"|"assedio"|"outro","report_status": "pendente"|"em_analise"|"procedente"|"improcedente","report_target": "animal"|"usuario"|"conversa","staff_role": "admin"|"moderador","verification_status": "pendente"|"aprovada"|"rejeitada"
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
            "account_status": ["ativo", "suspenso", "bloqueado"],"animal_age_group": ["filhote", "jovem", "adulto", "idoso"],"animal_sex": ["macho", "femea"],"animal_size": ["pequeno", "medio", "grande"],"animal_species": ["cachorro", "gato", "outro"],"animal_status": ["disponivel", "adotado", "pausado", "suspenso", "removido"],"contact_preference": ["chat", "whatsapp", "ambos"],"health_info": ["sim", "nao", "parcial", "nao_informado"],"interest_status": ["enviado", "visualizado", "em_conversa", "aceito", "recusado", "cancelado"],"legal_document": ["termos_uso", "politica_privacidade", "diretrizes_comunidade", "politica_adocao"],"profile_type": ["pessoa_fisica", "protetor_independente", "ong_abrigo", "organizacao_parceira"],"report_reason": ["golpe", "venda_de_animal", "maus_tratos", "informacao_falsa", "spam", "conteudo_inadequado", "assedio", "outro"],"report_status": ["pendente", "em_analise", "procedente", "improcedente"],"report_target": ["animal", "usuario", "conversa"],"staff_role": ["admin", "moderador"],"verification_status": ["pendente", "aprovada", "rejeitada"]
          }
        }
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achat_details: {
        Row: {
          achat_id: string
          id: string
          materiel_pu_id: string
          quantite: number
        }
        Insert: {
          achat_id: string
          id?: string
          materiel_pu_id: string
          quantite: number
        }
        Update: {
          achat_id?: string
          id?: string
          materiel_pu_id?: string
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "achat_details_achat_id_fkey"
            columns: ["achat_id"]
            isOneToOne: false
            referencedRelation: "achats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achat_details_materiel_pu_id_fkey"
            columns: ["materiel_pu_id"]
            isOneToOne: false
            referencedRelation: "materiel_pu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achat_details_materiel_pu_id_fkey"
            columns: ["materiel_pu_id"]
            isOneToOne: false
            referencedRelation: "stock_par_palier"
            referencedColumns: ["materiel_pu_id"]
          },
        ]
      }
      achats: {
        Row: {
          created_at: string
          date_achat: string
          fournisseur: string | null
          id: string
          notes: string | null
          responsable_id: string | null
        }
        Insert: {
          created_at?: string
          date_achat?: string
          fournisseur?: string | null
          id?: string
          notes?: string | null
          responsable_id?: string | null
        }
        Update: {
          created_at?: string
          date_achat?: string
          fournisseur?: string | null
          id?: string
          notes?: string | null
          responsable_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "achats_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "responsables"
            referencedColumns: ["id"]
          },
        ]
      }
      empruntretour: {
        Row: {
          created_at: string
          date_op: string
          date_retour_prevue: string | null
          equipe_id: string
          etat: Database["public"]["Enums"]["etat_empruntretour"]
          id: string
          notes: string | null
          responsable_id: string | null
          statut: Database["public"]["Enums"]["statut_empruntretour"]
        }
        Insert: {
          created_at?: string
          date_op?: string
          date_retour_prevue?: string | null
          equipe_id: string
          etat: Database["public"]["Enums"]["etat_empruntretour"]
          id?: string
          notes?: string | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["statut_empruntretour"]
        }
        Update: {
          created_at?: string
          date_op?: string
          date_retour_prevue?: string | null
          equipe_id?: string
          etat?: Database["public"]["Enums"]["etat_empruntretour"]
          id?: string
          notes?: string | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["statut_empruntretour"]
        }
        Relationships: [
          {
            foreignKeyName: "empruntretour_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empruntretour_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "responsables"
            referencedColumns: ["id"]
          },
        ]
      }
      empruntretour_details: {
        Row: {
          empruntretour_id: string
          id: string
          materiel_pu_id: string
          quantite: number
        }
        Insert: {
          empruntretour_id: string
          id?: string
          materiel_pu_id: string
          quantite: number
        }
        Update: {
          empruntretour_id?: string
          id?: string
          materiel_pu_id?: string
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "empruntretour_details_empruntretour_id_fkey"
            columns: ["empruntretour_id"]
            isOneToOne: false
            referencedRelation: "empruntretour"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empruntretour_details_materiel_pu_id_fkey"
            columns: ["materiel_pu_id"]
            isOneToOne: false
            referencedRelation: "materiel_pu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empruntretour_details_materiel_pu_id_fkey"
            columns: ["materiel_pu_id"]
            isOneToOne: false
            referencedRelation: "stock_par_palier"
            referencedColumns: ["materiel_pu_id"]
          },
        ]
      }
      equipes: {
        Row: {
          classe: string | null
          created_at: string
          id: string
          niveau: string | null
          nom: string
          projet: string | null
        }
        Insert: {
          classe?: string | null
          created_at?: string
          id?: string
          niveau?: string | null
          nom: string
          projet?: string | null
        }
        Update: {
          classe?: string | null
          created_at?: string
          id?: string
          niveau?: string | null
          nom?: string
          projet?: string | null
        }
        Relationships: []
      }
      materiel_pu: {
        Row: {
          created_at: string
          id: string
          materiel_id: string
          prix_unitaire: number
        }
        Insert: {
          created_at?: string
          id?: string
          materiel_id: string
          prix_unitaire: number
        }
        Update: {
          created_at?: string
          id?: string
          materiel_id?: string
          prix_unitaire?: number
        }
        Relationships: [
          {
            foreignKeyName: "materiel_pu_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiels"
            referencedColumns: ["id"]
          },
        ]
      }
      materiels: {
        Row: {
          categorie: string | null
          created_at: string
          id: string
          nom: string
          type: Database["public"]["Enums"]["type_materiel"]
        }
        Insert: {
          categorie?: string | null
          created_at?: string
          id?: string
          nom: string
          type: Database["public"]["Enums"]["type_materiel"]
        }
        Update: {
          categorie?: string | null
          created_at?: string
          id?: string
          nom?: string
          type?: Database["public"]["Enums"]["type_materiel"]
        }
        Relationships: []
      }
      membres: {
        Row: {
          equipe_id: string
          id: string
          nom: string
          numero: string | null
        }
        Insert: {
          equipe_id: string
          id?: string
          nom: string
          numero?: string | null
        }
        Update: {
          equipe_id?: string
          id?: string
          nom?: string
          numero?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membres_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      mouvements: {
        Row: {
          achat_id: string | null
          date_mouvement: string
          empruntretour_id: string | null
          id: string
          materiel_pu_id: string
          quantite: number
          type: Database["public"]["Enums"]["type_mouvement"]
        }
        Insert: {
          achat_id?: string | null
          date_mouvement?: string
          empruntretour_id?: string | null
          id?: string
          materiel_pu_id: string
          quantite: number
          type: Database["public"]["Enums"]["type_mouvement"]
        }
        Update: {
          achat_id?: string | null
          date_mouvement?: string
          empruntretour_id?: string | null
          id?: string
          materiel_pu_id?: string
          quantite?: number
          type?: Database["public"]["Enums"]["type_mouvement"]
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_achat_id_fkey"
            columns: ["achat_id"]
            isOneToOne: false
            referencedRelation: "achats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_empruntretour_id_fkey"
            columns: ["empruntretour_id"]
            isOneToOne: false
            referencedRelation: "empruntretour"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_materiel_pu_id_fkey"
            columns: ["materiel_pu_id"]
            isOneToOne: false
            referencedRelation: "materiel_pu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_materiel_pu_id_fkey"
            columns: ["materiel_pu_id"]
            isOneToOne: false
            referencedRelation: "stock_par_palier"
            referencedColumns: ["materiel_pu_id"]
          },
        ]
      }
      profils: {
        Row: {
          created_at: string
          equipe_id: string | null
          id: string
          responsable_id: string | null
          role: Database["public"]["Enums"]["role_profil"]
        }
        Insert: {
          created_at?: string
          equipe_id?: string | null
          id: string
          responsable_id?: string | null
          role: Database["public"]["Enums"]["role_profil"]
        }
        Update: {
          created_at?: string
          equipe_id?: string | null
          id?: string
          responsable_id?: string | null
          role?: Database["public"]["Enums"]["role_profil"]
        }
        Relationships: [
          {
            foreignKeyName: "profils_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profils_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "responsables"
            referencedColumns: ["id"]
          },
        ]
      }
      responsables: {
        Row: {
          actif: boolean
          created_at: string
          id: string
          nom: string
          role: string | null
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id?: string
          nom: string
          role?: string | null
        }
        Update: {
          actif?: boolean
          created_at?: string
          id?: string
          nom?: string
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      detention_equipe: {
        Row: {
          equipe: string | null
          equipe_id: string | null
          materiel: string | null
          materiel_pu_id: string | null
          prix_unitaire: number | null
          quantite_detenue: number | null
          valeur_detenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "empruntretour_details_materiel_pu_id_fkey"
            columns: ["materiel_pu_id"]
            isOneToOne: false
            referencedRelation: "materiel_pu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empruntretour_details_materiel_pu_id_fkey"
            columns: ["materiel_pu_id"]
            isOneToOne: false
            referencedRelation: "stock_par_palier"
            referencedColumns: ["materiel_pu_id"]
          },
          {
            foreignKeyName: "empruntretour_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_par_palier: {
        Row: {
          materiel: string | null
          materiel_id: string | null
          materiel_pu_id: string | null
          prix_unitaire: number | null
          quantite_disponible: number | null
          type_materiel: Database["public"]["Enums"]["type_materiel"] | null
          valeur_disponible: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materiel_pu_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      profil_equipe: { Args: never; Returns: string }
      profil_role: {
        Args: never
        Returns: Database["public"]["Enums"]["role_profil"]
      }
    }
    Enums: {
      etat_empruntretour: "emprunt" | "retour"
      role_profil: "super" | "responsable" | "equipe"
      statut_empruntretour: "demande" | "valide" | "refuse"
      type_materiel: "durable" | "consommable"
      type_mouvement: "entree" | "sortie"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      etat_empruntretour: ["emprunt", "retour"],
      role_profil: ["super", "responsable", "equipe"],
      statut_empruntretour: ["demande", "valide", "refuse"],
      type_materiel: ["durable", "consommable"],
      type_mouvement: ["entree", "sortie"],
    },
  },
} as const

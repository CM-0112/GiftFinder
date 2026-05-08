// -------------------------------------------------------
// Database row types — mirror the SQL schema exactly
// -------------------------------------------------------

export type User = {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ConnectionStatus = "pending" | "connected";

export type Connection = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
};

export type WishlistItem = {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  price_display: string | null;
  image_url: string | null;
  product_url: string | null;
  note: string | null;
  position: number;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ScrapeLog = {
  id: string;
  user_id: string | null;
  url: string;
  domain: string;
  success: boolean;
  fields_found: string[] | null;
  error_message: string | null;
  created_at: string;
};

// -------------------------------------------------------
// App-level types
// -------------------------------------------------------

// Connection with the other user's profile joined in
export type ConnectionWithUser = Connection & {
  user: Pick<User, "id" | "username" | "display_name" | "avatar_url">;
};

// Relationship of the current user to any other user
export type RelationshipStatus =
  | "none"
  | "pending_sent"      // current user sent a request
  | "pending_received"  // current user has an incoming request
  | "connected"
  | "self";

// Result from the OG scraper
export type ScrapeResult = {
  success: boolean;
  name?: string;
  brand?: string;
  price_display?: string;
  image_url?: string;
  fields_found: string[];
  error?: string;
};

// Supabase database type map (for createClient generic)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      connections: {
        Row: Connection;
        Insert: Omit<Connection, "id" | "created_at" | "updated_at">;
        Update: Partial<Pick<Connection, "status">>;
      };
      wishlist_items: {
        Row: WishlistItem;
        Insert: Omit<WishlistItem, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<WishlistItem, "id" | "user_id" | "created_at">>;
      };
      scrape_logs: {
        Row: ScrapeLog;
        Insert: Omit<ScrapeLog, "id" | "created_at">;
        Update: never;
      };
    };
  };
};

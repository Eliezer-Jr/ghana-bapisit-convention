import { supabaseDB, supabaseFunctions } from "./supabase-clients";

// Default export for database operations (backward compatibility)
export const supabase = supabaseDB;

// Export functions client for edge function calls
export { supabaseFunctions };

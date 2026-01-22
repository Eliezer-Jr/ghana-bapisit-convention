import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LetterTemplate {
  id: string;
  template_type: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  font_size_title: number;
  font_size_body: number;
  letterhead_height: number;
  logo_width: number;
  logo_height: number;
  organization_name: string;
  organization_subtitle: string;
  footer_text: string;
}

export const useLetterTemplate = () => {
  return useQuery({
    queryKey: ["letter-template"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("letter_templates")
        .select("*")
        .eq("template_type", "default")
        .maybeSingle();

      if (error) throw error;
      
      // Return default values if no template exists
      if (!data) {
        return {
          primary_color: "41,128,185",
          secondary_color: "52,73,94",
          font_family: "helvetica",
          font_size_title: 16,
          font_size_body: 11,
          letterhead_height: 45,
          logo_width: 30,
          logo_height: 30,
          organization_name: "GBC Ministers' Conference",
          organization_subtitle: "MINISTERIAL ADMISSION",
          footer_text: "This is an official document of the GBC Ministers' Conference",
        } as Partial<LetterTemplate>;
      }
      
      return data as LetterTemplate;
    },
  });
};

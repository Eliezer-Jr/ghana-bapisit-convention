import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignatureManager } from "@/components/SignatureManager";
import { generateSampleLetter } from "@/utils/letterGenerator";
import logoImg from "@/assets/logo-watermark.png";

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

export default function LetterTemplateEditor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<LetterTemplate | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("letter_templates")
        .select("*")
        .eq("template_type", "default")
        .maybeSingle();

      if (error) throw error;
      if (data) setTemplate(data);
    } catch (error) {
      console.error("Error fetching template:", error);
      toast.error("Failed to load template settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("letter_templates")
        .update({
          primary_color: template.primary_color,
          secondary_color: template.secondary_color,
          font_family: template.font_family,
          font_size_title: template.font_size_title,
          font_size_body: template.font_size_body,
          letterhead_height: template.letterhead_height,
          logo_width: template.logo_width,
          logo_height: template.logo_height,
          organization_name: template.organization_name,
          organization_subtitle: template.organization_subtitle,
          footer_text: template.footer_text,
        })
        .eq("id", template.id);

      if (error) throw error;
      toast.success("Template settings saved successfully");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template settings");
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = (field: keyof LetterTemplate, value: string | number) => {
    if (!template) return;
    setTemplate({ ...template, [field]: value });
  };

  const handlePreview = async () => {
    if (!template) return;

    setGeneratingPreview(true);
    try {
      // Fetch signatures
      const { data: signatures, error } = await supabase
        .from("letter_signatures")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;

      // Generate preview PDF
      const doc = generateSampleLetter(
        template,
        signatures || [],
        logoImg
      );

      // Save the PDF
      doc.save(`Letter_Template_Preview_${Date.now()}.pdf`);
      toast.success("Preview generated successfully");
    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error("Failed to generate preview");
    } finally {
      setGeneratingPreview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading template settings...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">No template found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Letter Template Editor</h1>
              <p className="text-muted-foreground">Customize the appearance of generated letters</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview} disabled={generatingPreview}>
              <Eye className="h-4 w-4 mr-2" />
              {generatingPreview ? "Generating..." : "Preview PDF"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="signatures">Signatures</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Color Settings</CardTitle>
                <CardDescription>Define the color scheme for your letters (RGB format: r,g,b)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary_color"
                        value={template.primary_color}
                        onChange={(e) => updateTemplate("primary_color", e.target.value)}
                        placeholder="41,128,185"
                      />
                      <div
                        className="w-12 h-10 rounded border"
                        style={{ backgroundColor: `rgb(${template.primary_color})` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary_color"
                        value={template.secondary_color}
                        onChange={(e) => updateTemplate("secondary_color", e.target.value)}
                        placeholder="52,73,94"
                      />
                      <div
                        className="w-12 h-10 rounded border"
                        style={{ backgroundColor: `rgb(${template.secondary_color})` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="typography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Typography Settings</CardTitle>
                <CardDescription>Configure fonts and text sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="font_family">Font Family</Label>
                  <Input
                    id="font_family"
                    value={template.font_family}
                    onChange={(e) => updateTemplate("font_family", e.target.value)}
                    placeholder="helvetica"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="font_size_title">Title Font Size</Label>
                    <Input
                      id="font_size_title"
                      type="number"
                      value={template.font_size_title}
                      onChange={(e) => updateTemplate("font_size_title", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="font_size_body">Body Font Size</Label>
                    <Input
                      id="font_size_body"
                      type="number"
                      value={template.font_size_body}
                      onChange={(e) => updateTemplate("font_size_body", parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Layout Settings</CardTitle>
                <CardDescription>Adjust dimensions and spacing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="letterhead_height">Letterhead Height</Label>
                  <Input
                    id="letterhead_height"
                    type="number"
                    value={template.letterhead_height}
                    onChange={(e) => updateTemplate("letterhead_height", parseInt(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_width">Logo Width</Label>
                    <Input
                      id="logo_width"
                      type="number"
                      value={template.logo_width}
                      onChange={(e) => updateTemplate("logo_width", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo_height">Logo Height</Label>
                    <Input
                      id="logo_height"
                      type="number"
                      value={template.logo_height}
                      onChange={(e) => updateTemplate("logo_height", parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Settings</CardTitle>
                <CardDescription>Edit organization information and text content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organization_name">Organization Name</Label>
                  <Input
                    id="organization_name"
                    value={template.organization_name}
                    onChange={(e) => updateTemplate("organization_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization_subtitle">Organization Subtitle</Label>
                  <Input
                    id="organization_subtitle"
                    value={template.organization_subtitle}
                    onChange={(e) => updateTemplate("organization_subtitle", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer_text">Footer Text</Label>
                  <Textarea
                    id="footer_text"
                    value={template.footer_text}
                    onChange={(e) => updateTemplate("footer_text", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signatures" className="space-y-6">
            <SignatureManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

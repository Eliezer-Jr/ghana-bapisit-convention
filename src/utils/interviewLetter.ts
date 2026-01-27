import jsPDF from 'jspdf';
import logoImg from '@/assets/logo-gbcc.png';
import { supabase } from '@/integrations/supabase/client';

interface InterviewLetterData {
  full_name: string;
  phone: string;
  email: string;
  admission_level: string;
  church_name: string;
  interview_date?: string;
  interview_location?: string;
  photo_url?: string;
}

export const generateInterviewLetter = async (data: InterviewLetterData) => {
  // Fetch template settings
  const { data: template } = await supabase
    .from('letter_templates')
    .select('*')
    .eq('template_type', 'default')
    .maybeSingle();

  // Fetch active signatures
  const { data: signatures } = await supabase
    .from('letter_signatures')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  // Use template settings or defaults
  const primaryColor = template?.primary_color.split(',').map(n => parseInt(n.trim())) as [number, number, number] || [41, 128, 185];
  const secondaryColor = template?.secondary_color.split(',').map(n => parseInt(n.trim())) as [number, number, number] || [52, 73, 94];
  const fontFamily = template?.font_family || 'helvetica';
  const fontSizeTitle = template?.font_size_title || 16;
  const fontSizeBody = template?.font_size_body || 11;
  const letterheadHeight = template?.letterhead_height || 45;
  const logoWidth = template?.logo_width || 30;
  const logoHeight = template?.logo_height || 30;
  const organizationName = template?.organization_name || 'Ghana Baptist Convention Conference';
  const organizationSubtitle = template?.organization_subtitle || 'MINISTERIAL ADMISSION';
  const footerText = template?.footer_text || 'This is an official document of the Ghana Baptist Convention Conference';

  const doc = new jsPDF();
  
  // Add letterhead
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, letterheadHeight, 'F');
  
  // Add logo
  try {
    doc.addImage(logoImg, 'PNG', 15, 10, logoWidth, logoHeight);
  } catch (error) {
    console.error('Error adding logo:', error);
  }
  
  // Organization name (centered)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont(fontFamily, 'bold');
  doc.text(organizationName, 105, 20, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont(fontFamily, 'normal');
  doc.text(organizationSubtitle, 105, 28, { align: 'center' });
  
  // Add applicant photo with border (right side)
  if (data.photo_url) {
    try {
      // White border for photo
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(163, 8, 32, 32, 2, 2, 'F');
      doc.addImage(data.photo_url, 'JPEG', 165, 10, 28, 28);
    } catch (error) {
      console.error('Error adding photo:', error);
    }
  }
  
  // Reset text color for body
  doc.setTextColor(...secondaryColor);
  
  // Date
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  doc.text(today, 20, 60);
  
  // Letter title
  doc.setFontSize(fontSizeTitle);
  doc.setFont(fontFamily, 'bold');
  doc.text('INTERVIEW INVITATION', 105, 75, { align: 'center' });
  
  // Horizontal line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, 80, 190, 80);
  
  // Body content
  doc.setFontSize(fontSizeBody);
  doc.setFont(fontFamily, 'normal');
  
  let yPosition = 90;
  
  doc.text('Dear ' + data.full_name + ',', 20, yPosition);
  yPosition += 8;
  
  const admissionLevelText = data.admission_level.charAt(0).toUpperCase() + 
                            data.admission_level.slice(1);
  
  const content = [
    'We are pleased to inform you that your application for ministerial ' + 
    admissionLevelText.toLowerCase() + ' has',
    'progressed to the interview stage. Your dedication to ministry and theological preparation',
    'has impressed our review committee.',
    '',
    'You are hereby invited to attend an interview session with the ministerial board.',
  ];
  
  content.forEach(line => {
    doc.text(line, 20, yPosition);
    yPosition += 7;
  });
  
  yPosition += 3;
  
  // Interview Details Section
  doc.setFont(fontFamily, 'bold');
  doc.text('INTERVIEW DETAILS:', 20, yPosition);
  yPosition += 5;
  
  doc.setFont(fontFamily, 'normal');
  const details = [
    ['Applicant Name:', data.full_name],
    ['Admission Level:', admissionLevelText],
    ['Church:', data.church_name],
  ];
  
  if (data.interview_date) {
    details.push(['Interview Date:', new Date(data.interview_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })]);
  }
  
  if (data.interview_location) {
    details.push(['Location:', data.interview_location]);
  }
  
  details.forEach(([label, value]) => {
    doc.setFont(fontFamily, 'bold');
    doc.text(label, 25, yPosition);
    doc.setFont(fontFamily, 'normal');
    doc.text(value, 75, yPosition);
    yPosition += 7;
  });
  
  yPosition += 6;
  
  // Instructions
  doc.setFont(fontFamily, 'bold');
  doc.text('WHAT TO BRING:', 20, yPosition);
  yPosition += 5;
  
  doc.setFont(fontFamily, 'normal');
  const instructions = [
    '• Valid identification document',
    '• Original certificates and testimonials',
    '• Copy of your application form',
    '• Any additional supporting documents',
  ];
  
  instructions.forEach(line => {
    doc.text(line, 25, yPosition);
    yPosition += 7;
  });
  
  yPosition += 5;
  
  // Closing
  const closing = [
    'Please confirm your attendance by contacting the office at least 48 hours before',
    'the scheduled date. We look forward to meeting you.',
    '',
    'May God\'s grace be with you as you prepare.',
  ];
  
  closing.forEach(line => {
    doc.text(line, 20, yPosition);
    yPosition += 7;
  });
  
  yPosition += 5;
  
  // Signature section
  if (signatures && signatures.length > 0) {
    const signatureSpacing = signatures.length === 1 ? 0 : 100;
    signatures.forEach((sig, index) => {
      const xPos = 20 + (index * signatureSpacing);
      try {
        doc.addImage(sig.image_url, 'PNG', xPos, yPosition, 50, 15);
        doc.setFontSize(9);
        doc.setFont(fontFamily, 'normal');
        doc.text(sig.name, xPos, yPosition + 20);
        doc.text(sig.role, xPos, yPosition + 25);
      } catch (error) {
        console.error('Error adding signature:', error);
        doc.text(`${sig.name} (${sig.role})`, xPos, yPosition);
      }
    });
    yPosition += 35;
  }
  
  // Footer
  doc.setFontSize(9);
  doc.setFont(fontFamily, 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(footerText, 105, 280, { align: 'center' });
  
  // Save the PDF
  const fileName = `Interview_Letter_${data.full_name.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

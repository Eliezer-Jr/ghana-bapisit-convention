import jsPDF from 'jspdf';

export interface LetterTemplateSettings {
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

export interface SignatureData {
  name: string;
  role: string;
  image_url: string;
}

export const generateSampleLetter = (
  template: LetterTemplateSettings,
  signatures: SignatureData[],
  logoImg: string
) => {
  const doc = new jsPDF();
  
  // Parse colors (expecting "r,g,b" format)
  const primaryColor = template.primary_color.split(',').map(n => parseInt(n.trim())) as [number, number, number];
  const secondaryColor = template.secondary_color.split(',').map(n => parseInt(n.trim())) as [number, number, number];
  
  // Add letterhead
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, template.letterhead_height, 'F');
  
  // Add logo
  try {
    doc.addImage(logoImg, 'PNG', 15, 10, template.logo_width, template.logo_height);
  } catch (error) {
    console.error('Error adding logo:', error);
  }
  
  // Organization name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont(template.font_family, 'bold');
  doc.text(template.organization_name, 105, 20, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont(template.font_family, 'normal');
  doc.text(template.organization_subtitle, 105, 28, { align: 'center' });
  
  // Add sample photo placeholder
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(163, 8, 32, 32, 2, 2, 'F');
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text('PHOTO', 179, 24, { align: 'center' });
  
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
  doc.setFontSize(template.font_size_title);
  doc.setFont(template.font_family, 'bold');
  doc.text('SAMPLE LETTER PREVIEW', 105, 75, { align: 'center' });
  
  // Horizontal line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, 80, 190, 80);
  
  // Body content
  doc.setFontSize(template.font_size_body);
  doc.setFont(template.font_family, 'normal');
  
  let yPosition = 90;
  
  doc.text('Dear [Applicant Name],', 20, yPosition);
  yPosition += 10;
  
  const content = [
    'This is a preview of how your letters will appear with the current template settings.',
    'The actual letter content will be generated based on the application details and status.',
    '',
    'This preview demonstrates:',
    '• The color scheme and typography',
    '• The letterhead layout and dimensions',
    '• The signature placement',
    '• Overall document formatting',
  ];
  
  content.forEach(line => {
    doc.text(line, 20, yPosition);
    yPosition += 7;
  });
  
  yPosition += 15;
  
  // Details section
  doc.setFont(template.font_family, 'bold');
  doc.text('SAMPLE DETAILS:', 20, yPosition);
  yPosition += 8;
  
  doc.setFont(template.font_family, 'normal');
  const details = [
    ['Full Name:', 'John Doe'],
    ['Church:', 'Sample Baptist Church'],
    ['Admission Level:', 'Licensing'],
  ];
  
  details.forEach(([label, value]) => {
    doc.setFont(template.font_family, 'bold');
    doc.text(label, 25, yPosition);
    doc.setFont(template.font_family, 'normal');
    doc.text(value, 75, yPosition);
    yPosition += 7;
  });
  
  yPosition += 15;
  
  // Closing
  const closing = [
    'This preview allows you to verify the appearance before generating actual letters.',
    '',
    'Sincerely,',
  ];
  
  closing.forEach(line => {
    doc.text(line, 20, yPosition);
    yPosition += 7;
  });
  
  yPosition += 10;
  
  // Signature section
  if (signatures && signatures.length > 0) {
    const signatureSpacing = signatures.length === 1 ? 0 : 100;
    signatures.forEach((sig, index) => {
      const xPos = 20 + (index * signatureSpacing);
      try {
        doc.addImage(sig.image_url, 'PNG', xPos, yPosition, 50, 15);
        doc.setFontSize(9);
        doc.setFont(template.font_family, 'normal');
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
  doc.setFont(template.font_family, 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(template.footer_text, 105, 280, { align: 'center' });
  
  return doc;
};

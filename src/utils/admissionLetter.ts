import jsPDF from 'jspdf';
import logoImg from '@/assets/logo-watermark.png';

interface AdmissionLetterData {
  full_name: string;
  phone: string;
  email: string;
  admission_level: string;
  church_name: string;
  association: string;
  sector: string;
  fellowship: string;
  submitted_at?: string;
  date_of_birth?: string;
  photo_url?: string;
}

export const generateAdmissionLetter = (data: AdmissionLetterData) => {
  const doc = new jsPDF();
  
  // Set up colors
  const primaryColor: [number, number, number] = [41, 128, 185]; // Blue
  const secondaryColor: [number, number, number] = [52, 73, 94]; // Dark gray
  
  // Add letterhead
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 45, 'F');
  
  // Add logo (larger and more prominent)
  try {
    doc.addImage(logoImg, 'PNG', 15, 10, 30, 30);
  } catch (error) {
    console.error('Error adding logo:', error);
  }
  
  // Organization name (centered)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Ghana Baptist Convention Conference', 105, 20, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('CONVENTION MINISTERIAL ADMISSION', 105, 28, { align: 'center' });
  
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
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LETTER OF ADMISSION', 105, 75, { align: 'center' });
  
  // Horizontal line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, 80, 190, 80);
  
  // Body content
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  let yPosition = 90;
  
  doc.text('Dear ' + data.full_name + ',', 20, yPosition);
  yPosition += 10;
  
  // Main content
  const admissionLevelText = data.admission_level.charAt(0).toUpperCase() + 
                            data.admission_level.slice(1);
  
  const content = [
    'We are pleased to inform you that your application for ministerial ' + 
    admissionLevelText.toLowerCase() + ' has been',
    'approved by the Ghana Baptist Convention Conference.',
    '',
    'This admission is granted based on your demonstrated commitment to ministry, theological',
    'training, and service to the church. You are hereby recognized to serve in the capacity of',
    admissionLevelText + ' within the Ghana Baptist Convention Conference.',
  ];
  
  content.forEach(line => {
    doc.text(line, 20, yPosition);
    yPosition += 7;
  });
  
  yPosition += 5;
  
  // Applicant Details Section
  doc.setFont('helvetica', 'bold');
  doc.text('APPLICANT DETAILS:', 20, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  const details = [
    ['Full Name:', data.full_name],
    ['Phone Number:', data.phone],
    ['Email:', data.email],
    ['Church:', data.church_name],
    ['Fellowship:', data.fellowship],
    ['Association:', data.association],
    ['Sector:', data.sector],
    ['Admission Level:', admissionLevelText],
  ];
  
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 25, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 75, yPosition);
    yPosition += 7;
  });
  
  yPosition += 10;
  
  // Closing
  const closing = [
    'Please ensure that you adhere to the code of conduct and ministerial guidelines as',
    'outlined by the Ghana Baptist Convention Conference.',
    '',
    'We congratulate you on this achievement and pray for God\'s continued blessing upon',
    'your ministry.',
  ];
  
  closing.forEach(line => {
    doc.text(line, 20, yPosition);
    yPosition += 7;
  });
  
  yPosition += 15;
  
  // Signature section
  doc.setFont('helvetica', 'bold');
  doc.text('_____________________________', 20, yPosition);
  yPosition += 7;
  doc.text('Convention Secretary', 20, yPosition);
  
  doc.text('_____________________________', 120, yPosition - 7);
  yPosition += 7;
  doc.text('Vice President', 120, yPosition);
  
  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('This is an official document of the Ghana Baptist Convention Conference', 105, 280, { align: 'center' });
  
  // Save the PDF
  const fileName = `Admission_Letter_${data.full_name.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

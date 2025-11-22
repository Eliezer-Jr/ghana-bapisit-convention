import jsPDF from 'jspdf';
import logoImg from '@/assets/logo-watermark.png';

interface RejectionLetterData {
  full_name: string;
  phone: string;
  email: string;
  admission_level: string;
  church_name: string;
  rejection_reason?: string;
  photo_url?: string;
}

export const generateRejectionLetter = (data: RejectionLetterData) => {
  const doc = new jsPDF();
  
  // Set up colors
  const primaryColor: [number, number, number] = [41, 128, 185];
  const secondaryColor: [number, number, number] = [52, 73, 94];
  
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
  doc.text('MINISTERIAL ADMISSION', 105, 28, { align: 'center' });
  
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
  doc.text('APPLICATION STATUS NOTIFICATION', 105, 75, { align: 'center' });
  
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
  
  const admissionLevelText = data.admission_level.charAt(0).toUpperCase() + 
                            data.admission_level.slice(1);
  
  const content = [
    'Thank you for your interest in pursuing ministerial ' + admissionLevelText.toLowerCase() + ' with the',
    'Ghana Baptist Convention Conference. We appreciate the time and effort you invested',
    'in completing your application.',
    '',
    'After careful consideration and review of your application, we regret to inform you that',
    'we are unable to approve your application at this time.',
  ];
  
  content.forEach(line => {
    doc.text(line, 20, yPosition);
    yPosition += 7;
  });
  
  yPosition += 5;
  
  // Reason section if provided
  if (data.rejection_reason) {
    doc.setFont('helvetica', 'bold');
    doc.text('FEEDBACK:', 20, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    const reasonLines = doc.splitTextToSize(data.rejection_reason, 170);
    reasonLines.forEach((line: string) => {
      doc.text(line, 25, yPosition);
      yPosition += 7;
    });
    
    yPosition += 5;
  }
  
  // Applicant Details Section
  doc.setFont('helvetica', 'bold');
  doc.text('APPLICATION DETAILS:', 20, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  const details = [
    ['Full Name:', data.full_name],
    ['Church:', data.church_name],
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
    'We encourage you to continue in your ministry and spiritual growth. You may reapply',
    'in the future as you address the areas highlighted in the feedback.',
    '',
    'If you have any questions regarding this decision, please feel free to contact our office.',
    '',
    'May God continue to guide and bless your ministry journey.',
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
  
  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('This is an official document of the Ghana Baptist Convention Conference', 105, 280, { align: 'center' });
  
  // Save the PDF
  const fileName = `Application_Status_${data.full_name.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

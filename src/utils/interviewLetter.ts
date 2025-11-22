import jsPDF from 'jspdf';
import logoImg from '@/assets/logo-watermark.png';

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

export const generateInterviewLetter = (data: InterviewLetterData) => {
  const doc = new jsPDF();
  
  // Set up colors
  const primaryColor: [number, number, number] = [41, 128, 185];
  const secondaryColor: [number, number, number] = [52, 73, 94];
  
  // Add letterhead
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Add logo
  try {
    doc.addImage(logoImg, 'PNG', 15, 8, 25, 25);
  } catch (error) {
    console.error('Error adding logo:', error);
  }
  
  // Organization name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('GOSPEL BELIEVERS CHURCH', 120, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('CONVENTION MINISTERIAL ADMISSION', 120, 30, { align: 'center' });
  
  // Add applicant photo if available
  if (data.photo_url) {
    try {
      doc.addImage(data.photo_url, 'JPEG', 170, 8, 25, 25);
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
  doc.text(today, 20, 55);
  
  // Letter title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERVIEW INVITATION', 105, 70, { align: 'center' });
  
  // Horizontal line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, 75, 190, 75);
  
  // Body content
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  let yPosition = 90;
  
  doc.text('Dear ' + data.full_name + ',', 20, yPosition);
  yPosition += 10;
  
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
  
  yPosition += 5;
  
  // Interview Details Section
  doc.setFont('helvetica', 'bold');
  doc.text('INTERVIEW DETAILS:', 20, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
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
    doc.setFont('helvetica', 'bold');
    doc.text(label, 25, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 75, yPosition);
    yPosition += 7;
  });
  
  yPosition += 10;
  
  // Instructions
  doc.setFont('helvetica', 'bold');
  doc.text('WHAT TO BRING:', 20, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
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
  
  yPosition += 10;
  
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
  doc.text('This is an official document of the Gospel Believers Church Convention', 105, 280, { align: 'center' });
  
  // Save the PDF
  const fileName = `Interview_Letter_${data.full_name.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

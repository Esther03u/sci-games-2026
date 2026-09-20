import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generateRosterPdf({ sportName, teamName, athletes = [], printDate }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header Title
  doc.setFontSize(18);
  doc.text('Sci Games 2026 - PKRU', 105, 18, { align: 'center' });

  doc.setFontSize(12);
  doc.text('Faculty of Science and Technology, Phuket Rajabhat University', 105, 25, { align: 'center' });

  // Metadata details
  doc.setFontSize(11);
  doc.text(`Sport: ${sportName || 'All'}`, 14, 38);
  doc.text(`Team: ${teamName || 'All'}`, 14, 45);
  doc.text(`Total Athletes: ${athletes.length} persons`, 14, 52);
  doc.text(`Printed: ${printDate || new Date().toLocaleDateString('th-TH')}`, 140, 52);

  // Table
  const tableRows = athletes.map((a, i) => [
    i + 1,
    a.student_id || '-',
    a.full_name || '-',
    a.departments?.name || a.department_name || '-',
    '', // Signature blank space for verification in the match field
  ]);

  doc.autoTable({
    startY: 58,
    head: [['No.', 'Student ID', 'Full Name', 'Department', 'Signature']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [39, 39, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 55 },
      3: { cellWidth: 45 },
      4: { cellWidth: 35, halign: 'center' },
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 248, 250],
    },
    didDrawPage: (data) => {
      // Footer page number
      doc.setFontSize(9);
      doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
    },
  });

  return doc;
}

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { GeneratedExamPaper } from '../types/paper';

/**
 * Direct 1-Click PDF Downloader for Exam Papers
 * Renders the exact DOM paper element into standard multi-page A4 PDF
 * and initiates automatic browser download of a .pdf file.
 */
export async function exportPaperToPdf(
  paper: GeneratedExamPaper,
  targetElementId: string = 'exam-paper-container',
  onProgress?: (status: string) => void
): Promise<boolean> {
  const element = document.getElementById(targetElementId);
  if (!element) {
    console.error(`Target element with id "${targetElementId}" not found for PDF export.`);
    // Fallback to window print
    window.print();
    return false;
  }

  try {
    if (onProgress) onProgress('Capturing high-resolution exam sheet...');

    // Wait a brief moment to ensure fonts & layouts are settled
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Standard A4 dimensions in mm: 210 x 297
    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 8; // Optimized to 8mm for full standard printable area
    const marginY = 8;
    const contentWidth = pageWidth - (marginX * 2); // 194mm
    const usablePageHeight = pageHeight - (marginY * 2); // 281mm

    // Capture element with html2canvas at 2x scale for sharp, crisp print resolution.
    // Use onclone to normalize width to standard A4 ratio (794px = 210mm at 96 DPI) so desktop screens don't produce side gutters
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollY: 0,
      scrollX: 0,
      onclone: (clonedDoc) => {
        // Ensure cloned document body has zero padding/margin and full width
        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';
        clonedDoc.body.style.width = '100%';

        // Hide navigation, sidebar, headers
        const toHide = clonedDoc.querySelectorAll('nav, aside, header, .no-print');
        toHide.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });

        const clonedEl = clonedDoc.getElementById(targetElementId);
        if (clonedEl) {
          clonedEl.style.width = '794px';
          clonedEl.style.maxWidth = '794px';
          clonedEl.style.minWidth = '794px';
          clonedEl.style.padding = '6px 8px';
          clonedEl.style.margin = '0 auto';
          clonedEl.style.boxSizing = 'border-box';
          // Ensure all tables, grids, and headings use 100% width
          const tables = clonedEl.querySelectorAll('table');
          tables.forEach((t) => {
            (t as HTMLElement).style.width = '100%';
          });
        }
      },
    });

    if (onProgress) onProgress('Compiling A4 PDF pages...');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pxPageHeight = Math.floor((usablePageHeight / contentWidth) * canvas.width);
    const totalPages = Math.max(1, Math.ceil(canvas.height / pxPageHeight));

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      const sY = page * pxPageHeight;
      const sHeight = Math.min(pxPageHeight, canvas.height - sY);

      // Create a dedicated slice canvas for this exact A4 page
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sHeight;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, sY, canvas.width, sHeight, 0, 0, canvas.width, sHeight);
      }

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
      const renderedHeightMm = (sHeight * contentWidth) / canvas.width;
      pdf.addImage(pageImgData, 'JPEG', marginX, marginY, contentWidth, renderedHeightMm, undefined, 'FAST');
    }

    if (onProgress) onProgress('Downloading PDF file...');

    const cleanSubject = (paper.header.subjectName || 'Paper').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanClass = paper.header.classLevel || '9th';
    const fileName = `${cleanClass}_Class_${cleanSubject}_Exam_Paper.pdf`;

    pdf.save(fileName);

    if (onProgress) onProgress('Download complete!');
    return true;
  } catch (error) {
    console.warn('Direct PDF export encountered an error, falling back to print dialog:', error);
    const prevTitle = document.title;
    const cleanSubject = (paper.header.subjectName || 'Paper').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanClass = paper.header.classLevel || '9th';
    document.title = `${cleanClass}_Class_${cleanSubject}_Exam_Paper`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
    return false;
  }
}

/**
 * Direct 1-Click PDF Downloader for Answer Key & Solution Rubrics
 */
export async function exportAnswerKeyToPdf(
  paper: GeneratedExamPaper,
  targetElementId: string = 'answer-key-content',
  onProgress?: (status: string) => void
): Promise<boolean> {
  const element = document.getElementById(targetElementId);
  if (!element) {
    console.error(`Target element with id "${targetElementId}" not found for Answer Key PDF export.`);
    window.print();
    return false;
  }

  try {
    if (onProgress) onProgress('Capturing Answer Key pages...');
    await new Promise((resolve) => setTimeout(resolve, 150));

    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 8;
    const marginY = 8;
    const contentWidth = pageWidth - (marginX * 2);
    const usablePageHeight = pageHeight - (marginY * 2);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollY: 0,
      scrollX: 0,
      onclone: (clonedDoc) => {
        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';
        clonedDoc.body.style.width = '100%';
        const clonedEl = clonedDoc.getElementById(targetElementId);
        if (clonedEl) {
          clonedEl.style.width = '794px';
          clonedEl.style.maxWidth = '794px';
          clonedEl.style.minWidth = '794px';
          clonedEl.style.padding = '6px 8px';
          clonedEl.style.margin = '0 auto';
          clonedEl.style.boxSizing = 'border-box';
        }
      },
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pxPageHeight = Math.floor((usablePageHeight / contentWidth) * canvas.width);
    const totalPages = Math.max(1, Math.ceil(canvas.height / pxPageHeight));

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      const sY = page * pxPageHeight;
      const sHeight = Math.min(pxPageHeight, canvas.height - sY);

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sHeight;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, sY, canvas.width, sHeight, 0, 0, canvas.width, sHeight);
      }

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
      const renderedHeightMm = (sHeight * contentWidth) / canvas.width;
      pdf.addImage(pageImgData, 'JPEG', marginX, marginY, contentWidth, renderedHeightMm, undefined, 'FAST');
    }

    const cleanSubject = (paper.header.subjectName || 'Paper').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanClass = paper.header.classLevel || '9th';
    const fileName = `${cleanClass}_Class_${cleanSubject}_Answer_Key.pdf`;

    pdf.save(fileName);
    if (onProgress) onProgress('Download complete!');
    return true;
  } catch (err) {
    console.warn('PDF Answer Key export fallback to print:', err);
    window.print();
    return false;
  }
}

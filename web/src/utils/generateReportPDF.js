
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const fetchImageAsBase64 = async (url) => {
  try {
    // Append the auth token to ensure there are no permission blocks if accessed across roles
    const token = localStorage.getItem('auth_token');
    const urlWithToken = token ? `${url}${url.includes('?') ? '&' : '?'}token=${token}` : url;
    
    const response = await fetch(urlWithToken, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      mode: 'cors'
    });

    if (!response.ok) {
      console.warn(`Failed to fetch logo image: ${response.status} ${response.statusText}`);
      return null; // Return null gracefully to prevent breaking the PDF execution
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image as base64:', error);
    return null;
  }
};

export const generateReportPDF = async (report, companySettings, refs) => {
  // We use our own dynamic pagination for photos, so we ignore photosAndSignaturesRef & photosRef
  const { coverRef, clientEquipRef, infraElecBatRef, descRef, signaturesRef } = refs;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = 210;

  // Pre-fetch the logo to use natively in the PDF headers with robust error handling
  let cachedLogo = null;
  try {
    // Usando logo local do projeto
    const logoUrl = '/logo-fattax.png';
    cachedLogo = await fetchImageAsBase64(logoUrl);
  } catch (error) {
    console.error('Error extracting or caching logo URL:', error);
    cachedLogo = null; // Ensure fallback path triggers
  }

  // Helper to securely capture a DOM element and map it onto the PDF without overlapping native Headers/Footers
  const captureAndAddPage = async (ref, addPage = true, isFirstPage = false, isClientEquip = false) => {
    if (!ref.current) return;
    
    // Backup original styles
    const originalPaddingTop = ref.current.style.paddingTop;
    const originalPaddingBottom = ref.current.style.paddingBottom;
    const originalClassName = ref.current.className;
    
    // Force desktop layout for PDF generation
    ref.current.classList.add('pdf-desktop-layout');
    
    // Enforce safe zones for the new native header and footer
    if (!isFirstPage) {
      ref.current.style.paddingTop = '35mm'; 
    }
    ref.current.style.paddingBottom = '25mm';

    let existingHeader = null;
    let originalHeaderDisplay = '';
    if (isClientEquip) {
      // Hide the HTML header on this page so we don't duplicate it with our jsPDF identical header
      existingHeader = ref.current.querySelector('.flex.justify-between.items-start');
      if (existingHeader) {
        originalHeaderDisplay = existingHeader.style.display;
        existingHeader.style.display = 'none';
      }
    }

    const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, logging: false });
    
    // Restore original styles immediately
    ref.current.style.paddingTop = originalPaddingTop;
    ref.current.style.paddingBottom = originalPaddingBottom;
    ref.current.classList.remove('pdf-desktop-layout');
    if (existingHeader) {
      existingHeader.style.display = originalHeaderDisplay;
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    if (addPage) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
  };

  // PAGE 1: Cover Page
  await captureAndAddPage(coverRef, false, true, false);

  // PAGES 2, 3, 4
  await captureAndAddPage(clientEquipRef, true, false, true);
  await captureAndAddPage(infraElecBatRef, true, false, false);
  await captureAndAddPage(descRef, true, false, false);

  // DYNAMIC PAGES: Photo Pagination Logic (CRITICAL)
  const photos = report.fetched_photos || [];
  const totalPhotos = photos.length;
  let signaturesIncluded = false;
  let currentIdx = 0;
  const maxPerPage = 15; // Set to strictly 15 images maximum per page

  const generatePhotoSignaturesPages = async () => {
    while (currentIdx < totalPhotos || currentIdx === 0) {
      const chunk = photos.slice(currentIdx, currentIdx + maxPerPage);
      const isLastPhotoPage = (currentIdx + maxPerPage) >= totalPhotos;
      
      let includeSignatures = false;
      // CRITICAL PAGINATION RULE:
      // If total images <= 15: It fits images + signatures on the SAME page.
      // If total images > 15: A page fitting 15 images cannot fit signatures unless the remaining chunk is < 15.
      if (isLastPhotoPage && (chunk.length < maxPerPage || totalPhotos <= maxPerPage)) {
        includeSignatures = true;
        signaturesIncluded = true;
      }

      // Construct a pristine, hidden DOM grid for just this chunk
      const container = document.createElement('div');
      container.style.width = '210mm';
      container.style.minHeight = '297mm';
      container.style.backgroundColor = 'white';
      container.style.padding = '35mm 12mm 25mm 12mm'; // Clear space for header & footer
      container.style.boxSizing = 'border-box';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.fontFamily = 'sans-serif';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';

      if (chunk.length > 0) {
        const photosSection = document.createElement('section');
        photosSection.style.border = '1px solid #e5e7eb';
        photosSection.style.borderRadius = '0.5rem';
        photosSection.style.overflow = 'hidden';
        photosSection.style.marginBottom = includeSignatures ? '16px' : '0';
        photosSection.style.flexShrink = '0';

        const header = document.createElement('h2');
        header.style.borderBottom = '1px solid #000';
        header.style.padding = '8px';
        header.style.fontSize = '14px';
        header.style.fontWeight = 'bold';
        header.style.textTransform = 'uppercase';
        header.style.backgroundColor = '#FFD700';
        header.style.color = '#000';
        header.style.margin = '0';
        header.innerText = 'Fotos';
        photosSection.appendChild(header);

        const grid = document.createElement('div');
        grid.style.padding = '12px';
        grid.style.backgroundColor = 'white';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.gap = '12px';

        for (const p of chunk) {
          const item = document.createElement('div');
          item.style.border = '1px solid #e5e7eb';
          item.style.padding = '8px';
          item.style.borderRadius = '0.375rem';
          item.style.display = 'flex';
          item.style.flexDirection = 'column';
          item.style.alignItems = 'center';
          item.style.boxShadow = '0 1px 2px 0 rgba(0,0,0,0.05)';

          const imgWrapper = document.createElement('div');
          imgWrapper.style.width = '100%';
          imgWrapper.style.height = '200px';
          imgWrapper.style.display = 'flex';
          imgWrapper.style.alignItems = 'center';
          imgWrapper.style.justifyContent = 'center';
          
          const img = document.createElement('img');
          img.crossOrigin = 'anonymous';
          img.src = p.url;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
          img.style.objectFit = 'contain';
          
          imgWrapper.appendChild(img);
          item.appendChild(imgWrapper);

          if (p.comment) {
            const text = document.createElement('p');
            text.style.fontSize = '10px';
            text.style.color = '#374151';
            text.style.marginTop = '6px';
            text.style.textAlign = 'center';
            text.style.lineHeight = '1.2';
            text.innerText = p.comment;
            item.appendChild(text);
          }
          grid.appendChild(item);
        }
        photosSection.appendChild(grid);
        container.appendChild(photosSection);
      }

      if (includeSignatures && signaturesRef?.current) {
        const sigClone = signaturesRef.current.cloneNode(true);
        sigClone.style.marginTop = 'auto'; // Pin to bottom if there's available space
        container.appendChild(sigClone);
      }

      document.body.appendChild(container);

      const images = container.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve; // Continue execution cleanly even if an image fails
        });
      }));

      const canvas = await html2canvas(container, { scale: 3, useCORS: true, logging: false });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);

      currentIdx += maxPerPage;
      if (currentIdx >= totalPhotos && totalPhotos > 0) break;
      if (totalPhotos === 0) break;
    }

    // Explicit standalone Signatures page if it didn't safely fit with the previous image chunk
    if (!signaturesIncluded) {
      const container = document.createElement('div');
      container.style.width = '210mm';
      container.style.minHeight = '297mm';
      container.style.backgroundColor = 'white';
      container.style.padding = '35mm 12mm 25mm 12mm';
      container.style.boxSizing = 'border-box';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      
      if (signaturesRef?.current) {
        const sigClone = signaturesRef.current.cloneNode(true);
        container.appendChild(sigClone);
      }

      document.body.appendChild(container);
      
      const images = container.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const canvas = await html2canvas(container, { scale: 3, useCORS: true, logging: false });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
    }
  };

  await generatePhotoSignaturesPages();

  // GLOBAL HEADER AND FOOTER OVERLAY (Applies Identical Features Across Output)
  const totalPagesCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPagesCount; i++) {
    pdf.setPage(i);
    
    // --- FOOTER (All Pages including Cover) ---
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 275, 210, 22, 'F'); // Wipe clean bottom to avoid bleeding
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    const cx = 105;
    pdf.text('Rua. Dr. Ratisbona, 410 – Fátima – Fortaleza – CE – 60.411-220', cx, 280, { align: 'center' });
    pdf.text('Fones: (85) 3021-0003  3256-6989  Cel: (85) 9-9212-1887 / 9-9112-2782', cx, 284, { align: 'center' });
    pdf.text('CNPJ: 35.000.744/0001-90 / IE: 06.278.138-3', cx, 288, { align: 'center' });
    pdf.text('E-mail: fattax@fattax.srv.br', cx, 292, { align: 'center' });
    pdf.text('Site: www.fattax.srv.br', cx, 296, { align: 'center' });

    // --- HEADER (All Pages EXCEPT Cover) ---
    if (i > 1) {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 210, 34, 'F'); // Wipe clean top to assure strict identical header
      
      if (cachedLogo) {
        pdf.addImage(cachedLogo, 'PNG', 12, 8, 30, 20, undefined, 'FAST');
      }
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('FATTAX - NOBREAKS E ESTABILIZADORES DE TENSÃO', 46, 16);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('ATIVAÇÃO', 46, 22);
      
      pdf.setFontSize(8);
      const rightX = 198;
      pdf.setFont('helvetica', 'bold');
      pdf.text('DOCUMENTO OFICIAL', rightX, 14, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      const osText = `O.S.: ${report.service_order_number || '-'}`;
      pdf.text(osText, rightX, 19, { align: 'right' });
      const dateText = `Data: ${report.created_date ? new Date(report.created_date).toLocaleDateString('pt-BR') : report.attendance_date_time ? new Date(report.attendance_date_time).toLocaleDateString('pt-BR') : '-'}`;
      pdf.text(dateText, rightX, 24, { align: 'right' });
      
      // Red horizontal line separator
      pdf.setDrawColor(227, 30, 36);
      pdf.setLineWidth(0.5);
      pdf.line(12, 30, 198, 30);
    }
  }

  const client = {
    name: report.client_name,
    fantasy_name: report.client_fantasy_name,
    cnpj_cpf: report.client_cnpj
  };
  const safeClientName = (client.name || '').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toUpperCase();
  const safeOs = (report.service_order_number || report.id).replace(/[^a-zA-Z0-9-]/g, '_');
  
  pdf.save(`${safeOs}_${safeClientName}.pdf`);
};

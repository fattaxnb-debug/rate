import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateProposalPDF(proposalElement, proposalData) {
  try {
    console.log('[PDF DEBUG] Starting PDF generation for proposal');
    
    // Criar canvas do elemento HTML
    const canvas = await html2canvas(proposalElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    console.log('[PDF DEBUG] Canvas created:', canvas.width, 'x', canvas.height);

    // Criar PDF
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Alturas do cabeçalho e rodapé em mm
    const headerHeight = 35;
    const footerHeight = 20;
    const contentTop = headerHeight;
    const contentBottom = pdfHeight - footerHeight;
    const availableContentHeight = contentBottom - contentTop;

    console.log('[PDF DEBUG] PDF dimensions:', pdfWidth, 'x', pdfHeight);
    console.log('[PDF DEBUG] Content area:', contentTop, 'to', contentBottom, '(height:', availableContentHeight, ')');

    // Calcular proporção para ajustar largura do canvas à largura do PDF
    const scale = pdfWidth / canvasWidth;
    const scaledCanvasHeight = canvasHeight * scale;

    console.log('[PDF DEBUG] Scaled canvas height:', scaledCanvasHeight);

    let pageCount = 0;
    let currentY = 0; // Posição no canvas (em pixels)

    // Converter altura disponível do PDF para pixels do canvas
    const availablePixels = availableContentHeight / scale;

    while (currentY < canvasHeight) {
      pageCount++;
      console.log('[PDF DEBUG] Processing page', pageCount, 'at canvas Y:', currentY);

      // Criar um canvas temporário para esta "fatia"
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvasWidth;
      
      // Calcular altura desta fatia
      const remainingHeight = canvasHeight - currentY;
      const sliceHeight = Math.min(availablePixels, remainingHeight);
      sliceCanvas.height = sliceHeight;

      console.log('[PDF DEBUG] Slice height (pixels):', sliceHeight, 'remaining:', remainingHeight);

      // Desenhar a fatia do canvas original no canvas temporário
      const ctx = sliceCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      
      // Copiar a parte correspondente do canvas original
      ctx.drawImage(
        canvas,
        0, currentY, canvasWidth, sliceHeight, // source
        0, 0, canvasWidth, sliceHeight          // destination
      );

      // Converter para imagem
      const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);

      // Adicionar nova página se não for a primeira
      if (pageCount > 1) {
        pdf.addPage();
      }

      // Adicionar cabeçalho
      addHeader(pdf, proposalData, pdfWidth);

      // Calcular altura da imagem no PDF
      const sliceHeightInPdf = sliceHeight * scale;
      
      // Adicionar a imagem da fatia
      pdf.addImage(sliceData, 'JPEG', 0, contentTop, pdfWidth, sliceHeightInPdf);

      // Adicionar rodapé
      addFooter(pdf, pageCount, pdfWidth, pdfHeight);

      // Avançar para a próxima fatia
      currentY += sliceHeight;
    }

    console.log('[PDF DEBUG] Total pages:', pageCount);

    // Baixar PDF com nome correto
    const clientName = proposalData?.client_name || 'cliente';
    const proposalNumber = proposalData?.proposal_number || 'sem-numero';
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const fileName = `proposta_${proposalNumber}_${sanitizedClientName}.pdf`;
    pdf.save(fileName);

    console.log('[PDF DEBUG] PDF saved:', fileName);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Função para adicionar cabeçalho
function addHeader(pdf, proposalData, pdfWidth) {
  // Logo no canto esquerdo — ocupa y=5 até y=30 (altura 25mm)
  const logoUrl = '/fattax-perfil.png';
  pdf.addImage(logoUrl, 'PNG', 10, 5, 25, 25);

  // Centro vertical do cabeçalho: 5 + 25/2 = 17.5mm
  const centerY = 17.5;

  // Título centralizado verticalmente no meio do cabeçalho
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PROPOSTA TÉCNICA', pdfWidth / 2, centerY, { align: 'center', baseline: 'middle' });

  // Número e data à direita, centralizados verticalmente
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Prop. ${proposalData?.proposal_number || 'N/A'}`, pdfWidth - 10, centerY - 3, { align: 'right' });
  pdf.text(`Data: ${proposalData?.proposal_date || 'N/A'}`, pdfWidth - 10, centerY + 4, { align: 'right' });

  // Linha separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(10, 32, pdfWidth - 10, 32);
}

// Função para adicionar rodapé
function addFooter(pdf, pageNum, pdfWidth, pdfHeight) {
  const footerY = pdfHeight - 15;

  // Linha separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(10, footerY, pdfWidth - 10, footerY);

  // Informações da empresa (iguais ao relatório)
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);

  pdf.text('Rua Dr. Ratisbona, 410 – Fátima – Fortaleza – CE – 60.411-220 | Fones: (85) 3021-0003 / 3256-6989 | Cel: (85) 9-9212-1887', pdfWidth / 2, footerY + 4, { align: 'center' });
  pdf.text('CNPJ: 33.800.714/0001-90 / IE: 06.378.183 | E-mail: fattax@fattax.srv.br | Site: www.fattax.srv.br', pdfWidth / 2, footerY + 8, { align: 'center' });

  // Número da página
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Página ${pageNum}`, pdfWidth - 15, footerY + 4, { align: 'center' });
}

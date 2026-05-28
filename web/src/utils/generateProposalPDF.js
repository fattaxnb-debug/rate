import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateProposalPDF(proposalElement, proposalData) {
  try {
    // Criar canvas do elemento HTML
    const canvas = await html2canvas(proposalElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Criar PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = pdfWidth / imgWidth;
    const imgHeightInPdf = imgHeight * ratio;

    let heightLeft = imgHeightInPdf;
    let position = 0;
    let pageCount = 0;

    // Função para adicionar cabeçalho
    const addHeader = () => {
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
    };

    // Função para adicionar rodapé
    const addFooter = (pageNum) => {
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
    };

    // Adicionar conteúdo com cabeçalho e rodapé
    const contentHeight = imgHeightInPdf;
    const headerHeight = 35;
    const footerHeight = 20;
    const availableHeight = pdfHeight - headerHeight - footerHeight;

    let contentPosition = headerHeight;

    while (heightLeft > 0) {
      pageCount++;

      // Adicionar cabeçalho
      addHeader();

      // Adicionar parte do conteúdo
      const contentSliceHeight = Math.min(availableHeight, heightLeft);
      const sliceY = position + (pageCount > 1 ? (pageCount - 1) * availableHeight : 0);

      pdf.addImage(imgData, 'JPEG', 0, contentPosition, pdfWidth, contentSliceHeight, sliceY);

      // Adicionar rodapé
      addFooter(pageCount);

      heightLeft -= availableHeight;
      position += availableHeight;

      if (heightLeft > 0) {
        pdf.addPage();
        contentPosition = headerHeight;
      }
    }

    // Baixar PDF com nome correto
    const clientName = proposalData?.client_name || 'cliente';
    const proposalNumber = proposalData?.proposal_number || 'sem-numero';
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const fileName = `proposta_${proposalNumber}_${sanitizedClientName}.pdf`;
    pdf.save(fileName);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

export const compressImage = (file, maxSizeKB = 300, options = {}) => {
  const { 
    maxDimension = 1920,  // Aumentado para 1920px (boa qualidade para zoom no PDF)
    minQuality = 0.65,     // Qualidade mínima aceitável
    initialQuality = 0.85  // Qualidade inicial (bom equilíbrio tamanho/qualidade)
  } = options;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Redimensionar mantendo aspect ratio (1920px no maior lado)
        if (width > height && width > maxDimension) {
          height = Math.round(height * maxDimension / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round(width * maxDimension / height);
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Usar melhor qualidade de renderização
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Calcular tamanho aproximado em KB
        const getKbSize = (dataUrlStr) => {
          const strLength = dataUrlStr.length - 'data:image/jpeg;base64,'.length;
          const sizeInBytes = 4 * Math.ceil((strLength / 3)) * 0.5624896334383812;
          return sizeInBytes / 1024;
        };

        // Ajustar qualidade com passos menores (0.05) para melhor equilíbrio
        let quality = initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Se ainda grande, reduz qualidade em passos menores
        while (getKbSize(dataUrl) > maxSizeKB && quality > minQuality) {
          quality -= 0.05;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Converter de volta para Blob/File
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        
        // Manter nome original mas adicionar indicador de compressão
        const fileName = file.name.replace(/\.[^/.]+$/, '') + '_compressed.jpg';
        const compressedFile = new File([blob], fileName, { type: 'image/jpeg' });

        console.log(`📸 Imagem comprimida: ${file.size / 1024}KB → ${compressedFile.size / 1024}KB (${Math.round(compressedFile.size / file.size * 100)}%) | Dim: ${width}x${height} | Qual: ${Math.round(quality * 100)}%`);

        resolve({ 
          file: compressedFile, 
          dataUrl,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          dimensions: { width, height },
          quality
        });
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// Função específica para fotos de relatório (qualidade padrão)
export const compressReportPhoto = (file) => {
  return compressImage(file, 300, { 
    maxDimension: 1920,  // Boa para zoom no PDF
    initialQuality: 0.85,
    minQuality: 0.65
  });
};

// Função para alta qualidade (quando o usuário quer melhor definição)
export const compressHighQuality = (file) => {
  return compressImage(file, 500, { 
    maxDimension: 2560,  // Mais alta resolução
    initialQuality: 0.90,
    minQuality: 0.75
  });
};
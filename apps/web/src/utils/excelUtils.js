import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export function formatClientForExport(client) {
  return {
    'Nome/Razão Social': client.name || '',
    'CNPJ/CPF': client.cnpj_cpf || '',
    'IE': client.ie || '',
    'Endereço': client.address || '',
    'Número': client.number || '',
    'Complemento': client.complement || '',
    'Cidade': client.city || '',
    'Estado': client.state || '',
    'CEP': client.zip_code || '',
    'Telefone': client.phone || '',
    'Celular': client.mobile || '',
    'E-mail': client.email || '',
    'Contato Técnico': client.technical_contact || ''
  };
}

export function exportClientsToExcel(clients) {
  const formatted = clients.map(formatClientForExport);
  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
  
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const fileName = `clientes_FATTAX_${dateStr}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
}

function findValue(row, keywords) {
  const keys = Object.keys(row);
  for (const key of keys) {
    const upperKey = key.toUpperCase();
    if (keywords.some(kw => upperKey.includes(kw))) {
      return String(row[key] || '').replace(/[\r\n]+/g, ' ').trim();
    }
  }
  return '';
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        const processedRows = json.map(row => {
          return {
            original: row,
            ...validateClientData(row)
          };
        });
        
        resolve(processedRows);
      } catch (err) {
        reject(new Error('Falha ao processar o arquivo Excel. Verifique se o formato é válido.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro na leitura do arquivo.'));
    reader.readAsArrayBuffer(file);
  });
}

export function validateClientData(row) {
  const name = findValue(row, ['NOME', 'RAZÃO SOCIAL']);
  const cnpj_cpf = findValue(row, ['CPF', 'CNPJ']);
  const ie = findValue(row, ['RG', 'INSCRIÇÃO']);
  const phone = findValue(row, ['TELEFONE', 'FONE']);
  const mobile = findValue(row, ['CELULAR']);
  const rawEmail = findValue(row, ['EMAIL', 'E-MAIL']);
  const address = findValue(row, ['ENDEREÇO', 'LOGRADOURO']);
  const number = findValue(row, ['NÚMERO']);
  const complement = findValue(row, ['COMPLEMENTO']);
  const zip_code = findValue(row, ['CEP']);
  const neighborhood = findValue(row, ['BAIRRO']);
  const city = findValue(row, ['CIDADE']);
  const state = findValue(row, ['UF', 'ESTADO']);
  const technical_contact = findValue(row, ['CONTATO', 'PESSOA DE CONTATO']);

  // Handle email validity quietly: if invalid format, clear it so PB accepts the record
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const email = (rawEmail && emailRegex.test(rawEmail)) ? rawEmail : '';

  const digitsOnly = cnpj_cpf.replace(/[^\d]/g, '');
  let type = '-';
  if (digitsOnly.length === 11) {
    type = 'P. FÍSICA';
  } else if (digitsOnly.length === 14) {
    type = 'P. JURÍDICA';
  }

  // Very lenient validation: only require a name
  const isValid = name.length > 0;
  const errors = isValid ? [] : ['Nome vazio'];

  const mappedData = {
    name,
    cnpj_cpf, // Passed as-is, can be duplicate or empty
    ie,
    phone,
    mobile,
    email, // Valid email or empty string
    address,
    number,
    complement,
    zip_code,
    neighborhood,
    city,
    state,
    technical_contact
  };

  return {
    isValid,
    errors,
    type,
    mappedData
  };
}
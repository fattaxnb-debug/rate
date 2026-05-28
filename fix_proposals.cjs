const fs = require('fs');

const filePath = 'd:\\\\TIAGO\\\\@RAT\\\\src\\\\routes\\\\proposals.js';
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);
  if (i > 0 && lines[i-1].includes('}') && lines[i].trim() === '// Inserir proposta') {
    newLines.push('');
    newLines.push('    // Converter proposal_date de dd/mm/yyyy para yyyy-mm-dd');
    newLines.push('    let proposalDate = proposal_date || null;');
    newLines.push('    if (proposalDate && proposalDate.includes(\\'/\\')) {');
    newLines.push('      const parts = proposalDate.split(\\'/\\');');
    newLines.push('      if (parts.length === 3) proposalDate = \\-\\-\\;');
    newLines.push('    }');
  }
}

fs.writeFileSync(filePath, newLines.join('\\n'), 'utf8');
console.log('Arquivo atualizado com sucesso');

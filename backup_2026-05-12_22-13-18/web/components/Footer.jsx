import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-2xl font-bold text-primary mb-4 block" style={{ letterSpacing: '-0.02em' }}>FATTAX</span>
            <p className="text-sm">Nobreak & Estabilizadores</p>
            <p className="text-sm mt-2">Soluções completas em energia e manutenção de equipamentos elétricos.</p>
          </div>
          
          <div>
            <span className="font-semibold mb-4 block text-foreground">Contato & Endereço</span>
            <p className="text-sm mb-2">Rua Dr. Ratisbona 410, Fátima</p>
            <p className="text-sm mb-2">Fortaleza - CE, 60411-220</p>
            <p className="text-sm mb-2">Tel: (85) 3021-0003 / 3256-6989</p>
            <p className="text-sm mb-2">Cel: (85) 99969-2167</p>
            <p className="text-sm">fattax@fattax.srv.br</p>
          </div>
          
          <div>
            <span className="font-semibold mb-4 block text-foreground">Informações Legais</span>
            <p className="text-sm mb-2">CNPJ: 35.000.744/0001-90</p>
            <a href="https://fattax.srv.br" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary transition-colors">
              fattax.srv.br
            </a>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} FATTAX. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
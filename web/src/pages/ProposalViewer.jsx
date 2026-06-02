import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Printer, Edit, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api.js';
import Header from '@/components/Header.jsx';
import { generateProposalPDF } from '@/utils/generateProposalPDF.js';

export default function ProposalViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const isGeneratingRef = useRef(false);
  const proposalRef = useRef(null);
  const [colorMode, setColorMode] = useState('color');

  // Cores iguais ao relatório
  const sectionTitleColor = '#000000';
  const sectionBgColor = colorMode === 'color' ? '#FFD700' : '#f5f5f5';
  const sectionBorderColor = colorMode === 'color' ? '#E31E24' : '#000000';

  // Obter usuário logado
  const [loggedUser, setLoggedUser] = useState(null);
  const [creatorName, setCreatorName] = useState(null);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setLoggedUser(user);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  // Definir cargo baseado no nome do criador da proposta
  useEffect(() => {
    if (proposal && proposal.creator_name) {
      const userName = proposal.creator_name.toUpperCase();
      if (userName.includes('GERENTE FATTAX') || userName.includes('FATTAX')) {
        setUserRole('FATTAX - NOBREAKS E ESTABILIZADORES');
      } else if (userName.includes('TIAGO VIANA')) {
        setUserRole('CONSULTOR TÉCNICO-COMERCIAL');
      } else if (userName.includes('TITO LIVIO')) {
        setUserRole('ENG. ELETRICISTA');
      }
      setCreatorName(proposal.creator_name);
    }
  }, [proposal]);

  useEffect(() => {
    fetchProposal();
  }, [id]);

  const fetchProposal = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/proposals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProposal(response.data.data);
    } catch (error) {
      console.error('Error fetching proposal:', error);
      toast.error('Erro ao carregar proposta');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = async () => {
    // Proteção contra duplo clique usando ref
    if (isGeneratingRef.current || generatingPdf) {
      console.log('[PDF DEBUG] Generation already in progress, skipping');
      return;
    }

    if (!proposalRef.current) {
      toast.error('Não foi possível gerar o PDF');
      return;
    }

    isGeneratingRef.current = true;
    setGeneratingPdf(true);
    toast.info('Gerando PDF, aguarde...');

    try {
      console.log('[PDF DEBUG] Starting PDF generation');
      await generateProposalPDF(proposalRef.current, proposal);
      console.log('[PDF DEBUG] PDF generation completed');
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      isGeneratingRef.current = false;
      setGeneratingPdf(false);
      console.log('[PDF DEBUG] PDF generation finished, state reset');
    }
  };

  const handleEdit = () => {
    navigate(`/proposals`);
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <div className="text-center py-8">Carregando proposta...</div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <div className="text-center py-8">Proposta não encontrada</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
      {/* Botões de Ação - Não aparecerão na impressão */}
      <div className="no-print mb-4 flex gap-2">
        <Button variant="outline" onClick={() => navigate('/proposals')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
        <Button onClick={handleGeneratePDF} disabled={generatingPdf}>
          <Download className="h-4 w-4 mr-2" />
          {generatingPdf ? 'Gerando...' : 'Baixar PDF'}
        </Button>
        <Button variant="outline" onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Documento da Proposta - Será impresso */}
      <div ref={proposalRef} className="bg-white print:shadow-none shadow-lg" style={{ pageBreakInside: 'avoid' }}>
        {/* CSS para impressão - Quebra de página inteligente */}
        <style>{`
          @media print {
            .proposal-section {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .proposal-row {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}</style>

        {/* Seção Cliente */}
        <div className="proposal-section mb-2">
          <h2 className="border-b p-1.5 text-xs font-black uppercase tracking-wide" style={{
            backgroundColor: sectionBgColor,
            borderColor: sectionBorderColor,
            color: sectionTitleColor,
            lineHeight: '1.2'
          }}>CLIENTE</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 px-2 py-1 text-xs">
            <div className="col-span-2 proposal-row">
              <span className="font-semibold">Nome/Razão Social:</span> {proposal.client_name}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">CNPJ:</span> {proposal.client_cnpj || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Telefone:</span> {proposal.client_phone || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Celular:</span> {proposal.client_mobile || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">E-mail:</span> {proposal.client_email || '-'}
            </div>
            <div className="col-span-2 proposal-row">
              <span className="font-semibold">Contato:</span> {proposal.client_contact || '-'}
            </div>
          </div>
        </div>

        {/* Seção Marca/Modelo */}
        <div className="proposal-section mb-2">
          <h2 className="border-b p-1.5 text-xs font-black uppercase tracking-wide" style={{
            backgroundColor: sectionBgColor,
            borderColor: sectionBorderColor,
            color: sectionTitleColor,
            lineHeight: '1.2'
          }}>MARCA/MODELO</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 px-2 py-1 text-xs">
            <div className="proposal-row">
              <span className="font-semibold">Marca:</span> {proposal.brand || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Linha:</span> {proposal.line || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Modelo:</span> {proposal.model || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Código:</span> {proposal.code || '-'}
            </div>
          </div>
        </div>

        {/* Seção Especificações */}
        <div className="proposal-section mb-2">
          <h2 className="border-b p-1.5 text-xs font-black uppercase tracking-wide" style={{
            backgroundColor: sectionBgColor,
            borderColor: sectionBorderColor,
            color: sectionTitleColor,
            lineHeight: '1.2'
          }}>ESPECIFICAÇÕES</h2>
          <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 px-2 py-1 text-xs">
            <div className="proposal-row">
              <span className="font-semibold">Potência:</span> {proposal.power || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Tensão Entrada:</span> {proposal.input_voltage || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Tensão Saída:</span> {proposal.output_voltage || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Banco de Baterias:</span> {proposal.battery_bank_type || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Quant. Baterias:</span> {proposal.battery_quantity || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Tensão Bateria:</span> {proposal.battery_voltage || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Amperagem Bateria:</span> {proposal.battery_amperage || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Alimentação:</span> {proposal.power_supply || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Saída Nobreak:</span> {proposal.nobreak_output || '-'}
            </div>
          </div>
        </div>

        {/* Seção Condições Gerais de Fornecimento */}
        <div className="proposal-section mb-2">
          <h2 className="border-b p-1.5 text-xs font-black uppercase tracking-wide" style={{
            backgroundColor: sectionBgColor,
            borderColor: sectionBorderColor,
            color: sectionTitleColor,
            lineHeight: '1.2'
          }}>CONDIÇÕES GERAIS DE FORNECIMENTO</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 px-2 py-1 text-xs">
            <div className="proposal-row">
              <span className="font-semibold">Monitoração:</span> {proposal.monitoring || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Instalação e Ativação:</span> {proposal.installation_activation || '-'}
            </div>
          </div>
        </div>

        {/* Seção Condições Comerciais */}
        <div className="proposal-section mb-2">
          <h2 className="border-b p-1.5 text-xs font-black uppercase tracking-wide" style={{
            backgroundColor: sectionBgColor,
            borderColor: sectionBorderColor,
            color: sectionTitleColor,
            lineHeight: '1.2'
          }}>CONDIÇÕES COMERCIAIS</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 px-2 py-1 text-xs">
            <div className="col-span-2 proposal-row">
              <span className="font-semibold">Condições de Pagamento:</span> {proposal.payment_terms || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Prazo de Fab. / Entrega:</span> {proposal.delivery_time || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Garantia:</span> {proposal.warranty || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Frete:</span> {proposal.shipping_terms || '-'}
            </div>
            <div className="proposal-row">
              <span className="font-semibold">Validade da Proposta:</span> {proposal.proposal_validity || '-'}
            </div>
          </div>
        </div>

        {/* Seção Observações */}
        <div className="proposal-section mb-2">
          <h2 className="border-b p-1.5 text-xs font-black uppercase tracking-wide" style={{
            backgroundColor: sectionBgColor,
            borderColor: sectionBorderColor,
            color: sectionTitleColor,
            lineHeight: '1.2'
          }}>OBSERVAÇÕES</h2>
          <div className="px-2 py-1 space-y-1 text-xs">
            <p className="font-semibold uppercase leading-tight">
              A GARANTIA E O START-UP COBREM O DESLOCAMENTO DE UM TÉCNICO DA FATTAX NO MÁXIMO DE UM RAIO DE 30 KM. PARA O ATENDIMENTO TÉCNICO EM LOCAIS QUE EXCEDAM ESTE LIMITE A DESPESA COM O DESLOCAMENTO ADICIONAL SERÁ POR CONTA DO CLIENTE OU NEGOCIADO E INCLUSO NA PROPOSTA.
            </p>
            <p className="font-semibold uppercase leading-tight">
              EQUIPAMENTOS DE 2KVA ATÉ 5KVA CIRCUITOS DE TOMADA DEVERÃO SER DE 20A, EQUIPAMENTOS ACIMA DESSA CAPACIDADE CLIENTE DEVE FORNECER INFRA-ELETRICA DIMENSIONADA PARA A CAPACIDADE DO EQUIPAMENTO, QUADROS, DISJUNTORES E CABOS(SE NECESSÁRIOS).
            </p>
            {proposal.observations && proposal.observations.trim() !== '' && (
              <p className="font-semibold leading-tight">
                {proposal.observations}
              </p>
            )}
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="proposal-section mb-2">
          <h2 className="border-b p-1.5 text-xs font-black uppercase tracking-wide" style={{
            backgroundColor: sectionBgColor,
            borderColor: sectionBorderColor,
            color: sectionTitleColor,
            lineHeight: '1.2'
          }}>PRODUTOS</h2>
          <div className="px-2 py-1">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1 text-left font-semibold">Cód.</th>
                  <th className="border p-1 text-left font-semibold">Descrição</th>
                  <th className="border p-1 text-center font-semibold">Qtd.</th>
                  <th className="border p-1 text-right font-semibold">Preço Un.</th>
                  <th className="border p-1 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {proposal.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border p-1">{item.product_code || '-'}</td>
                    <td className="border p-1">{item.product_description}</td>
                    <td className="border p-1 text-center">{item.quantity}</td>
                    <td className="border p-1 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="border p-1 text-right">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50">
                  <td colSpan="4" className="border p-1 text-right font-bold">
                    Total Geral:
                  </td>
                  <td className="border p-1 text-right font-bold text-emerald-700">
                    {formatCurrency(proposal.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Seção Assinaturas */}
        <div className="proposal-section mt-8">
          <h2 className="border-b p-1.5 text-xs font-black uppercase tracking-wide" style={{
            backgroundColor: sectionBgColor,
            borderColor: sectionBorderColor,
            color: sectionTitleColor,
            lineHeight: '1.2'
          }}>ASSINATURAS</h2>
          <div className="grid grid-cols-2 gap-8 px-2 pt-8 pb-2">
            {/* Lado esquerdo: Usuário criador da proposta */}
            <div className="flex flex-col items-center text-center">
              <div className="border-t border-gray-400 pt-1 w-full max-w-[200px]">
                <p className="font-bold text-xs uppercase text-gray-900">{creatorName || 'FATTAX'}</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">{userRole}</p>
              </div>
            </div>

            {/* Lado direito: Cliente */}
            <div className="flex flex-col items-center text-center">
              <div className="border-t border-gray-400 pt-1 w-full max-w-[200px]">
                <p className="font-bold text-xs uppercase text-gray-900">{proposal.client_contact || 'Contato do Cliente'}</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">{proposal.client_name || 'Cliente'}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
      </main>
    </div>
  );
}

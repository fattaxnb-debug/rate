import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, FileText, Trash2, Eye, Edit, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api.js';
import ProposalForm from '@/components/ProposalForm.jsx';
import Header from '@/components/Header.jsx';

export default function ProposalsPage() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('ABERTA');
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCard = (proposalId) => {
    setExpandedCards(prev => ({
      ...prev,
      [proposalId]: !prev[proposalId]
    }));
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async (search = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = search ? { client_name: search } : {};
      const response = await axios.get(`${API_BASE_URL}/proposals`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setProposals(response.data.data || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Erro ao carregar propostas');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProposals(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    fetchProposals();
  };

  const handleNewProposal = () => {
    setSelectedProposal(null);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleEditProposal = async (proposal) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/proposals/${proposal.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedProposal(response.data.data);
      setIsViewMode(false);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      toast.error('Erro ao carregar detalhes da proposta');
    }
  };

  const handleViewProposal = (proposal) => {
    navigate(`/proposals/${proposal.id}`);
  };

  const handleDeleteProposal = async (proposal) => {
    if (!confirm(`Deseja realmente excluir a proposta ${proposal.proposal_number}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_BASE_URL}/proposals/${proposal.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Proposta excluída com sucesso');
      fetchProposals(searchTerm);
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error('Erro ao excluir proposta');
    }
  };

  const handleSaveProposal = async (newStatus) => {
    setIsDialogOpen(false);
    setSelectedProposal(null);
    if (newStatus) {
      setActiveTab(newStatus);
    }
    // Aguardar um pequeno delay para garantir que o backend processou a atualização
    await new Promise(resolve => setTimeout(resolve, 300));
    await fetchProposals(searchTerm);
  };

  const filteredProposals = proposals.filter(proposal => {
    if (activeTab === 'TODAS') return true;
    return (proposal.status || 'ABERTA') === activeTab;
  });

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">PROPOSTAS</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Gerenciamento de Propostas Técnicas
            </p>
          </div>
          <Button onClick={handleNewProposal} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Proposta
          </Button>
        </CardHeader>
        <CardContent>
          {/* Barra de Pesquisa */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              Buscar
            </Button>
            {searchTerm && (
              <Button variant="ghost" onClick={handleClearSearch}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Abas de Status */}
          <div className="flex gap-2 mb-4 border-b">
            <button
              onClick={() => setActiveTab('ABERTA')}
              className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'ABERTA'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ABERTAS
            </button>
            <button
              onClick={() => setActiveTab('FECHADA')}
              className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'FECHADA'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              FECHADAS
            </button>
            <button
              onClick={() => setActiveTab('DISPENSADA')}
              className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'DISPENSADA'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              DISPENSADAS
            </button>
          </div>

          {/* Tabela de Propostas - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Carregando propostas...
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma proposta encontrada nesta aba
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left p-3 font-semibold text-sm">Nº Proposta</th>
                    <th className="text-left p-3 font-semibold text-sm">Status</th>
                    <th className="text-left p-3 font-semibold text-sm">Data</th>
                    <th className="text-left p-3 font-semibold text-sm">Validade</th>
                    <th className="text-left p-3 font-semibold text-sm">Cliente</th>
                    <th className="text-left p-3 font-semibold text-sm">CNPJ</th>
                    <th className="text-right p-3 font-semibold text-sm">Valor Total</th>
                    <th className="text-center p-3 font-semibold text-sm w-32">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProposals.map((proposal) => (
                    <tr key={proposal.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium">
                        {proposal.proposal_number}
                      </td>
                      <td className="p-3 text-sm">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor:
                              proposal.status === 'FECHADA' ? '#bbf7d0' :
                              proposal.status === 'DISPENSADA' ? '#fecaca' :
                              '#bfdbfe',
                            color:
                              proposal.status === 'FECHADA' ? '#166534' :
                              proposal.status === 'DISPENSADA' ? '#991b1b' :
                              '#1e40af',
                          }}
                        >
                          {proposal.status || 'ABERTA'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {proposal.proposal_date}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {proposal.proposal_validity || '-'}
                      </td>
                      <td className="p-3 text-sm">
                        {proposal.client_name}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {proposal.client_cnpj || '-'}
                      </td>
                      <td className="p-3 text-sm text-right font-medium">
                        {formatCurrency(proposal.total_amount)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProposal(proposal)}
                            className="h-8 w-8 p-0"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProposal(proposal)}
                            className="h-8 w-8 p-0"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProposal(proposal)}
                            className="h-8 w-8 p-0"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Versão Mobile - Cards Expansíveis */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Carregando propostas...
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma proposta encontrada nesta aba
              </div>
            ) : (
              filteredProposals.map((proposal) => (
                <div key={proposal.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors relative overflow-hidden"
                    onClick={() => toggleCard(proposal.id)}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
                    <div className="flex items-center justify-between pl-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate text-base">
                          {proposal.proposal_number}
                        </h3>
                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                          <div className="flex items-center">
                            <span className="font-semibold text-blue-600 w-24">Cliente:</span>
                            <span className="text-gray-900">{proposal.client_name || '-'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-semibold text-blue-600 w-24">Status:</span>
                            <span className="text-gray-900">
                              <span
                                className="px-2 py-1 rounded-full text-xs font-semibold"
                                style={{
                                  backgroundColor:
                                    proposal.status === 'FECHADA' ? '#bbf7d0' :
                                    proposal.status === 'DISPENSADA' ? '#fecaca' :
                                    '#bfdbfe',
                                  color:
                                    proposal.status === 'FECHADA' ? '#166534' :
                                    proposal.status === 'DISPENSADA' ? '#991b1b' :
                                    '#1e40af',
                                }}
                              >
                                {proposal.status || 'ABERTA'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-2 shadow-md">
                          {expandedCards[proposal.id] ? (
                            <ChevronUp className="h-4 w-4 text-white" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {expandedCards[proposal.id] && (
                    <div className="px-4 pb-4 border-t border-blue-500/20 pt-4 bg-gradient-to-b from-blue-500/5 to-transparent">
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Nº Proposta:</span>
                          <span className="text-gray-900 font-medium">{proposal.proposal_number || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Cliente:</span>
                          <span className="text-gray-900 font-medium">{proposal.client_name || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">CNPJ:</span>
                          <span className="text-gray-900 font-medium">{proposal.client_cnpj || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Data:</span>
                          <span className="text-gray-900 font-medium">{proposal.proposal_date || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Validade:</span>
                          <span className="text-gray-900 font-medium">{proposal.proposal_validity || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Valor Total:</span>
                          <span className="text-gray-900 font-medium">{formatCurrency(proposal.total_amount)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="font-semibold text-blue-600">Status:</span>
                          <span className="text-gray-900 font-medium">
                            <span
                              className="px-2 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor:
                                  proposal.status === 'FECHADA' ? '#bbf7d0' :
                                  proposal.status === 'DISPENSADA' ? '#fecaca' :
                                  '#bfdbfe',
                                color:
                                  proposal.status === 'FECHADA' ? '#166534' :
                                  proposal.status === 'DISPENSADA' ? '#991b1b' :
                                  '#1e40af',
                              }}
                            >
                              {proposal.status || 'ABERTA'}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-blue-500/20">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProposal(proposal);
                          }}
                          title="Visualizar"
                          className="bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProposal(proposal);
                          }}
                          title="Editar"
                          className="bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProposal(proposal);
                          }}
                          title="Excluir"
                          className="bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para Nova/Editar/Visualizar Proposta */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isViewMode 
                ? `Visualizar Proposta - ${selectedProposal?.proposal_number || ''}`
                : selectedProposal?.id 
                  ? `Editar Proposta - ${selectedProposal?.proposal_number || ''}`
                  : 'Nova Proposta'
              }
            </DialogTitle>
          </DialogHeader>
          {isViewMode ? (
            <div className="space-y-6">
              {/* Visualização somente leitura */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                <div>
                  <span className="font-semibold">Número:</span> {selectedProposal?.proposal_number}
                </div>
                <div>
                  <span className="font-semibold">Data:</span> {selectedProposal?.proposal_date}
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Cliente:</span> {selectedProposal?.client_name}
                </div>
                <div>
                  <span className="font-semibold">CNPJ:</span> {selectedProposal?.client_cnpj || '-'}
                </div>
                <div>
                  <span className="font-semibold">Contato:</span> {selectedProposal?.client_contact || '-'}
                </div>
              </div>
              
              {selectedProposal?.items?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Produtos</h4>
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-left">Código</th>
                        <th className="border p-2 text-left">Descrição</th>
                        <th className="border p-2 text-center">Qtd</th>
                        <th className="border p-2 text-right">Preço Un.</th>
                        <th className="border p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProposal.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border p-2">{item.product_code || '-'}</td>
                          <td className="border p-2">{item.product_description}</td>
                          <td className="border p-2 text-center">{item.quantity}</td>
                          <td className="border p-2 text-right">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="border p-2 text-right">
                            {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50">
                        <td colSpan="4" className="border p-2 text-right font-bold">
                          Total Geral:
                        </td>
                        <td className="border p-2 text-right font-bold text-emerald-700">
                          {formatCurrency(selectedProposal?.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button onClick={() => setIsDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <ProposalForm
              proposal={selectedProposal}
              onSave={handleSaveProposal}
              onCancel={() => setIsDialogOpen(false)}
              isModal={true}
            />
          )}
        </DialogContent>
      </Dialog>
      </main>
    </div>
  );
}

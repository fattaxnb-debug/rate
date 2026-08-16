import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Trash2, Edit, X, ChevronDown, ChevronUp, ZoomIn, Eye } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api.js';
import FailureForm from '@/components/FailureForm.jsx';
import Header from '@/components/Header.jsx';

export default function FailuresPage() {
  const navigate = useNavigate();
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [selectedFailure, setSelectedFailure] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [stats, setStats] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [viewFailure, setViewFailure] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtros
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFrequency, setFilterFrequency] = useState('');

  const toggleCard = (failureId) => {
    setExpandedCards(prev => ({
      ...prev,
      [failureId]: !prev[failureId]
    }));
  };

  useEffect(() => {
    fetchFailures();
    fetchStats();
  }, []);

  const fetchFailures = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = {};
      if (filterBrand) params.brand = filterBrand;
      if (filterCategory) params.category = filterCategory;
      if (filterFrequency) params.frequency = filterFrequency;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get(`${API_BASE_URL}/failures`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setFailures(response.data.data || []);
    } catch (error) {
      console.error('Error fetching failures:', error);
      toast.error('Erro ao carregar falhas');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/failures/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = () => {
    fetchFailures();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterBrand('');
    setFilterCategory('');
    setFilterFrequency('');
    fetchFailures();
  };

  const handleNewFailure = () => {
    setSelectedFailure(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open) => {
    if (!open && isDialogOpen) {
      setCloseConfirmOpen(true);
    } else {
      setIsDialogOpen(open);
    }
  };

  const confirmClose = () => {
    setCloseConfirmOpen(false);
    setIsDialogOpen(false);
    setSelectedFailure(null);
  };

  const handleEditFailure = async (failure) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/failures/${failure.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedFailure(response.data.data);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching failure details:', error);
      toast.error('Erro ao carregar detalhes da falha');
    }
  };

  const handleDeleteFailure = async (failure) => {
    if (!confirm(`Deseja realmente excluir esta falha?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_BASE_URL}/failures/${failure.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Falha excluída com sucesso');
      fetchFailures();
      fetchStats();
    } catch (error) {
      console.error('Error deleting failure:', error);
      toast.error('Erro ao excluir falha');
    }
  };

  const handleViewFailure = async (failure) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/failures/${failure.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViewFailure(response.data.data);
    } catch (error) {
      console.error('Error fetching failure details:', error);
      toast.error('Erro ao carregar detalhes da falha');
    }
  };

  const handleSaveFailure = () => {
    setIsDialogOpen(false);
    setSelectedFailure(null);
    fetchFailures();
    fetchStats();
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm opacity-90">Total de Falhas</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{stats.top_brands?.[0]?.count || 0}</div>
                <div className="text-sm opacity-90">Marca Mais Comum</div>
                <div className="text-xs opacity-75">{stats.top_brands?.[0]?.brand || '-'}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{stats.by_category?.length || 0}</div>
                <div className="text-sm opacity-90">Categorias</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{stats.by_frequency?.find(f => f.frequency === 'Comum')?.count || 0}</div>
                <div className="text-sm opacity-90">Falhas Comuns</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-2xl font-bold">BANCO DE FALHAS</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Base de Conhecimento Técnico
              </p>
            </div>
            <Button onClick={handleNewFailure} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Falha
            </Button>
          </CardHeader>
          <CardContent>
            {/* Barra de Pesquisa e Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Input
                placeholder="Filtrar por marca"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todas Categorias</option>
                <option value="Elétrica">Elétrica</option>
                <option value="Eletrônica">Eletrônica</option>
                <option value="Mecânica">Mecânica</option>
                <option value="Software">Software</option>
              </select>
              <select
                value={filterFrequency}
                onChange={(e) => setFilterFrequency(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todas Frequências</option>
                <option value="Rara">Rara</option>
                <option value="Ocasional">Ocasional</option>
                <option value="Comum">Comum</option>
                <option value="Muito Comum">Muito Comum</option>
              </select>
            </div>

            <div className="flex gap-2 mb-6">
              <Button variant="outline" onClick={handleSearch}>
                Buscar
              </Button>
              {(searchTerm || filterBrand || filterCategory || filterFrequency) && (
                <Button variant="ghost" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </div>

            {/* Lista de Falhas - Tabela Desktop / Cards Mobile */}
            {isMobile ? (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Carregando falhas...
                  </div>
                ) : failures.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma falha encontrada
                  </div>
                ) : (
                  failures.map((failure) => (
                    <div key={failure.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors relative overflow-hidden"
                        onClick={() => toggleCard(failure.id)}
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>
                        <div className="flex items-center justify-between pl-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate text-base">
                              {failure.brand || 'Sem marca'} - {failure.model || 'Sem modelo'}
                            </h3>
                            <div className="text-sm text-gray-600 mt-2 space-y-1">
                              <div className="flex items-center">
                                <span className="font-semibold text-blue-600 w-24">Falha:</span>
                                <span className="text-gray-900 truncate">{failure.failure_description || '-'}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-semibold text-blue-600 w-24">Categoria:</span>
                                <span className="text-gray-900">
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                    {failure.category || 'Não definida'}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-full p-2 shadow-md">
                              {expandedCards[failure.id] ? (
                                <ChevronUp className="h-4 w-4 text-white" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {expandedCards[failure.id] && (
                        <div className="px-4 pb-4 border-t border-red-500/20 pt-4 bg-gradient-to-b from-red-500/5 to-transparent">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="font-semibold text-blue-600">Marca:</span>
                              <span className="text-gray-900 font-medium">{failure.brand || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="font-semibold text-blue-600">Modelo:</span>
                              <span className="text-gray-900 font-medium">{failure.model || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="font-semibold text-blue-600">Potência:</span>
                              <span className="text-gray-900 font-medium">{failure.power || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="font-semibold text-blue-600">Ref. Placa:</span>
                              <span className="text-gray-900 font-medium">{failure.board_reference || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="font-semibold text-blue-600">Tensão Entrada:</span>
                              <span className="text-gray-900 font-medium">{failure.input_voltage || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="font-semibold text-blue-600">Tensão Saída:</span>
                              <span className="text-gray-900 font-medium">{failure.output_voltage || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="font-semibold text-blue-600">Tensão Bateria:</span>
                              <span className="text-gray-900 font-medium">{failure.battery_voltage || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="font-semibold text-blue-600">Frequência:</span>
                              <span className="text-gray-900 font-medium">{failure.frequency || '-'}</span>
                            </div>
                            <div className="md:col-span-2 py-2 border-b border-gray-200">
                              <span className="font-semibold text-blue-600 block mb-1">Falha Apresentada:</span>
                              <span className="text-gray-900">{failure.failure_description || '-'}</span>
                            </div>
                            <div className="md:col-span-2 py-2 border-b border-gray-200">
                              <span className="font-semibold text-blue-600 block mb-1">Componentes:</span>
                              <span className="text-gray-900">{failure.components || '-'}</span>
                            </div>
                            <div className="md:col-span-2 py-2 border-b border-gray-200">
                              <span className="font-semibold text-blue-600 block mb-1">Solução Sugerida:</span>
                              <span className="text-gray-900">{failure.suggested_solution || '-'}</span>
                            </div>
                            <div className="md:col-span-2 py-2 border-b border-gray-200">
                              <span className="font-semibold text-blue-600 block mb-1">Peças Utilizadas:</span>
                              <span className="text-gray-900">{failure.parts_used || '-'}</span>
                            </div>
                            <div className="md:col-span-2 py-2">
                              <span className="font-semibold text-blue-600 block mb-1">Registrado por:</span>
                              <span className="text-gray-900">{failure.created_by_name || '-'} em {new Date(failure.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            {failure.photo_urls && (
                              <div className="md:col-span-2 py-2">
                                <span className="font-semibold text-blue-600 block mb-2">Registro Fotográfico:</span>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {(() => {
                                    try {
                                      const photoData = JSON.parse(failure.photo_urls);
                                      if (Array.isArray(photoData)) {
                                        return photoData.map((photo, index) => (
                                          <div
                                            key={photo.id || index}
                                            className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors relative group"
                                            onClick={() => setPreviewPhoto(photo.url)}
                                          >
                                            <img
                                              src={photo.url}
                                              alt={`Foto ${index + 1}`}
                                              className="w-full h-full object-cover"
                                            />
                                            {photo.comment && (
                                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                                                {photo.comment}
                                              </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                              <ZoomIn className="h-8 w-8 text-white" />
                                            </div>
                                          </div>
                                        ));
                                      }
                                    } catch (e) {
                                      // Fallback para formato CSV antigo
                                      return failure.photo_urls.split(',').filter(url => url.trim()).map((url, index) => (
                                        <div
                                          key={index}
                                          className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors relative group"
                                          onClick={() => setPreviewPhoto(url.trim())}
                                        >
                                          <img
                                            src={url.trim()}
                                            alt={`Foto ${index + 1}`}
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ZoomIn className="h-8 w-8 text-white" />
                                          </div>
                                        </div>
                                      ));
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-3 mt-4 pt-4 border-t border-red-500/20">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditFailure(failure);
                              }}
                              className="bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFailure(failure);
                              }}
                              className="bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Marca</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Modelo</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Potência</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Tensão Entrada</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Tensão Saída</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Tensão Bateria</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Ref. Placa</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          Carregando falhas...
                        </td>
                      </tr>
                    ) : failures.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          Nenhuma falha encontrada
                        </td>
                      </tr>
                    ) : (
                      failures.map((failure) => (
                        <tr key={failure.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm">{failure.brand || '-'}</td>
                          <td className="px-4 py-3 text-sm">{failure.model || '-'}</td>
                          <td className="px-4 py-3 text-sm">{failure.power || '-'}</td>
                          <td className="px-4 py-3 text-sm">{failure.input_voltage || '-'}</td>
                          <td className="px-4 py-3 text-sm">{failure.output_voltage || '-'}</td>
                          <td className="px-4 py-3 text-sm">{failure.battery_voltage || '-'}</td>
                          <td className="px-4 py-3 text-sm">{failure.board_reference || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewFailure(failure)}
                                className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditFailure(failure)}
                                className="h-8 w-8 p-0 bg-amber-500 hover:bg-amber-600 text-white"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFailure(failure)}
                                className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog para Nova/Editar Falha */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedFailure?.id ? 'Editar Falha' : 'Nova Falha'}
              </DialogTitle>
            </DialogHeader>
            <FailureForm
              failure={selectedFailure}
              onSave={handleSaveFailure}
              onCancel={confirmClose}
              isModal={true}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog de Preview de Foto */}
        <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            {previewPhoto && (
              <img
                src={previewPhoto}
                alt="Foto em tamanho completo"
                className="w-full h-auto object-contain"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Visualização de Falha */}
        <Dialog open={!!viewFailure} onOpenChange={() => setViewFailure(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visualizar Falha</DialogTitle>
            </DialogHeader>
            {viewFailure && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold text-blue-600">Marca:</span>
                    <p className="text-gray-900">{viewFailure.brand || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-600">Modelo:</span>
                    <p className="text-gray-900">{viewFailure.model || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-600">Potência:</span>
                    <p className="text-gray-900">{viewFailure.power || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-600">Ref. Placa:</span>
                    <p className="text-gray-900">{viewFailure.board_reference || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-600">Tensão Entrada:</span>
                    <p className="text-gray-900">{viewFailure.input_voltage || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-600">Tensão Saída:</span>
                    <p className="text-gray-900">{viewFailure.output_voltage || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-600">Tensão Bateria:</span>
                    <p className="text-gray-900">{viewFailure.battery_voltage || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-600">Categoria:</span>
                    <p className="text-gray-900">{viewFailure.category || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-600">Frequência:</span>
                    <p className="text-gray-900">{viewFailure.frequency || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-600">Registrado por:</span>
                    <p className="text-gray-900">{viewFailure.created_by_name || '-'} em {new Date(viewFailure.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-blue-600 block mb-1">Falha Apresentada:</span>
                  <p className="text-gray-900">{viewFailure.failure_description || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-blue-600 block mb-1">Sintomas Iniciais:</span>
                  <p className="text-gray-900">{viewFailure.initial_symptoms || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-blue-600 block mb-1">Testes Realizados:</span>
                  <p className="text-gray-900">{viewFailure.tests_performed || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-blue-600 block mb-1">Ferramentas Utilizadas:</span>
                  <p className="text-gray-900">{viewFailure.tools_used || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-blue-600 block mb-1">Componentes:</span>
                  <p className="text-gray-900">{viewFailure.components || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-blue-600 block mb-1">Solução Sugerida:</span>
                  <p className="text-gray-900">{viewFailure.suggested_solution || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-blue-600 block mb-1">Peças Utilizadas:</span>
                  <p className="text-gray-900">{viewFailure.parts_used || '-'}</p>
                </div>
                {viewFailure.photo_urls && (
                  <div>
                    <span className="font-semibold text-blue-600 block mb-2">Registro Fotográfico:</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(() => {
                        try {
                          const photoData = JSON.parse(viewFailure.photo_urls);
                          if (Array.isArray(photoData)) {
                            return photoData.map((photo, index) => (
                              <div
                                key={photo.id || index}
                                className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors relative group"
                                onClick={() => setPreviewPhoto(photo.url)}
                              >
                                <img
                                  src={photo.url}
                                  alt={`Foto ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {photo.comment && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                                    {photo.comment}
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ZoomIn className="h-8 w-8 text-white" />
                                </div>
                              </div>
                            ));
                          }
                        } catch (e) {
                          // Fallback para formato CSV antigo
                          return viewFailure.photo_urls.split(',').filter(url => url.trim()).map((url, index) => (
                            <div
                              key={index}
                              className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors relative group"
                              onClick={() => setPreviewPhoto(url.trim())}
                            >
                              <img
                                src={url.trim()}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="h-8 w-8 text-white" />
                              </div>
                            </div>
                          ));
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* AlertDialog de Confirmação de Saída */}
        <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar saída</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja sair sem salvar? As alterações não salvas serão perdidas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmClose}>
                Sair sem salvar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

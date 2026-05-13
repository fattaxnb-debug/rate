import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, MessageCircle, Download, Upload as UploadIcon, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { getWhatsAppLink } from '@/utils/validators.js';
import { exportClientsToExcel } from '@/utils/excelUtils.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ClientForm from '@/components/ClientForm.jsx';
import ImportClientsDialog from '@/components/ImportClientsDialog.jsx';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch } from '@/hooks/useSearch.js';
import { API_BASE_URL } from '@/config/api.js';

export default function ClientsPage() {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [clientToView, setClientToView] = useState(null);

  const isGerente = currentUser?.role === 'Gerente' || currentUser?.role === 'Admin' || currentUser?.role === 'manager';
const isTecnico = currentUser?.role === 'Técnico' || currentUser?.role === 'technician';
const canCreate = isGerente || isTecnico;

  const toggleCard = (clientId) => {
    setExpandedCards(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  const { searchTerm, setSearchTerm, filteredItems: filteredClients } = useSearch(clients, [
    'name',
    'cnpj_cpf',
    'email'
  ]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('[DEBUG] API_BASE_URL:', API_BASE_URL);
      console.log('[DEBUG] Token:', token ? 'Present' : 'Missing');
      console.log('[DEBUG] Fetching clients from:', `${API_BASE_URL}/clients`);
      const response = await axios.get(`${API_BASE_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('[DEBUG] Response:', response.data);
      const clients = response.data.data || [];
      // Ordenar por data de criação (mais recente primeiro)
      const sortedClients = clients.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setClients(sortedClients);
      setLoading(false);
    } catch (error) {
      console.error('[DEBUG] Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (selectedClient) {
        await axios.put(`${API_BASE_URL}/clients/${selectedClient.id}`, formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Cliente atualizado com sucesso');
      } else {
        await axios.post(`${API_BASE_URL}/clients`, formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Cliente criado com sucesso');
      }
      setDialogOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_BASE_URL}/clients/${clientToDelete.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Cliente excluído com sucesso');
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      fetchClients();
    } catch (error) {
      toast.error('Erro ao excluir cliente: ' + error.message);
    }
  };

  const handleExportExcel = () => {
    if (clients.length === 0) {
      toast.warning('Não há clientes para exportar.');
      return;
    }
    try {
      exportClientsToExcel(filteredClients);
      toast.success('Arquivo Excel gerado com sucesso.');
    } catch (error) {
      toast.error('Erro ao exportar clientes para Excel.');
      console.error(error);
    }
  };

  const openEditDialog = (client) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedClient(null);
    setDialogOpen(true);
  };

  const openDeleteDialog = (client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const openViewDialog = (client) => {
    setClientToView(client);
    setViewDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Clientes - FATTAX</title>
        <meta name="description" content="Gerenciamento de clientes do sistema FATTAX" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ letterSpacing: '-0.02em' }}>Clientes</h1>
              <p className="text-muted-foreground">Gerenciamento de clientes</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
              {isGerente && (
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Importar Excel
                </Button>
              )}
              {canCreate && (
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              )}
            </div>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ/CPF ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredClients.length} de {clients.length} clientes
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-100 to-gray-200">
                <TableRow>
                  <TableHead className="font-bold text-gray-900">Nome/Razão Social</TableHead>
                  <TableHead className="font-bold text-gray-900">CNPJ/CPF</TableHead>
                  <TableHead className="font-bold text-gray-900">Telefone</TableHead>
                  <TableHead className="font-bold text-gray-900">E-mail</TableHead>
                  <TableHead className="font-bold text-gray-900">Cidade</TableHead>
                  <TableHead className="text-right font-bold text-gray-900">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-lg font-semibold">Nenhum resultado encontrado</p>
                        <p className="text-sm">Tente ajustar os filtros de busca</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client, index) => (
                    <TableRow key={client.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                      <TableCell className="font-semibold text-gray-900 max-w-[200px] truncate" title={client.name}>
                        {client.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-gray-700">{client.cnpj_cpf || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap text-gray-700">{client.phone || client.mobile}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-gray-700" title={client.email}>{client.email}</TableCell>
                      <TableCell className="whitespace-nowrap text-gray-700">{client.city}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {(client.phone || client.mobile) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(getWhatsAppLink(client.mobile || client.phone), '_blank')}
                              title="WhatsApp"
                              className="bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(client)}
                            title="Visualizar"
                            className="bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isGerente && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(client)}
                                title="Editar"
                                className="bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(client)}
                                title="Excluir"
                                className="bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4 md:hidden">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              {isGerente && (
                <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Importar
                </Button>
              )}
              {canCreate && (
                <Button size="sm" onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              )}
            </div>
            
            {/* Mostrar apenas 10 itens recentes quando não há pesquisa, ou todos filtrados quando há pesquisa */}
            {filteredClients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-lg font-semibold">Nenhum resultado encontrado</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              (searchTerm ? filteredClients : filteredClients.slice(0, 10)).map((client) => (
                <div key={client.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors relative overflow-hidden"
                    onClick={() => toggleCard(client.id)}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
                    <div className="flex items-center justify-between pl-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate text-base">{client.name}</h3>
                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                          <div className="flex items-center">
                            <span className="font-semibold text-blue-600 w-24">CNPJ/CPF:</span>
                            <span className="text-gray-900">{client.cnpj_cpf || '-'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-semibold text-blue-600 w-24">Telefone:</span>
                            <span className="text-gray-900">{client.phone || client.mobile || '-'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-2 shadow-md">
                          {expandedCards[client.id] ? (
                            <ChevronUp className="h-4 w-4 text-white" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {expandedCards[client.id] && (
                    <div className="px-4 pb-4 border-t border-blue-500/20 pt-4 bg-gradient-to-b from-blue-500/5 to-transparent">
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Tipo:</span>
                          <span className="text-gray-900 font-medium">{client.type === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}</span>
                        </div>
                        {client.type === 'juridica' && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="font-semibold text-blue-600">Nome Fantasia:</span>
                            <span className="text-gray-900">{client.fantasy_name || '-'}</span>
                          </div>
                        )}
                        {client.type === 'fisica' && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="font-semibold text-blue-600">RG:</span>
                            <span className="text-gray-900">{client.rg || '-'}</span>
                          </div>
                        )}
                        {client.type === 'juridica' && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="font-semibold text-blue-600">Inscrição Estadual:</span>
                            <span className="text-gray-900">{client.ie || '-'}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Endereço:</span>
                          <span className="text-gray-900">{client.address || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Número:</span>
                          <span className="text-gray-900">{client.number || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Complemento:</span>
                          <span className="text-gray-900">{client.complement || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Bairro:</span>
                          <span className="text-gray-900">{client.neighborhood || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Cidade:</span>
                          <span className="text-gray-900">{client.city || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Estado:</span>
                          <span className="text-gray-900">{client.state || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">CEP:</span>
                          <span className="text-gray-900">{client.zip_code || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Celular:</span>
                          <span className="text-gray-900">{client.mobile || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">E-mail:</span>
                          <span className="text-gray-900">{client.email || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="font-semibold text-blue-600">Contato Técnico:</span>
                          <span className="text-gray-900">{client.technical_contact || '-'}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-blue-500/20">
                        {(client.phone || client.mobile) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getWhatsAppLink(client.mobile || client.phone), '_blank');
                            }}
                            title="WhatsApp"
                            className="bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          >
                            <MessageCircle className="h-5 w-5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewDialog(client);
                          }}
                          title="Visualizar"
                          className="bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                        {isGerente && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(client);
                              }}
                              title="Editar"
                              className="bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                              <Pencil className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(client);
                              }}
                              title="Excluir"
                              className="bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </main>

        <Footer />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={selectedClient}
            onSave={handleSave}
            onCancel={() => {
              setDialogOpen(false);
              setSelectedClient(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <ImportClientsDialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen} 
        onSuccess={fetchClients} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <span className="font-semibold text-foreground">{clientToDelete?.name}</span>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Cliente</DialogTitle>
          </DialogHeader>
          {clientToView && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <p className="text-sm">{clientToView.type === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome/Razão Social</label>
                  <p className="text-sm">{clientToView.name}</p>
                </div>
                {clientToView.type === 'juridica' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome Fantasia</label>
                    <p className="text-sm">{clientToView.fantasy_name || '-'}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CNPJ/CPF</label>
                  <p className="text-sm">{clientToView.cnpj_cpf || '-'}</p>
                </div>
                {clientToView.type === 'fisica' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">RG</label>
                    <p className="text-sm">{clientToView.rg || '-'}</p>
                  </div>
                )}
                {clientToView.type === 'juridica' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Inscrição Estadual</label>
                    <p className="text-sm">{clientToView.ie || '-'}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                  <p className="text-sm">{clientToView.address || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número</label>
                  <p className="text-sm">{clientToView.number || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Complemento</label>
                  <p className="text-sm">{clientToView.complement || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bairro</label>
                  <p className="text-sm">{clientToView.neighborhood || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cidade</label>
                  <p className="text-sm">{clientToView.city || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <p className="text-sm">{clientToView.state || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CEP</label>
                  <p className="text-sm">{clientToView.zip_code || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <p className="text-sm">{clientToView.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Celular</label>
                  <p className="text-sm">{clientToView.mobile || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                  <p className="text-sm">{clientToView.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contato Técnico</label>
                  <p className="text-sm">{clientToView.technical_contact || '-'}</p>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setViewDialogOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
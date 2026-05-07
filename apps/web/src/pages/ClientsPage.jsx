import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, MessageCircle, Download, Upload as UploadIcon, Eye } from 'lucide-react';
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
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [clientToView, setClientToView] = useState(null);

  const isGerente = currentUser?.role === 'Gerente';

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
      const response = await axios.get(`${API_BASE_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setClients(response.data.data || []);
      setLoading(false);
    } catch (error) {
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
                <>
                  <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Importar Excel
                  </Button>
                  <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Cliente
                  </Button>
                </>
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

          <div className="bg-card rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome/Razão Social</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum resultado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium max-w-[200px] truncate" title={client.name}>
                        {client.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{client.cnpj_cpf}</TableCell>
                      <TableCell className="whitespace-nowrap">{client.phone || client.mobile}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={client.email}>{client.email}</TableCell>
                      <TableCell className="whitespace-nowrap">{client.city}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {(client.phone || client.mobile) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(getWhatsAppLink(client.mobile || client.phone), '_blank')}
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(client)}
                            title="Visualizar"
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
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(client)}
                                title="Excluir"
                                className="text-destructive hover:text-destructive"
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome Fantasia</label>
                  <p className="text-sm">{clientToView.fantasy_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CNPJ/CPF</label>
                  <p className="text-sm">{clientToView.cnpj_cpf || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">RG</label>
                  <p className="text-sm">{clientToView.rg || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Inscrição Estadual</label>
                  <p className="text-sm">{clientToView.ie || '-'}</p>
                </div>
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
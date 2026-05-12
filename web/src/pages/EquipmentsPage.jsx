import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { format } from 'date-fns';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import EquipmentForm from '@/components/EquipmentForm.jsx';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch } from '@/hooks/useSearch.js';

export default function EquipmentsPage() {
  const { currentUser } = useAuth();
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [viewingEquipment, setViewingEquipment] = useState(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);

  const isGerente = currentUser?.role === 'manager' || currentUser?.role === 'Gerente';

  const { searchTerm, setSearchTerm, filteredItems: filteredEquipments } = useSearch(equipments, [
    'brand', 'model', 'serial_number'
  ]);

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/equipments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setEquipments(response.data.data || []);
      setLoading(false);
    } catch (error) {
      toast.error('Erro ao carregar equipamentos');
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (selectedEquipment) {
        await axios.put(`${API_BASE_URL}/equipments/${selectedEquipment.id}`, formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Equipamento atualizado com sucesso');
      } else {
        await axios.post(`${API_BASE_URL}/equipments`, formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Equipamento criado com sucesso');
      }
      setDialogOpen(false);
      setSelectedEquipment(null);
      fetchEquipments();
    } catch (error) {
      toast.error('Erro ao salvar equipamento');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_BASE_URL}/equipments/${equipmentToDelete.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Equipamento excluído com sucesso');
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
      fetchEquipments();
    } catch (error) {
      toast.error('Erro ao excluir equipamento');
    }
  };

  const handleView = (equipment) => {
    setViewingEquipment(equipment);
    setViewDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Equipamentos - FATTAX</title>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Equipamentos</h1>
              <p className="text-muted-foreground">Gerenciamento de equipamentos</p>
            </div>
            {isGerente && (
              <Button onClick={() => { setSelectedEquipment(null); setDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Equipamento
              </Button>
            )}
          </div>

          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por marca, modelo ou número de série..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredEquipments.length} de {equipments.length} equipamentos
            </div>
          </div>

          <div className="bg-card rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Número de Série</TableHead>
                  <TableHead>Potência (VA)</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data de Instalação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum resultado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEquipments.map((equipment) => (
                    <TableRow key={equipment.id}>
                      <TableCell className="font-medium">{equipment.type ? equipment.type.toUpperCase() : '-'}</TableCell>
                      <TableCell>{equipment.brand}</TableCell>
                      <TableCell>{equipment.model}</TableCell>
                      <TableCell>{equipment.serial_number}</TableCell>
                      <TableCell>{equipment.power_va ? `${equipment.power_va} VA` : '-'}</TableCell>
                      <TableCell>{equipment.client_name ? equipment.client_name.replace(/\d+/g, '').trim().split(' ').slice(0, 3).join(' ') : '-'}</TableCell>
                      <TableCell>
                        {equipment.installation_date ? format(new Date(equipment.installation_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Botão Visualizar */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(equipment)}
                            title="Visualizar equipamento"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {isGerente && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedEquipment(equipment); setDialogOpen(true); }}
                                title="Editar equipamento"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEquipmentToDelete(equipment); setDeleteDialogOpen(true); }}
                                title="Excluir equipamento"
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

      {/* Modal de Cadastro / Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
          </DialogHeader>
          <EquipmentForm
            equipment={selectedEquipment}
            onSave={handleSave}
            onCancel={() => {
              setDialogOpen(false);
              setSelectedEquipment(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização (somente leitura) */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Equipamento</DialogTitle>
          </DialogHeader>
          <EquipmentForm
            equipment={viewingEquipment}
            onSave={() => {}}
            onCancel={() => setViewDialogOpen(false)}
            readOnly={true}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o equipamento {equipmentToDelete?.type} - {equipmentToDelete?.serial_number}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
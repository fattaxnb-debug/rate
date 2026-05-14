import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Eye, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedCards, setExpandedCards] = useState({});

  const isGerente = currentUser?.role === 'Gerente' || currentUser?.role === 'Admin' || currentUser?.role === 'manager';
const isTecnico = currentUser?.role === 'Técnico' || currentUser?.role === 'technician';
const canCreate = isGerente || isTecnico;

  const toggleCard = (equipmentId) => {
    setExpandedCards(prev => ({
      ...prev,
      [equipmentId]: !prev[equipmentId]
    }));
  };

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
      const equipments = response.data.data || [];
      // Ordenar por data de criação (mais recente primeiro)
      const sortedEquipments = equipments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setEquipments(sortedEquipments);
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
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
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

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Equipamentos</h1>
              <p className="text-muted-foreground">Gerenciamento de equipamentos</p>
            </div>
            <div className="hidden md:block">
              {canCreate && (
                <Button onClick={() => { setSelectedEquipment(null); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Equipamento
                </Button>
              )}
            </div>
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

          <div className="hidden md:block bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-100 to-gray-200">
                <TableRow>
                  <TableHead className="font-bold text-gray-900">Tipo</TableHead>
                  <TableHead className="font-bold text-gray-900">Marca</TableHead>
                  <TableHead className="font-bold text-gray-900">Modelo</TableHead>
                  <TableHead className="font-bold text-gray-900">Número de Série</TableHead>
                  <TableHead className="font-bold text-gray-900">Potência (VA)</TableHead>
                  <TableHead className="font-bold text-gray-900">Cliente</TableHead>
                  <TableHead className="font-bold text-gray-900">Data de Instalação</TableHead>
                  <TableHead className="text-right font-bold text-gray-900">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-lg font-semibold">Nenhum resultado encontrado</p>
                        <p className="text-sm">Tente ajustar os filtros de busca</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEquipments.map((equipment) => (
                    <TableRow key={equipment.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                      <TableCell className="font-semibold text-gray-900">{equipment.type ? equipment.type.toUpperCase() : '-'}</TableCell>
                      <TableCell className="text-gray-700">{equipment.brand}</TableCell>
                      <TableCell className="text-gray-700">{equipment.model}</TableCell>
                      <TableCell className="text-gray-700">{equipment.serial_number}</TableCell>
                      <TableCell className="text-gray-700">{equipment.power_va ? `${equipment.power_va} VA` : '-'}</TableCell>
                      <TableCell className="text-gray-700">{equipment.client_name ? equipment.client_name.replace(/\d+/g, '').trim().split(' ').slice(0, 3).join(' ') : '-'}</TableCell>
                      <TableCell className="text-gray-700">
                        {equipment.installation_date ? format(new Date(equipment.installation_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(equipment)}
                            title="Visualizar equipamento"
                            className="bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
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
                                className="bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEquipmentToDelete(equipment); setDeleteDialogOpen(true); }}
                                title="Excluir equipamento"
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
              {canCreate && (
                <Button size="sm" onClick={() => { setSelectedEquipment(null); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Equipamento
                </Button>
              )}
            </div>
            
            {filteredEquipments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-lg font-semibold">Nenhum resultado encontrado</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              (searchTerm ? filteredEquipments : filteredEquipments.slice(0, 5)).map((equipment) => (
                <div key={equipment.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors relative overflow-hidden"
                    onClick={() => toggleCard(equipment.id)}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate text-base">{equipment.brand} - {equipment.model}</h3>
                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                          <div className="flex items-center">
                            <span className="font-semibold text-blue-600 w-24">Tipo:</span>
                            <span className="text-gray-900">{equipment.type ? equipment.type.toUpperCase() : '-'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-semibold text-blue-600 w-24">Série:</span>
                            <span className="text-gray-900">{equipment.serial_number || '-'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-2 shadow-md">
                          {expandedCards[equipment.id] ? (
                            <ChevronUp className="h-4 w-4 text-white" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {expandedCards[equipment.id] && (
                    <div className="px-4 pb-4 border-t border-blue-500/20 pt-4 bg-gradient-to-b from-blue-500/5 to-transparent">
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Marca:</span>
                          <span className="text-gray-900 font-medium">{equipment.brand || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Modelo:</span>
                          <span className="text-gray-900 font-medium">{equipment.model || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Tipo:</span>
                          <span className="text-gray-900 font-medium">{equipment.type ? equipment.type.toUpperCase() : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Nº Série:</span>
                          <span className="text-gray-900 font-medium">{equipment.serial_number || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Potência (VA):</span>
                          <span className="text-gray-900 font-medium">{equipment.power_va || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Tensão Entrada:</span>
                          <span className="text-gray-900 font-medium">{equipment.voltage_in || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Tensão Saída:</span>
                          <span className="text-gray-900 font-medium">{equipment.voltage_out || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Tensão Bateria:</span>
                          <span className="text-gray-900 font-medium">{equipment.voltage_battery || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Corrente Bateria:</span>
                          <span className="text-gray-900 font-medium">{equipment.current_battery || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Tipo Bateria:</span>
                          <span className="text-gray-900 font-medium">{equipment.battery_type || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Quantidade Baterias:</span>
                          <span className="text-gray-900 font-medium">{equipment.battery_quantity || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Bateria Volts:</span>
                          <span className="text-gray-900 font-medium">{equipment.battery_volts || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Corrente Bateria (AH/W):</span>
                          <span className="text-gray-900 font-medium">{equipment.battery_current || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Conexão Bateria:</span>
                          <span className="text-gray-900 font-medium">{equipment.battery_connection || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Terminal Bateria:</span>
                          <span className="text-gray-900 font-medium">{equipment.battery_terminal || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Marca Bateria:</span>
                          <span className="text-gray-900 font-medium">{equipment.battery_brand || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Modelo Bateria:</span>
                          <span className="text-gray-900 font-medium">{equipment.battery_model || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Corrente Entrada:</span>
                          <span className="text-gray-900 font-medium">{equipment.current_in || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Corrente Saída:</span>
                          <span className="text-gray-900 font-medium">{equipment.current_out || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Capacidade (AH):</span>
                          <span className="text-gray-900 font-medium">{equipment.capacity_ah || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Certificação:</span>
                          <span className="text-gray-900 font-medium">{equipment.certification || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Simétrico:</span>
                          <span className="text-gray-900 font-medium">{equipment.symmetric || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Isolado:</span>
                          <span className="text-gray-900 font-medium">{equipment.isolated || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Qtd. Sinalizadores:</span>
                          <span className="text-gray-900 font-medium">{equipment.signalizers_quantity || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">IHM:</span>
                          <span className="text-gray-900 font-medium">{equipment.ihm || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Localizadores:</span>
                          <span className="text-gray-900 font-medium">{equipment.localizadores || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Cabo Comunicação:</span>
                          <span className="text-gray-900 font-medium">{equipment.communication_cable_type || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Fixação:</span>
                          <span className="text-gray-900 font-medium">{equipment.fixation || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-blue-600">Quantidade:</span>
                          <span className="text-gray-900 font-medium">{equipment.quantity || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="font-semibold text-blue-600">Data Instalação:</span>
                          <span className="text-gray-900 font-medium">{equipment.installation_date ? new Date(equipment.installation_date).toLocaleDateString('pt-BR') : '-'}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-blue-500/20">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingEquipment(equipment);
                            setViewDialogOpen(true);
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
                                setSelectedEquipment(equipment);
                                setDialogOpen(true);
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
                                setEquipmentToDelete(equipment);
                                setDeleteDialogOpen(true);
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
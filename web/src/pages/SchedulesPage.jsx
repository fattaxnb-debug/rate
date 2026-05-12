
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ScheduleForm from '@/components/ScheduleForm.jsx';
import { Skeleton } from '@/components/ui/skeleton';

export default function SchedulesPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  const isGerente = currentUser?.role === 'manager' || currentUser?.role === 'Gerente';
  const isTecnico = currentUser?.role === 'Técnico';

  useEffect(() => {
    fetchSchedules();
  }, [currentUser]);

  useEffect(() => {
    const sorted = sortSchedulesByUrgency(
      searchTerm.trim() ? filterBySearchTerm(schedules, searchTerm) : schedules
    );
    setFilteredSchedules(sorted);
  }, [searchTerm, schedules]);

  const sortSchedulesByUrgency = (schedulesList) => {
    if (!schedulesList || schedulesList.length === 0) return [];
    const now = new Date();

    return [...schedulesList].sort((a, b) => {
      const getPriority = (schedule) => {
        const dateStr = schedule.data_hora_agendamento;
        if (!dateStr) return 9999;

        const appointmentDate = new Date(dateStr);
        const diffMs = appointmentDate.getTime() - now.getTime();
        return diffMs;
      };

      return getPriority(a) - getPriority(b);
    });
  };

  const filterBySearchTerm = (schedulesList, term) => {
    const lowerTerm = term.toLowerCase();
    return schedulesList.filter(schedule =>
      schedule.client_name?.toLowerCase().includes(lowerTerm) ||
      schedule.status?.toLowerCase().includes(lowerTerm) ||
      schedule.technician_name?.toLowerCase().includes(lowerTerm) ||
      schedule.equipment_serial?.toLowerCase().includes(lowerTerm)
    );
  };

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/schedules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSchedules(response.data.data || []);
      setLoading(false);
    } catch (error) {
      toast.error('ERRO AO CARREGAR AGENDAMENTOS');
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (selectedSchedule) {
        await axios.put(`${API_BASE_URL}/schedules/${selectedSchedule.id}`, formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('AGENDAMENTO ATUALIZADO COM SUCESSO');
      } else {
        await axios.post(`${API_BASE_URL}/schedules`, formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('AGENDAMENTO CRIADO COM SUCESSO');
      }
      setDialogOpen(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (error) {
      toast.error('ERRO AO SALVAR AGENDAMENTO');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_BASE_URL}/schedules/${scheduleToDelete.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('AGENDAMENTO EXCLUÍDO COM SUCESSO');
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
      fetchSchedules();
    } catch (error) {
      toast.error('ERRO AO EXCLUIR AGENDAMENTO');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aberto': return 'bg-blue-500';
      case 'Em Andamento': return 'bg-amber-500';
      case 'Realizado': return 'bg-emerald-500';
      case 'Finalizado': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
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
        <title>AGENDAMENTOS - FATTAX</title>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ letterSpacing: '-0.02em' }}>AGENDAMENTOS</h1>
              <p className="text-muted-foreground">GERENCIAMENTO DE VISITAS TÉCNICAS</p>
            </div>
            {(isGerente || isTecnico) && (
              <Button onClick={() => { setSelectedSchedule(null); setDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                NOVO AGENDAMENTO
              </Button>
            )}
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, status, técnico ou número de série..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onInput={(e) => e.target.value = e.target.value.toUpperCase()}
                className="pl-10"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-red-500/20 shadow-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                  <TableHead className="text-white font-bold">DATA/HORA</TableHead>
                  <TableHead className="text-white font-bold">CLIENTE</TableHead>
                  <TableHead className="text-white font-bold">EQUIPAMENTO</TableHead>
                  <TableHead className="text-white font-bold">NÚMERO DE SÉRIE</TableHead>
                  <TableHead className="text-white font-bold">POTÊNCIA</TableHead>
                  <TableHead className="text-white font-bold">TÉCNICO</TableHead>
                  <TableHead className="text-white font-bold">STATUS</TableHead>
                  <TableHead className="text-white font-bold text-right">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      NENHUM AGENDAMENTO ENCONTRADO
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchedules.map((schedule, index) => {
                    return (
                      <TableRow key={schedule.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50 hover:bg-red-50/50 transition-colors'}>
                        <TableCell className="font-semibold text-gray-900">
                          {(() => {
                            if (!schedule.data_hora_agendamento) return '-';
                            return new Date(schedule.data_hora_agendamento).toLocaleString('pt-BR');
                          })()}
                        </TableCell>
                        <TableCell className="text-gray-700">{schedule.client_name || '-'}</TableCell>
                        <TableCell className="text-gray-700">
                          {schedule.equipment_type ? `${schedule.equipment_type} - ${schedule.equipment_model}` : <span className="text-muted-foreground italic">SEM EQUIPAMENTO</span>}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {schedule.equipment_serial || '-'}
                        </TableCell>
                        <TableCell className="text-gray-700 font-medium">
                          {schedule.equipment_power ? `${schedule.equipment_power} VA` : '-'}
                        </TableCell>
                        <TableCell className="text-gray-700">{schedule.technician_name || '-'}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(schedule.status)} text-white`}>
                            {schedule.status?.toUpperCase() || 'SEM STATUS'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/schedules/${schedule.id}`)}
                              title="VISUALIZAR"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {(isGerente || (isTecnico && schedule.technician_id === currentUser?.id)) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedSchedule(schedule); setDialogOpen(true); }}
                                title="EDITAR AGENDAMENTO"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}

                            {isGerente && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setScheduleToDelete(schedule); setDeleteDialogOpen(true); }}
                                title="EXCLUIR"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
            <DialogTitle>{selectedSchedule ? 'EDITAR AGENDAMENTO' : 'NOVO AGENDAMENTO'}</DialogTitle>
          </DialogHeader>
          <ScheduleForm
            schedule={selectedSchedule}
            onSave={handleSave}
            onCancel={() => {
              setDialogOpen(false);
              setSelectedSchedule(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>CONFIRMAR EXCLUSÃO</AlertDialogTitle>
            <AlertDialogDescription>
              TEM CERTEZA QUE DESEJA EXCLUIR ESTE AGENDAMENTO? ESTA AÇÃO NÃO PODE SER DESFEITA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>CANCELAR</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              EXCLUIR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

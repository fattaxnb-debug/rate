
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ScheduleForm from '@/components/ScheduleForm.jsx';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function SchedulesPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  const isGerente = currentUser?.role === 'Gerente' || currentUser?.role === 'Admin' || currentUser?.role === 'manager';
  const isTecnico = currentUser?.role === 'Técnico' || currentUser?.role === 'technician';

  const toggleCard = (scheduleId) => {
    setExpandedCards(prev => ({
      ...prev,
      [scheduleId]: !prev[scheduleId]
    }));
  };

  useEffect(() => {
    fetchSchedules();
  }, [currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, []);

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

  const getTemporalStatus = (schedule) => {
    // Se o status for Em Andamento, retorna azul
    if (schedule.status === 'Em Andamento') return 'em_andamento';
    // Se o status for Realizado, retorna laranja
    if (schedule.status === 'Realizado') return 'realizado';
    // Se o status for Finalizado, retorna sem destaque
    if (schedule.status === 'Finalizado') return 'concluido';
    
    if (!schedule.data_hora_agendamento && !schedule.scheduled_date) return null;
    
    const now = currentTime;
    const appointmentDate = schedule.data_hora_agendamento ? new Date(schedule.data_hora_agendamento) : new Date(`${schedule.scheduled_date}T${schedule.scheduled_time || '00:00'}`);
    const diffMs = appointmentDate.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Um minuto após a data e hora do agendamento: vermelha
    if (diffMs < -60000) return 'atrasado';
    // Até duas horas da data e hora do agendamento: verde
    if (diffMs >= 0 && diffHours <= 2) return 'verde';
    // Menos de duas horas (entre 2h e 0): amarelo
    if (diffMs < 0 && diffMs >= -60000) return 'amarelo';
    // Mais de duas horas: sem destaque
    return 'normal';
  };

  const getTemporalRowClass = (schedule) => {
    // Se o status for Em Andamento, retorna azul
    if (schedule.status === 'Em Andamento') return 'bg-blue-50 dark:bg-blue-950/20';
    // Se o status for Realizado, retorna laranja
    if (schedule.status === 'Realizado') return 'bg-orange-50 dark:bg-orange-950/20';
    // Se o status for Finalizado, retorna sem destaque
    if (schedule.status === 'Finalizado') return '';
    
    const status = getTemporalStatus(schedule);
    if (!status) return '';
    
    switch (status) {
      case 'atrasado': return 'bg-red-50 dark:bg-red-950/20';
      case 'verde': return 'bg-green-50 dark:bg-green-950/20';
      case 'amarelo': return 'bg-yellow-50 dark:bg-yellow-950/20';
      default: return '';
    }
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
        <title>AGENDAMENTOS - FATTAX</title>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
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

          <div className="hidden md:block bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-100 to-gray-200">
                <TableRow>
                  <TableHead className="font-bold text-gray-900">DATA/HORA</TableHead>
                  <TableHead className="font-bold text-gray-900">CLIENTE</TableHead>
                  <TableHead className="font-bold text-gray-900">EQUIPAMENTO</TableHead>
                  <TableHead className="font-bold text-gray-900">NÚMERO DE SÉRIE</TableHead>
                  <TableHead className="font-bold text-gray-900">POTÊNCIA</TableHead>
                  <TableHead className="font-bold text-gray-900">TÉCNICO</TableHead>
                  <TableHead className="font-bold text-gray-900">STATUS</TableHead>
                  <TableHead className="text-right font-bold text-gray-900">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-6xl mb-4">📅</div>
                        <p className="text-lg font-semibold">Nenhum agendamento encontrado</p>
                        <p className="text-sm">Tente ajustar os filtros de busca</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchedules.map((schedule) => {
                    return (
                      <TableRow key={schedule.id} className={`${getTemporalRowClass(schedule)} hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors duration-200`}>
                        <TableCell className="font-semibold text-gray-900">
                          {(() => {
                            if (!schedule.scheduled_date) return '-';
                            // Converter data do formato YYYY-MM-DD para DD/MM/YYYY
                            const [year, month, day] = schedule.scheduled_date.split('-');
                            const formattedDate = `${day}/${month}/${year}`;
                            const formattedTime = schedule.scheduled_time || '00:00';
                            return `${formattedDate} ${formattedTime}`;
                          })()}
                        </TableCell>
                        <TableCell className="text-gray-700">{schedule.client_name || '-'}</TableCell>
                        <TableCell className="text-gray-700">
                          {schedule.equipment_brand && schedule.equipment_model ? `${schedule.equipment_brand} - ${schedule.equipment_model}` : <span className="text-muted-foreground italic">SEM EQUIPAMENTO</span>}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {schedule.equipment_serial || '-'}
                        </TableCell>
                        <TableCell className="text-gray-700">
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
                              className="bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setSelectedSchedule(schedule); setDialogOpen(true); }}
                              title="EDITAR"
                              className="bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            {isGerente && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setScheduleToDelete(schedule); setDeleteDialogOpen(true); }}
                                title="EXCLUIR"
                                className="bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
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

          <div className="space-y-4 md:hidden">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {(isGerente || isTecnico) && (
                <Button size="sm" onClick={() => { setSelectedSchedule(null); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  NOVO AGENDAMENTO
                </Button>
              )}
            </div>
            
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-lg font-semibold">Nenhum agendamento encontrado</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              (searchTerm ? filteredSchedules : filteredSchedules.slice(0, 5)).map((schedule) => {
                const temporalClass = getTemporalRowClass(schedule);
                return (
                  <div key={schedule.id} className={`rounded-xl border-2 shadow-xl overflow-hidden ${temporalClass}`}>
                    <div 
                      className="p-4 cursor-pointer hover:bg-black/5 transition-colors relative overflow-hidden"
                      onClick={() => toggleCard(schedule.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate text-base">
                            {(() => {
                              const date = schedule.data_hora_agendamento ? new Date(schedule.data_hora_agendamento) : new Date(`${schedule.scheduled_date}T${schedule.scheduled_time || '00:00'}`);
                              return format(date, 'dd/MM/yyyy');
                            })()} - {format(new Date(`${schedule.scheduled_date}T${schedule.scheduled_time || '00:00'}`), 'HH:mm')}
                          </h3>
                          <div className="text-sm text-gray-600 mt-2 space-y-1">
                            <div className="flex items-center">
                              <span className="font-semibold text-blue-600 w-24">Cliente:</span>
                              <span className="text-gray-900">{schedule.client_name || '-'}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-semibold text-blue-600 w-24">Técnico:</span>
                              <span className="text-gray-900">{schedule.technician_name || '-'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-2 shadow-md">
                            {expandedCards[schedule.id] ? (
                              <ChevronUp className="h-4 w-4 text-white" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {expandedCards[schedule.id] && (
                      <div className="px-4 pb-4 border-t border-blue-500/20 pt-4 bg-black/5">
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="font-semibold text-blue-600">Status:</span>
                            <span className="text-gray-900 font-medium">
                              {schedule.status === 'completed' ? 'Concluído' : schedule.status === 'cancelled' ? 'Cancelado' : schedule.status === 'pending' ? 'Pendente' : schedule.status || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="font-semibold text-blue-600">Cliente:</span>
                            <span className="text-gray-900 font-medium">{schedule.client_name || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="font-semibold text-blue-600">Técnico:</span>
                            <span className="text-gray-900 font-medium">{schedule.technician_name || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="font-semibold text-blue-600">Equipamento:</span>
                            <span className="text-gray-900 font-medium">{schedule.equipment_type ? `${schedule.equipment_brand} ${schedule.equipment_model}` : '-'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="font-semibold text-blue-600">Observações:</span>
                            <span className="text-gray-900 font-medium">{schedule.notes || '-'}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-blue-500/20">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/schedules/${schedule.id}`);
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
                                  setSelectedSchedule(schedule);
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
                                  setScheduleToDelete(schedule);
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
                );
              })
            )}
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

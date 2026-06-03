
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
  const [activeTab, setActiveTab] = useState('ABERTO');

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
    const filteredByTab = schedules.filter(s => s.status?.toUpperCase() === activeTab);
    const searched = searchTerm.trim() ? filterBySearchTerm(filteredByTab, searchTerm) : filteredByTab;
    const sorted = sortSchedulesByDate(searched);
    setFilteredSchedules(sorted);
  }, [searchTerm, schedules, activeTab]);

  const sortSchedulesByDate = (schedulesList) => {
    if (!schedulesList || schedulesList.length === 0) return [];

    return [...schedulesList].sort((a, b) => {
      const getDate = (schedule) => {
        if (schedule.data_hora_agendamento) return new Date(schedule.data_hora_agendamento).getTime();
        if (schedule.scheduled_date) return new Date(`${schedule.scheduled_date}T${schedule.scheduled_time || '00:00'}`).getTime();
        return Infinity;
      };

      return getDate(a) - getDate(b);
    });
  };

  const getAttendanceClientName = (schedule) => {
    // Se use_default_address for NULL/undefined, considerar como true (endereço padrão)
    const useDefault = schedule.use_default_address !== false;
    if (useDefault) {
      return schedule.client_name || '-';
    } else {
      // Se não for endereço padrão, mostrar attendance_client_name (preenchido manualmente ou do cliente cadastrado)
      return schedule.attendance_client_name || '-';
    }
  };

  const filterBySearchTerm = (schedulesList, term) => {
    const lowerTerm = term.toLowerCase();
    return schedulesList.filter(schedule =>
      schedule.client_name?.toLowerCase().includes(lowerTerm) ||
      schedule.status?.toLowerCase().includes(lowerTerm) ||
      schedule.technician_name?.toLowerCase().includes(lowerTerm) ||
      schedule.equipment_serial?.toLowerCase().includes(lowerTerm) ||
      (schedule.attendance_client_name && schedule.attendance_client_name.toLowerCase().includes(lowerTerm)) ||
      (schedule.attendance_address && schedule.attendance_address.toLowerCase().includes(lowerTerm))
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
      case 'ABERTO': return 'bg-blue-500';
      case 'ATENDENDO': return 'bg-amber-500';
      case 'CONCLUIDO': return 'bg-emerald-500';
      case 'FINALIZADO': return 'bg-slate-500';
      case 'ATRASADO': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getTemporalStatus = (schedule) => {
    // Se o status for ATENDENDO, retorna azul
    if (schedule.status === 'ATENDENDO') return 'em_andamento';
    // Se o status for CONCLUIDO, retorna laranja
    if (schedule.status === 'CONCLUIDO') return 'realizado';
    // Se o status for FINALIZADO, retorna sem destaque
    if (schedule.status === 'FINALIZADO') return 'concluido';
    // Se o status for ATRASADO, retorna vermelho
    if (schedule.status === 'ATRASADO') return 'atrasado';

    if (!schedule.data_hora_agendamento && !schedule.scheduled_date) return null;

    const now = currentTime;
    const appointmentDate = schedule.data_hora_agendamento ? new Date(schedule.data_hora_agendamento) : new Date(`${schedule.scheduled_date}T${schedule.scheduled_time || '00:00'}`);
    const diffMs = appointmentDate.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    const diffHours = diffMs / (1000 * 60 * 60);

    // Atrasado (passou da hora): vermelho
    if (diffMs < 0) return 'atrasado';
    // Na hora (menos de 2 horas): amarelo
    if (diffMs >= 0 && diffHours < 2) return 'amarelo';
    // Faltando 2 horas ou mais: verde
    return 'verde';
  };

  const getTemporalRowClass = (schedule) => {
    // Se o status for ATENDENDO, retorna azul
    if (schedule.status === 'ATENDENDO') return 'bg-blue-50 dark:bg-blue-950/20';
    // Se o status for CONCLUIDO, retorna laranja
    if (schedule.status === 'CONCLUIDO') return 'bg-orange-50 dark:bg-orange-950/20';
    // Se o status for FINALIZADO, retorna sem destaque
    if (schedule.status === 'FINALIZADO') return '';
    // Se o status for ATRASADO, retorna vermelho
    if (schedule.status === 'ATRASADO') return 'bg-red-50 dark:bg-red-950/20';

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
            <div className="hidden md:block">
              {(isGerente || isTecnico) && (
                <Button onClick={() => { setSelectedSchedule(null); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  NOVO AGENDAMENTO
                </Button>
              )}
            </div>
          </div>

          {/* Abas de Status */}
          <div className="mb-4 flex flex-wrap gap-2">
            {['ABERTO', 'ATENDENDO', 'CONCLUIDO', 'FINALIZADO'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab}
                <span className="ml-2 text-xs opacity-75">
                  ({schedules.filter(s => s.status?.toUpperCase() === tab).length})
                </span>
              </button>
            ))}
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
                  <TableHead className="font-bold text-gray-900">CLIENTE SOLICITANTE</TableHead>
                  <TableHead className="font-bold text-gray-900">LOCAL DO ATENDIMENTO</TableHead>
                  <TableHead className="font-bold text-gray-900">EQUIPAMENTO</TableHead>
                  <TableHead className="font-bold text-gray-900">NS</TableHead>
                  <TableHead className="font-bold text-gray-900">POTÊNCIA</TableHead>
                  <TableHead className="font-bold text-gray-900">TÉCNICO</TableHead>
                  <TableHead className="font-bold text-gray-900">STATUS</TableHead>
                  <TableHead className="text-right font-bold text-gray-900">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-6xl mb-4">📅</div>
                        <p className="text-lg font-semibold">Nenhum agendamento encontrado</p>
                        <p className="text-sm">Tente ajustar os filtros de busca</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchedules.map((schedule) => {
                    const attendanceClientName = getAttendanceClientName(schedule);
                    const hasEquipment = !!schedule.equipment_id;
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
                        <TableCell className="text-gray-700 font-medium">
                          {schedule.use_default_address ? 'Endereço padrão' : attendanceClientName}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {hasEquipment && schedule.equipment_brand && schedule.equipment_model ? `${schedule.equipment_brand} - ${schedule.equipment_model}` : <span className="text-muted-foreground font-medium">RELATÓRIO SOLICITANTE</span>}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {hasEquipment ? (schedule.equipment_serial || '-') : <span className="text-muted-foreground font-medium">RELATÓRIO SOLICITANTE</span>}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {hasEquipment ? (schedule.equipment_power ? `${schedule.equipment_power} VA` : '-') : <span className="text-muted-foreground font-medium">RELATÓRIO SOLICITANTE</span>}
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
              filteredSchedules.map((schedule) => {
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
                              let date;
                              try {
                                date = schedule.data_hora_agendamento ? new Date(schedule.data_hora_agendamento) : (schedule.scheduled_date ? new Date(`${schedule.scheduled_date}T${schedule.scheduled_time || '00:00'}`) : null);
                                return date && !isNaN(date.getTime()) ? format(date, 'dd/MM/yyyy') : 'Data inválida';
                              } catch {
                                return 'Data inválida';
                              }
                            })()} - {(() => {
                              try {
                                const timeDate = schedule.scheduled_date ? new Date(`${schedule.scheduled_date}T${schedule.scheduled_time || '00:00'}`) : null;
                                return timeDate && !isNaN(timeDate.getTime()) ? format(timeDate, 'HH:mm') : '--:--';
                              } catch {
                                return '--:--';
                              }
                            })()}
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

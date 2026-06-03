import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Skeleton } from '@/components/ui/skeleton';

export default function ScheduleViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [id]);

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/schedules/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSchedule(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('ERRO AO CARREGAR AGENDAMENTO');
      setLoading(false);
      navigate('/schedules');
    }
  };

  const getStatusColor = (schedule) => {
    if (!schedule) return 'bg-gray-500';

    const now = new Date();
    const scheduledTime = schedule.data_hora_agendamento ? new Date(schedule.data_hora_agendamento) : new Date(`${schedule.scheduled_date}T${schedule.scheduled_time || '00:00'}`);
    const minutesDiff = differenceInMinutes(scheduledTime, now);
    const hoursDiff = differenceInHours(scheduledTime, now);

    // Priority 1: REALIZANDO (Em Andamento) always BLUE
    if (schedule.status === 'Em Andamento') {
      return 'bg-blue-500';
    }

    // Priority 2: Atrasado (>1min late AND status≠Em Andamento) → RED
    if (minutesDiff < -1 && schedule.status !== 'Em Andamento') {
      return 'bg-red-500';
    }

    // Priority 3: <12h before → YELLOW
    if (hoursDiff < 12 && hoursDiff >= 0) {
      return 'bg-yellow-500';
    }

    // Priority 4: ≥15h before → GREEN
    if (hoursDiff >= 15) {
      return 'bg-green-500';
    }

    // Default status colors
    switch (schedule.status) {
      case 'Aberto': return 'bg-green-500';
      case 'Finalizado': return 'bg-red-500';
      case 'Realizado': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`${API_BASE_URL}/schedules/${id}`, { status: newStatus }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Recarregar dados do backend para garantir consistência
      await fetchSchedule();
      toast.success('STATUS ATUALIZADO COM SUCESSO');
    } catch (error) {
      toast.error('ERRO AO ATUALIZAR STATUS');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!schedule) {
    return null;
  }

  const client = schedule;
  const equipment = schedule;
  const technician = schedule;

  // Address fields with fallback logic
  const ruaStr = schedule.client_address || '';
  const numStr = schedule.client_number || '';
  const bairroStr = schedule.client_neighborhood || '';
  const cidadeStr = schedule.client_city || '';
  const ufStr = schedule.client_state || '';

  // Determine attendance address based on use_default_address
  let attendanceRuaStr, attendanceNumStr, attendanceBairroStr, attendanceCidadeStr, attendanceUfStr, attendanceClientName;

  if (schedule.use_default_address) {
    // Use client's default address
    attendanceRuaStr = schedule.client_address || '';
    attendanceNumStr = schedule.client_number || '';
    attendanceBairroStr = schedule.client_neighborhood || '';
    attendanceCidadeStr = schedule.client_city || '';
    attendanceUfStr = schedule.client_state || '';
    attendanceClientName = schedule.client_name || '';
  } else if (schedule.use_registered_client && schedule.attendance_client_id) {
    // Use registered client's address
    attendanceRuaStr = schedule.attendance_client_address || '';
    attendanceNumStr = schedule.attendance_client_number || '';
    attendanceBairroStr = schedule.attendance_client_neighborhood || '';
    attendanceCidadeStr = schedule.attendance_client_city || '';
    attendanceUfStr = schedule.attendance_client_state || '';
    attendanceClientName = schedule.attendance_client_name || '';
  } else {
    // Use manually entered address
    attendanceRuaStr = schedule.attendance_address || '';
    attendanceNumStr = schedule.attendance_number || '';
    attendanceBairroStr = schedule.attendance_neighborhood || '';
    attendanceCidadeStr = schedule.attendance_city || '';
    attendanceUfStr = schedule.attendance_state || '';
    attendanceClientName = schedule.attendance_client_name || '';
  }

  // Build a formatted address string for the map search query (using attendance address)
  const addressParts = [];
  if (attendanceRuaStr || attendanceNumStr) {
    addressParts.push([attendanceRuaStr, attendanceNumStr].filter(Boolean).join(', '));
  }
  if (attendanceBairroStr) {
    addressParts.push(attendanceBairroStr);
  }
  if (attendanceCidadeStr || attendanceUfStr) {
    addressParts.push([attendanceCidadeStr, attendanceUfStr].filter(Boolean).join(' - '));
  }
  
  const fullAddress = addressParts.join(' - ');
  const encodedAddress = encodeURIComponent(fullAddress || attendanceClientName || '');
  
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const wazeUrl = `https://waze.com/ul?q=${encodedAddress}`;

  const canChangeStatus = currentUser?.id === schedule.technician_id;

  return (
    <>
      <Helmet>
        <title>{`AGENDAMENTO #${id} - FATTAX`}</title>
        <meta name="description" content="Visualização de agendamento técnico" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/schedules')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              VOLTAR PARA AGENDAMENTOS
            </Button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ letterSpacing: '-0.02em' }}>
                  AGENDAMENTO #{id.slice(-6).toUpperCase()}
                </h1>
                <p className="text-muted-foreground">
                  {(() => {
                    const date = schedule.data_hora_agendamento ? new Date(schedule.data_hora_agendamento) : (schedule.scheduled_date ? new Date(`${schedule.scheduled_date}T${schedule.scheduled_time || '00:00'}`) : null);
                    return date ? format(date, 'dd/MM/yyyy HH:mm') : '-';
                  })()}
                </p>
              </div>
              <Badge className={`${getStatusColor(schedule)} text-white text-lg px-4 py-2`}>
                {schedule.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">CLIENTE SOLICITANTE</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">NOME</p>
                    <p className="font-medium">{schedule.client_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CNPJ/CPF</p>
                    <p className="font-medium">{schedule.client_cnpj_cpf || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">TELEFONE</p>
                    <p className="font-medium">{schedule.client_phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CELULAR</p>
                    <p className="font-medium">{schedule.client_mobile || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">E-MAIL</p>
                    <p className="font-medium">{schedule.client_email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CONTATO TÉCNICO</p>
                    <p className="font-medium">{schedule.client_technical_contact || '-'}</p>
                  </div>
                </div>

                <div className="md:col-span-2 mt-2">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-4 uppercase tracking-wide">
                    ENDEREÇO CADASTRADO
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 md:col-span-2">
                      <p className="text-sm text-muted-foreground">RUA</p>
                      <p className="font-medium">{ruaStr || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">NÚMERO</p>
                      <p className="font-medium">{numStr || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">BAIRRO</p>
                      <p className="font-medium">{bairroStr || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CIDADE</p>
                      <p className="font-medium">{cidadeStr || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">UF</p>
                      <p className="font-medium">{ufStr || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Address Info */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">CLIENTE DO ATENDIMENTO</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">NOME</p>
                  <p className="font-medium">{attendanceClientName || '-'}</p>
                </div>

                <div className="md:col-span-2 mt-2">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-4 uppercase tracking-wide">
                    ENDEREÇO DO ATENDIMENTO
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 md:col-span-2">
                      <p className="text-sm text-muted-foreground">RUA</p>
                      <p className="font-medium">{attendanceRuaStr || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">NÚMERO</p>
                      <p className="font-medium">{attendanceNumStr || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">BAIRRO</p>
                      <p className="font-medium">{attendanceBairroStr || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CIDADE</p>
                      <p className="font-medium">{attendanceCidadeStr || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">UF</p>
                      <p className="font-medium">{attendanceUfStr || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {fullAddress && (
                <div className="mt-6 border-t pt-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button disabled={!fullAddress}>
                        <MapPin className="mr-2 h-4 w-4" />
                        ABRIR NO MAPA (ENDEREÇO DO ATENDIMENTO)
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => window.open(googleMapsUrl, '_blank')}>
                        GOOGLE MAPS
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(wazeUrl, '_blank')}>
                        WAZE
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* Equipment Info - only show if equipment is linked */}
            {schedule.equipment_id && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">INFORMAÇÕES DO EQUIPAMENTO</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">TIPO</p>
                  <p className="font-medium">{schedule.equipment_type || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MARCA</p>
                  <p className="font-medium">{schedule.equipment_brand || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MODELO</p>
                  <p className="font-medium">{schedule.equipment_model || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NÚMERO DE SÉRIE</p>
                  <p className="font-medium">{schedule.equipment_serial || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">POTÊNCIA</p>
                  <p className="font-medium">{schedule.equipment_power ? `${schedule.equipment_power} VA` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TENSÃO ENTRADA</p>
                  <p className="font-medium">{schedule.equipment_voltage_in ? `${schedule.equipment_voltage_in} V` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TENSÃO SAÍDA</p>
                  <p className="font-medium">{schedule.equipment_voltage_out ? `${schedule.equipment_voltage_out} V` : '-'}</p>
                </div>
                {schedule.equipment_current_in && (
                <div>
                  <p className="text-sm text-muted-foreground">CORRENTE ENTRADA</p>
                  <p className="font-medium">{schedule.equipment_current_in ? `${schedule.equipment_current_in} A` : '-'}</p>
                </div>
                )}
                {schedule.voltage_battery && (
                <div>
                  <p className="text-sm text-muted-foreground">TENSÃO BATERIA</p>
                  <p className="font-medium">{schedule.voltage_battery ? `${schedule.voltage_battery} V` : '-'}</p>
                </div>
                )}
                {schedule.battery_type && (
                <div>
                  <p className="text-sm text-muted-foreground">TIPO BATERIA</p>
                  <p className="font-medium">{schedule.battery_type || '-'}</p>
                </div>
                )}
                {schedule.battery_quantity && (
                <div>
                  <p className="text-sm text-muted-foreground">QTD BATERIAS</p>
                  <p className="font-medium">{schedule.battery_quantity || '-'}</p>
                </div>
                )}
                {schedule.battery_volts && (
                <div>
                  <p className="text-sm text-muted-foreground">VOLTS BATERIA</p>
                  <p className="font-medium">{schedule.battery_volts ? `${schedule.battery_volts} V` : '-'}</p>
                </div>
                )}
                {schedule.battery_current && (
                <div>
                  <p className="text-sm text-muted-foreground">CORRENTE BATERIA</p>
                  <p className="font-medium">{schedule.battery_current ? `${schedule.battery_current} A` : '-'}</p>
                </div>
                )}
                {schedule.battery_connection && (
                <div>
                  <p className="text-sm text-muted-foreground">CONEXÃO BATERIA</p>
                  <p className="font-medium">{schedule.battery_connection || '-'}</p>
                </div>
                )}
                {schedule.battery_terminal && (
                <div>
                  <p className="text-sm text-muted-foreground">TERMINAL BATERIA</p>
                  <p className="font-medium">{schedule.battery_terminal || '-'}</p>
                </div>
                )}
                {schedule.battery_brand && (
                <div>
                  <p className="text-sm text-muted-foreground">MARCA BATERIA</p>
                  <p className="font-medium">{schedule.battery_brand || '-'}</p>
                </div>
                )}
                {schedule.battery_model && (
                <div>
                  <p className="text-sm text-muted-foreground">MODELO BATERIA</p>
                  <p className="font-medium">{schedule.battery_model || '-'}</p>
                </div>
                )}
                {schedule.capacity_ah && (
                <div>
                  <p className="text-sm text-muted-foreground">CAPACIDADE (Ah)</p>
                  <p className="font-medium">{schedule.capacity_ah || '-'}</p>
                </div>
                )}
                {schedule.symmetric && (
                <div>
                  <p className="text-sm text-muted-foreground">SIMÉTRICO</p>
                  <p className="font-medium">{schedule.symmetric || '-'}</p>
                </div>
                )}
                {schedule.isolated && (
                <div>
                  <p className="text-sm text-muted-foreground">ISOLADO</p>
                  <p className="font-medium">{schedule.isolated || '-'}</p>
                </div>
                )}
                {schedule.signalizers_quantity && (
                <div>
                  <p className="text-sm text-muted-foreground">QTD SINALIZADORES</p>
                  <p className="font-medium">{schedule.signalizers_quantity || '-'}</p>
                </div>
                )}
                {schedule.ihm && (
                <div>
                  <p className="text-sm text-muted-foreground">IHM</p>
                  <p className="font-medium">{schedule.ihm || '-'}</p>
                </div>
                )}
                {schedule.localizadores && (
                <div>
                  <p className="text-sm text-muted-foreground">LOCALIZADORES</p>
                  <p className="font-medium">{schedule.localizadores || '-'}</p>
                </div>
                )}
                {schedule.communication_cable_type && (
                <div>
                  <p className="text-sm text-muted-foreground">CABO COMUNICAÇÃO</p>
                  <p className="font-medium">{schedule.communication_cable_type || '-'}</p>
                </div>
                )}
                {schedule.fixation && (
                <div>
                  <p className="text-sm text-muted-foreground">FIXAÇÃO</p>
                  <p className="font-medium">{schedule.fixation || '-'}</p>
                </div>
                )}
                {schedule.voltage_type && (
                <div>
                  <p className="text-sm text-muted-foreground">TIPO TENSÃO</p>
                  <p className="font-medium">{schedule.voltage_type || '-'}</p>
                </div>
                )}
              </div>
            </div>

            {/* Schedule Info */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">INFORMAÇÕES DO AGENDAMENTO</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">DATA/HORA</p>
                  <p className="font-medium">
                    {(() => {
                      const date = schedule.data_hora_agendamento ? new Date(schedule.data_hora_agendamento) : (schedule.scheduled_date ? new Date(`${schedule.scheduled_date}T${schedule.scheduled_time || '00:00'}`) : null);
                      return date ? format(date, 'dd/MM/yyyy HH:mm') : '-';
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TÉCNICO RESPONSÁVEL</p>
                  <p className="font-medium">{schedule.technician_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">STATUS</p>
                  {canChangeStatus ? (
                    <Select value={schedule.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aberto">ABERTO</SelectItem>
                        <SelectItem value="Em Andamento">EM ANDAMENTO</SelectItem>
                        <SelectItem value="Realizado">REALIZADO</SelectItem>
                        <SelectItem value="Finalizado">FINALIZADO</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{schedule.status.toUpperCase()}</p>
                  )}
                </div>
                {schedule.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">OBSERVAÇÕES</p>
                    <p className="font-medium whitespace-pre-wrap">{schedule.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
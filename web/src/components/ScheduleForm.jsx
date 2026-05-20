import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSearch } from '@/hooks/useSearch.js';

const STATUS_OPTIONS = ['Aberto', 'Em Andamento', 'Realizado', 'Finalizado'];

export default function ScheduleForm({ schedule, onSave, onCancel }) {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    client_id: '',
    equipment_id: '',
    scheduled_date: '',
    scheduled_time: '',
    status: 'Aberto',
    technician_id: '',
    notes: ''
  });

  const [hasEquipment, setHasEquipment] = useState(true);
  const [clients, setClients] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [clientOpen, setClientOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  const isGerente = currentUser?.role === 'manager' || currentUser?.role === 'Gerente';
  const isTecnico = currentUser?.role === 'Técnico';
  const isEditing = !!schedule;
  const isEditingOwnSchedule = isEditing && schedule.technician_id === currentUser?.id;

  const { 
    searchTerm: clientSearchTerm, 
    setSearchTerm: setClientSearchTerm, 
    filteredItems: filteredClients 
  } = useSearch(clients, ['name', 'cnpj_cpf', 'fantasy_name', 'email']);

  const { 
    searchTerm: equipmentSearchTerm, 
    setSearchTerm: setEquipmentSearchTerm, 
    filteredItems: filteredEquipments 
  } = useSearch(equipments, ['brand', 'model', 'serial_number', 'numero_serie', 'type']);

  useEffect(() => {
    fetchClients();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    if (schedule) {
      console.log('Loading schedule data:', schedule);
      
      const newFormData = {
        client_id: schedule.client_id || '',
        equipment_id: schedule.equipment_id || '',
        scheduled_date: schedule.scheduled_date || '',
        scheduled_time: schedule.scheduled_time || '',
        status: schedule.status && schedule.status !== '' ? schedule.status : 'Aberto',
        technician_id: schedule.technician_id || '',
        notes: schedule.notes || ''
      };
      
      console.log('Setting formData:', newFormData);
      setFormData(newFormData);

      setHasEquipment(!!schedule.equipment_id);

      if (schedule.client_id) {
        fetchClientDetails(schedule.client_id);
        fetchEquipmentsByClient(schedule.client_id);
      }
      if (schedule.equipment_id) {
        fetchEquipmentDetails(schedule.equipment_id);
      }
    }
  }, [schedule]);

  // Efeito adicional para garantir que technician_id seja atualizado quando técnicos carregarem
  useEffect(() => {
    if (schedule && technicians.length > 0) {
      setFormData(prev => ({
        ...prev,
        technician_id: schedule.technician_id || ''
      }));
    }
  }, [technicians, schedule]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setClients(response.data.data || []);
    } catch (error) {
      toast.error('ERRO AO CARREGAR CLIENTES');
    }
  };

  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/schedules/technicians`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTechnicians(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar técnicos:', error);
      toast.error('ERRO AO CARREGAR TÉCNICOS');
    }
  };

  const fetchClientDetails = async (clientId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/clients/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSelectedClient(response.data.data);
    } catch (error) {
      console.error('Error fetching client:', error);
    }
  };

  const fetchEquipmentsByClient = async (clientId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/equipments/by-client/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setEquipments(response.data.data || []);
    } catch (error) {
      toast.error('ERRO AO CARREGAR EQUIPAMENTOS');
    }
  };

  const fetchEquipmentDetails = async (equipmentId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/equipments/${equipmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSelectedEquipment(response.data.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    
    if (name === 'client_id') {
      fetchClientDetails(value);
      fetchEquipmentsByClient(value);
      setFormData(prev => ({ ...prev, equipment_id: '' }));
      setSelectedEquipment(null);
    }
    
    if (name === 'equipment_id') {
      fetchEquipmentDetails(value);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.client_id) newErrors.client_id = 'CLIENTE É OBRIGATÓRIO';
    if (hasEquipment && !formData.equipment_id) newErrors.equipment_id = 'EQUIPAMENTO É OBRIGATÓRIO';
    if (!formData.scheduled_date) newErrors.scheduled_date = 'DATA É OBRIGATÓRIA';
    if (!formData.scheduled_time) newErrors.scheduled_time = 'HORA É OBRIGATÓRIA';
    if (!formData.status) newErrors.status = 'STATUS É OBRIGATÓRIO';
    if (!formData.technician_id) newErrors.technician_id = 'TÉCNICO É OBRIGATÓRIO';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isGerente && !isTecnico) {
      toast.error('VOCÊ NÃO TEM PERMISSÃO PARA SALVAR AGENDAMENTOS');
      return;
    }

    if (isTecnico && isEditingOwnSchedule) {
      if (!formData.status) {
        toast.error('STATUS É OBRIGATÓRIO');
        return;
      }
    } else {
      if (!validate()) {
        toast.error('POR FAVOR, CORRIJA OS ERROS NO FORMULÁRIO');
        return;
      }
    }

    setLoading(true);
    try {
      // Enviar campos separados de data e hora
      const formattedData = {
        ...formData,
        equipment_id: hasEquipment ? formData.equipment_id : null,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time
      };

      if (isTecnico && isEditingOwnSchedule) {
        await onSave(formattedData);
      } else {
        await onSave(formattedData);
      }
    } catch (error) {
      toast.error('ERRO AO SALVAR AGENDAMENTO: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const canEditField = (field) => {
    if (isGerente) return true;
    if (isTecnico) {
      // Técnico pode editar status e observações
      if (field === 'status' || field === 'description') return true;
    }
    return false;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="client_id" className="font-bold">CLIENTE *</Label>
          <Popover open={clientOpen} onOpenChange={(open) => { setClientOpen(open); if (!open) setClientSearchTerm(''); }}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={!canEditField('client_id')}
                className={cn("justify-between font-normal", errors.client_id && "border-destructive")}
              >
                <span className="truncate pr-6">
                  {formData.client_id
                    ? clients.find((client) => client.id === formData.client_id)?.name
                    : "SELECIONE O CLIENTE..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="BUSCAR POR NOME, CNPJ/CPF..." 
                  value={clientSearchTerm}
                  onValueChange={setClientSearchTerm}
                />
                <CommandList>
                  {filteredClients.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">NENHUM CLIENTE ENCONTRADO.</div>
                  ) : (
                    <CommandGroup>
                      {filteredClients.map((client) => (
                        <CommandItem
                          key={client.id}
                          onSelect={() => {
                            handleSelectChange('client_id', client.id);
                            setClientOpen(false);
                            setClientSearchTerm('');
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", formData.client_id === client.id ? "opacity-100" : "opacity-0")} />
                          <div className="flex flex-col">
                            <span>{client.name}</span>
                            <span className="text-xs text-muted-foreground">{client.cnpj_cpf}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.client_id && <p className="text-sm text-destructive mt-1">{errors.client_id}</p>}
        </div>

        <div className="flex flex-col space-y-3">
          <Label className="font-bold">VINCULAR EQUIPAMENTO?</Label>
          <RadioGroup
            value={hasEquipment ? "sim" : "nao"}
            onValueChange={(val) => {
              const hasEq = val === "sim";
              setHasEquipment(hasEq);
              if (!hasEq) {
                setFormData(prev => ({ ...prev, equipment_id: '' }));
                setSelectedEquipment(null);
                if (errors.equipment_id) setErrors(prev => ({ ...prev, equipment_id: '' }));
              }
            }}
            className="flex space-x-4 mt-1"
            disabled={!canEditField('equipment_id')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="eq-sim" />
              <Label htmlFor="eq-sim" className="cursor-pointer">SIM</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="eq-nao" />
              <Label htmlFor="eq-nao" className="cursor-pointer">NÃO</Label>
            </div>
          </RadioGroup>
        </div>

        {hasEquipment && (
          <div className="flex flex-col space-y-1.5 md:col-span-2">
            <Label htmlFor="equipment_id" className="font-bold">EQUIPAMENTO *</Label>
            <Popover open={equipmentOpen} onOpenChange={(open) => { setEquipmentOpen(open); if (!open) setEquipmentSearchTerm(''); }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={!formData.client_id || !canEditField('equipment_id')}
                  className={cn("justify-between font-normal", errors.equipment_id && "border-destructive")}
                >
                  <span className="truncate pr-6">
                    {formData.equipment_id
                      ? (() => {
                          const eq = equipments.find((e) => e.id === formData.equipment_id);
                          return eq ? `${eq.type} - ${eq.brand} ${eq.model}` : "SELECIONE O EQUIPAMENTO...";
                        })()
                      : "SELECIONE O EQUIPAMENTO..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="BUSCAR EQUIPAMENTO..." 
                    value={equipmentSearchTerm}
                    onValueChange={setEquipmentSearchTerm}
                  />
                  <CommandList>
                    {filteredEquipments.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">NENHUM EQUIPAMENTO ENCONTRADO.</div>
                    ) : (
                      <CommandGroup>
                        {filteredEquipments.map((equipment) => (
                          <CommandItem
                            key={equipment.id}
                            onSelect={() => {
                              handleSelectChange('equipment_id', equipment.id);
                              setEquipmentOpen(false);
                              setEquipmentSearchTerm('');
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", formData.equipment_id === equipment.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col">
                              <span>{equipment.type} - {equipment.brand} {equipment.model}</span>
                              <span className="text-xs text-muted-foreground">S/N: {equipment.numero_serie || equipment.serial_number}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.equipment_id && <p className="text-sm text-destructive mt-1">{errors.equipment_id}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="scheduled_date" className="font-bold">DATA *</Label>
            <Input
              type="date"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleChange}
              className={errors.scheduled_date ? 'border-destructive' : ''}
              disabled={!canEditField('scheduled_date')}
            />
            {errors.scheduled_date && <p className="text-sm text-destructive mt-1">{errors.scheduled_date}</p>}
          </div>
          <div>
            <Label htmlFor="scheduled_time" className="font-bold">HORA *</Label>
            <Input
              type="time"
              name="scheduled_time"
              value={formData.scheduled_time}
              onChange={handleChange}
              className={errors.scheduled_time ? 'border-destructive' : ''}
              disabled={!canEditField('scheduled_time')}
            />
            {errors.scheduled_time && <p className="text-sm text-destructive mt-1">{errors.scheduled_time}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="status" className="font-bold">STATUS *</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleSelectChange('status', value)}
            disabled={!canEditField('status')}
          >
            <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
              <SelectValue placeholder="SELECIONE O STATUS" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-destructive mt-1">{errors.status}</p>}
        </div>

        <div>
          <Label htmlFor="technician_id" className="font-bold">TÉCNICO RESPONSÁVEL *</Label>
          <Select 
            value={formData.technician_id} 
            onValueChange={(value) => handleSelectChange('technician_id', value)}
            disabled={!canEditField('technician_id')}
          >
            <SelectTrigger className={errors.technician_id ? 'border-destructive' : ''}>
              <SelectValue placeholder="SELECIONE O TÉCNICO" />
            </SelectTrigger>
            <SelectContent>
              {technicians.map((tech) => (
                <SelectItem key={tech.id} value={String(tech.id)}>
                  {tech.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.technician_id && <p className="text-sm text-destructive mt-1">{errors.technician_id}</p>}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notes" className="font-bold">OBSERVAÇÕES</Label>
          <Textarea 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange} 
            rows={3}
            disabled={!canEditField('description')}
            onInput={(e) => e.target.value = e.target.value.toUpperCase()}
          />
        </div>
      </div>

      {selectedClient && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">INFORMAÇÕES DO CLIENTE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p><span className="font-medium">CNPJ/CPF:</span> {selectedClient.cnpj_cpf}</p>
            <p><span className="font-medium">TELEFONE:</span> {selectedClient.phone || selectedClient.mobile}</p>
            <p><span className="font-medium">E-MAIL:</span> {selectedClient.email}</p>
            <p className="md:col-span-2">
              <span className="font-medium">ENDEREÇO:</span> {selectedClient.rua || selectedClient.address}, {selectedClient.numero || selectedClient.number} - {selectedClient.bairro || selectedClient.neighborhood} - {selectedClient.cidade || selectedClient.city}/{selectedClient.uf || selectedClient.state}
            </p>
          </div>
        </div>
      )}

      {hasEquipment && selectedEquipment && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">INFORMAÇÕES DO EQUIPAMENTO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p><span className="font-medium">TIPO:</span> {selectedEquipment.type}</p>
            <p><span className="font-medium">MARCA:</span> {selectedEquipment.brand}</p>
            <p><span className="font-medium">MODELO:</span> {selectedEquipment.model}</p>
            <p><span className="font-medium">NÚMERO DE SÉRIE:</span> {selectedEquipment.numero_serie || selectedEquipment.serial_number}</p>
            {selectedEquipment.power_va && (
              <p className="md:col-span-2"><span className="font-medium">POTÊNCIA:</span> {selectedEquipment.power_va} VA</p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>CANCELAR</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'SALVANDO...' : isEditing ? 'ATUALIZAR' : 'SALVAR'}
        </Button>
      </div>
    </form>
  );
}
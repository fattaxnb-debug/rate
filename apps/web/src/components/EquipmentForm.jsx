import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils.js';

import { toast } from 'sonner';

import axios from 'axios';

import { API_BASE_URL } from '@/config/api.js';

import { useSearch } from '@/hooks/useSearch.js';

const EQUIPMENT_TYPES = ['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico', 'Monitor de Bateria'];

const BATTERY_TYPES = ['Interno', 'Externo'];

const VOLTAGE_TYPES = ['TRIFÁSICA', 'TRIMONO', 'MONOFÁSICA'];

const BATTERY_CONNECTION_TYPES = ['CABOS', 'BARRAS', 'CABOS E BARRAS'];

const YES_NO = ['Sim', 'Não'];

export default function EquipmentForm({

  equipment,

  onSave,

  onCancel,

  readOnly = false

}) {

  const [formData, setFormData] = useState({

    type: '',

    brand: '',

    model: '',

    serial_number: '',

    client_id: '',

    installation_date: '',

    power_va: '',

    voltage_in: '',

    voltage_out: '',

    voltage_battery: '',

    battery_type: '',

    battery_quantity: '',

    battery_volts: '',

    battery_current: '',

    battery_connection: '',

    battery_terminal: '',

    battery_brand: '',

    battery_model: '',

    capacity_ah: '',

    symmetric: '',

    isolated: '',

    signalizers_quantity: '',

    ihm: '',

    localizadores: '',

    communication_cable_type: '',

    fixation: '',

    quantity: '',

    voltage_type: ''

  });

  const [clients, setClients] = useState([]);

  const [selectedClient, setSelectedClient] = useState(null);

  const [clientOpen, setClientOpen] = useState(false);

  const {

    searchTerm: clientSearchTerm,

    setSearchTerm: setClientSearchTerm,

    filteredItems: filteredClients

  } = useSearch(clients, ['name', 'cnpj_cpf', 'fantasy_name', 'email']);

  useEffect(() => {

    fetchClients();

  }, []);

  useEffect(() => {

    if (equipment) {

      const parsedDate = equipment.installation_date ? equipment.installation_date.split(' ')[0].split('T')[0] : '';

      setFormData({

        type: equipment.type || '',

        brand: equipment.brand || '',

        model: equipment.model || '',

        serial_number: equipment.serial_number || '',

        client_id: equipment.client_id || '',

        installation_date: parsedDate,

        power_va: equipment.power_va || '',

        voltage_in: equipment.voltage_in || '',

        voltage_out: equipment.voltage_out || '',

        voltage_battery: equipment.voltage_battery || '',

        battery_type: equipment.battery_type || '',

        battery_quantity: equipment.battery_quantity || '',

        battery_volts: equipment.battery_volts || '',

        battery_current: equipment.battery_current || '',

        battery_connection: equipment.battery_connection || '',

        battery_terminal: equipment.battery_terminal || '',

        battery_brand: equipment.battery_brand || '',

        battery_model: equipment.battery_model || '',

        capacity_ah: equipment.capacity_ah || '',

        symmetric: equipment.symmetric || '',

        isolated: equipment.isolated || '',

        signalizers_quantity: equipment.signalizers_quantity || '',

        ihm: equipment.ihm || '',

        localizadores: equipment.localizadores || '',

        communication_cable_type: equipment.communication_cable_type || '',

        fixation: equipment.fixation || '',

        quantity: equipment.quantity || '',

        voltage_type: equipment.voltage_type || ''

      });

      if (equipment.client_id) {

        fetchClientDetails(equipment.client_id);

      }

    }

  }, [equipment]);

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

  const fetchClientDetails = async clientId => {

    try {

      const token = localStorage.getItem('auth_token');

      const response = await axios.get(`${API_BASE_URL}/clients/${clientId}`, {

        headers: { 'Authorization': `Bearer ${token}` }

      });

      setSelectedClient(response.data.data);

    } catch (error) {

      console.error('Error fetching client:', error);

      setSelectedClient(null);

    }

  };

  const handleChange = e => {

    if (readOnly) return;

    const {

      name,

      value

    } = e.target;

    setFormData(prev => ({

      ...prev,

      [name]: value

    }));

  };

  const handleSelectChange = (name, value) => {

    if (readOnly) return;

    setFormData(prev => ({

      ...prev,

      [name]: value

    }));

    if (name === 'client_id') {

      fetchClientDetails(value);

    }

    if (name === 'type') {

      const needsVoltage = ['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico'].includes(value);

      if (!needsVoltage) {

        setFormData(prev => ({

          ...prev,

          voltage_type: '',

          power_va: '',

          voltage_in: '',

          voltage_out: '',

          isolated: ''

        }));

      }

      if (value !== 'Nobreak') {

        setFormData(prev => ({

          ...prev,

          symmetric: '',

          battery_type: '',

          battery_quantity: '',

          battery_volts: '',

          battery_current: '',

          battery_connection: '',

          battery_terminal: '',

          battery_brand: '',

          battery_model: ''

        }));

      }

      if (value !== 'IT Médico') {

        setFormData(prev => ({

          ...prev,

          signalizers_quantity: '',

          ihm: '',

          localizadores: ''

        }));

      }

      if (value !== 'Monitor de Bateria' && value !== 'Nobreak') {

        setFormData(prev => ({

          ...prev,

          voltage_battery: '',

          capacity_ah: ''

        }));

      }

      if (value !== 'Monitor de Bateria') {

        setFormData(prev => ({

          ...prev,

          communication_cable_type: '',

          fixation: '',

          quantity: ''

        }));

      }

    }

  };

  const handleSubmit = async e => {

    e.preventDefault();

    if (readOnly) return;

    console.log("Validating equipment form data:", formData);

    if (!formData.type || !formData.brand?.trim() || !formData.model?.trim() || !formData.serial_number?.trim() || !formData.client_id) {

      toast.error('PREENCHA TODOS OS CAMPOS OBRIGATÓRIOS (*)');

      return;

    }

    const needsPowerAndVoltage = ['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico'].includes(formData.type);

    if (needsPowerAndVoltage && !formData.voltage_type) {

      toast.error('O CAMPO TIPO DE TENSÃO É OBRIGATÓRIO PARA ESTE TIPO DE EQUIPAMENTO.');

      return;

    }

    try {

      const dataToSave = {

        ...formData

      };



      // Cleanup empty values to match schema types

      Object.keys(dataToSave).forEach(key => {

        if (dataToSave[key] === '' || dataToSave[key] === null) {

          delete dataToSave[key];

        }

      });



      // Ensure numeric fields are parsed correctly if they exist

      const numericFields = ['power_va', 'voltage_in', 'voltage_out', 'voltage_battery', 'battery_quantity', 'battery_volts', 'capacity_ah', 'signalizers_quantity', 'quantity'];

      numericFields.forEach(field => {

        if (dataToSave[field] !== undefined) {

          dataToSave[field] = Number(dataToSave[field]);

        }

      });



      // Ensure date is formatted correctly

      if (dataToSave.installation_date) {

        dataToSave.installation_date = new Date(dataToSave.installation_date).toISOString();

      }

      console.log("Submitting equipment data:", dataToSave);

      await onSave(dataToSave);

    } catch (error) {

      console.error("Equipment save error:", error);

      toast.error('ERRO AO SALVAR EQUIPAMENTO: ' + error.message);

    }

  };

  const needsPowerAndVoltage = ['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico'].includes(formData.type);

  return <form onSubmit={handleSubmit} className="space-y-6">

      <div className="md:col-span-2">

        <Label>CLIENTE *</Label>

        <Popover open={clientOpen} onOpenChange={open => {

        setClientOpen(open);

        if (!open) setClientSearchTerm('');

      }}>

          <PopoverTrigger asChild>

            <Button variant="outline" role="combobox" aria-expanded={clientOpen} className="justify-between font-normal w-full" disabled={readOnly}>

              <span className="truncate block pr-6">

                {formData.client_id ? clients.find(c => c.id === formData.client_id)?.name : "SELECIONE O CLIENTE..."}

              </span>

              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />

            </Button>

          </PopoverTrigger>

          <PopoverContent className="w-[400px] p-0">

            <Command shouldFilter={false}>

              <CommandInput placeholder="BUSCAR POR NOME, CNPJ/CPF..." value={clientSearchTerm} onValueChange={setClientSearchTerm} disabled={readOnly} />

              <CommandList>

                {filteredClients.length === 0 ? <div className="py-6 text-center text-sm text-muted-foreground">NENHUM CLIENTE ENCONTRADO.</div> : <CommandGroup>

                    {filteredClients.map(client => <CommandItem key={client.id} value={client.id} onSelect={() => !readOnly && handleSelectChange('client_id', client.id)} disabled={readOnly}>

                        <Check className={cn("mr-2 h-4 w-4", formData.client_id === client.id ? "opacity-100" : "opacity-0")} />

                        <div className="flex flex-col">

                          <span>{client.name}</span>

                          <span className="text-xs text-muted-foreground">{client.cnpj_cpf}</span>

                        </div>

                      </CommandItem>)}

                  </CommandGroup>}

              </CommandList>

            </Command>

          </PopoverContent>

        </Popover>

      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        <div>

          <Label>TIPO DO EQUIPAMENTO</Label>

          <Select value={formData.type} onValueChange={v => handleSelectChange('type', v)} disabled={readOnly}>

            <SelectTrigger><SelectValue placeholder="SELECIONE O TIPO" /></SelectTrigger>

            <SelectContent>

              {EQUIPMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}

            </SelectContent>

          </Select>

        </div>



        <div>

          <Label>MARCA *</Label>

          <Input name="brand" value={formData.brand} onChange={handleChange} disabled={readOnly} />

        </div>



        <div>

          <Label>MODELO *</Label>

          <Input name="model" value={formData.model} onChange={handleChange} disabled={readOnly} />

        </div>



        <div>

          <Label>NÚMERO DE SÉRIE *</Label>

          <Input name="serial_number" value={formData.serial_number} onChange={handleChange} disabled={readOnly} />

        </div>



        <div>

          <Label>DATA DE INSTALAÇÃO</Label>

          <Input name="installation_date" type="date" value={formData.installation_date} onChange={handleChange} disabled={readOnly} />

        </div>

      </div>



      {needsPowerAndVoltage && <div className="space-y-4 pt-4 border-t">

          <h3 className="font-semibold text-lg uppercase">ESPECIFICAÇÕES PRINCIPAIS</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div>

              <Label>TIPO DE TENSÃO *</Label>

              <Select value={formData.voltage_type} onValueChange={v => handleSelectChange('voltage_type', v)} disabled={readOnly}>

                <SelectTrigger className={!formData.voltage_type && !readOnly ? "border-destructive" : ""}><SelectValue placeholder="SELECIONE A TENSÃO" /></SelectTrigger>

                <SelectContent>

                  {VOLTAGE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}

                </SelectContent>

              </Select>

            </div>

            <div>

              <Label>POTÊNCIA (VA)</Label>

              <Input name="power_va" type="number" value={formData.power_va} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>TENSÃO ENTRADA (V)</Label>

              <Input name="voltage_in" type="number" value={formData.voltage_in} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>TENSÃO SAÍDA (V)</Label>

              <Input name="voltage_out" type="number" value={formData.voltage_out} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>ISOLADO</Label>

              <Select value={formData.isolated || ''} onValueChange={v => handleSelectChange('isolated', v)} disabled={readOnly}>

                <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>

                <SelectContent>

                  {YES_NO.map(opt => <SelectItem key={opt} value={opt}>{opt.toUpperCase()}</SelectItem>)}

                </SelectContent>

              </Select>

            </div>

          </div>

        </div>}



      {formData.type === 'Nobreak' && <div className="space-y-4 pt-4 border-t">

          <h3 className="font-semibold text-lg uppercase">ESPECIFICAÇÕES DE BATERIA</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>

              <Label>MARCA</Label>

              <Input name="battery_brand" value={formData.battery_brand} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>MODELO</Label>

              <Input name="battery_model" value={formData.battery_model} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>TENSÃO DAS BATERIAS (VDC)</Label>

              <Input name="voltage_battery" type="number" value={formData.voltage_battery} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>QUANTIDADE DE BATERIAS</Label>

              <Input name="battery_quantity" type="number" value={formData.battery_quantity} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>BATERIA VOLTS (VDC)</Label>

              <Input name="battery_volts" type="number" value={formData.battery_volts} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>CORRENTE BATERIA (AH/W)</Label>

              <Input name="battery_current" value={formData.battery_current} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>CONEXÃO DE BATERIAS</Label>

              <Select value={formData.battery_connection || ''} onValueChange={v => handleSelectChange('battery_connection', v)} disabled={readOnly}>

                <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>

                <SelectContent>

                  {BATTERY_CONNECTION_TYPES.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}

                </SelectContent>

              </Select>

            </div>

            <div>

              <Label>TERMINAL DE BATERIAS</Label>

              <Input name="battery_terminal" value={formData.battery_terminal} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>SIMÉTRICO</Label>

              <Select value={formData.symmetric || ''} onValueChange={v => handleSelectChange('symmetric', v)} disabled={readOnly}>

                <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>

                <SelectContent>

                  {YES_NO.map(opt => <SelectItem key={opt} value={opt}>{opt.toUpperCase()}</SelectItem>)}

                </SelectContent>

              </Select>

            </div>

            <div>

              <Label>BANCO DE BATERIAS</Label>

              <Select value={formData.battery_type || ''} onValueChange={v => handleSelectChange('battery_type', v)} disabled={readOnly}>

                <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>

                <SelectContent>

                  {BATTERY_TYPES.map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}

                </SelectContent>

              </Select>

            </div>



            

          </div>

        </div>}



      {formData.type === 'IT Médico' && <div className="space-y-4 pt-4 border-t">

          <h3 className="font-semibold text-lg uppercase">ESPECIFICAÇÕES IT MÉDICO</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div>

              <Label>QTD. SINALIZADORES</Label>

              <Input name="signalizers_quantity" type="number" value={formData.signalizers_quantity} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>IHM</Label>

              <Select value={formData.ihm || ''} onValueChange={v => handleSelectChange('ihm', v)} disabled={readOnly}>

                <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>

                <SelectContent>

                  {YES_NO.map(opt => <SelectItem key={opt} value={opt}>{opt.toUpperCase()}</SelectItem>)}

                </SelectContent>

              </Select>

            </div>

            <div>

              <Label>LOCALIZADORES</Label>

              <Select value={formData.localizadores || ''} onValueChange={v => handleSelectChange('localizadores', v)} disabled={readOnly}>

                <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>

                <SelectContent>

                  {YES_NO.map(opt => <SelectItem key={opt} value={opt}>{opt.toUpperCase()}</SelectItem>)}

                </SelectContent>

              </Select>

            </div>

          </div>

        </div>}



      {formData.type === 'Monitor de Bateria' && <div className="space-y-4 pt-4 border-t">

          <h3 className="font-semibold text-lg uppercase">ESPECIFICAÇÕES MONITOR DE BATERIA</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div>

              <Label>TENSÃO DA BATERIA (VDC)</Label>

              <Input name="voltage_battery" type="number" value={formData.voltage_battery} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>CAPACIDADE (AH/W)</Label>

              <Input name="capacity_ah" type="number" value={formData.capacity_ah} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>TIPO DE CABO DE COMUNICAÇÃO</Label>

              <Input name="communication_cable_type" value={formData.communication_cable_type} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>QUANTIDADE</Label>

              <Input name="quantity" type="number" value={formData.quantity} onChange={handleChange} disabled={readOnly} />

            </div>

            <div>

              <Label>FIXAÇÃO</Label>

              <Input name="fixation" value={formData.fixation} onChange={handleChange} disabled={readOnly} />

            </div>

          </div>

        </div>}



      {selectedClient && <div className="bg-muted p-5 rounded-lg border mt-6">

          <h3 className="font-semibold text-lg mb-4 uppercase">INFORMAÇÕES DO CLIENTE SELECIONADO</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">

            <p><span className="font-medium">NOME / RAZÃO SOCIAL:</span> {selectedClient.name}</p>

            <p><span className="font-medium">CNPJ / CPF:</span> {selectedClient.cnpj_cpf || '-'}</p>

            <p><span className="font-medium">TELEFONE:</span> {selectedClient.phone || selectedClient.mobile || '-'}</p>

            <p><span className="font-medium">EMAIL:</span> {selectedClient.email || '-'}</p>

            <p className="md:col-span-2"><span className="font-medium">ENDEREÇO:</span> {selectedClient.address || selectedClient.rua || '-'}, {selectedClient.number || selectedClient.numero || '-'}</p>

            <p><span className="font-medium">BAIRRO:</span> {selectedClient.neighborhood || selectedClient.bairro || '-'}</p>

            <p><span className="font-medium">CIDADE / ESTADO:</span> {selectedClient.city || selectedClient.cidade || '-'} - {selectedClient.state || selectedClient.uf || '-'}</p>

          </div>

        </div>}



      <div className="flex justify-end space-x-4 pt-4">

        <Button type="button" variant="outline" onClick={onCancel}>

          {readOnly ? 'FECHAR' : 'CANCELAR'}

        </Button>

        {!readOnly && <Button type="submit">SALVAR EQUIPAMENTO</Button>}

      </div>

    </form>;

}
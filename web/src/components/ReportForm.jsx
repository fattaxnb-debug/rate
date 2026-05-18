
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Upload, X, ZoomIn, ArrowRight, ArrowLeft, Save, Settings2, Zap, Battery, Activity, FileText, Image as ImageIcon, PenTool, MonitorSmartphone, AlertCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSearch } from '@/hooks/useSearch.js';
import { compressReportPhoto } from '@/utils/imageCompression.js';
import SignatureCanvas from 'react-signature-canvas';
import { cn } from '@/lib/utils.js';
import EquipmentSelectionModal from '@/components/EquipmentSelectionModal.jsx';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/config/api.js';

const INSTALLATION_LOCATION_OPTIONS = ['ADEQUADO', 'INADEQUADO'];
const POWER_SUPPLY_TYPES = ['CIRCUITO', 'TOMADA', 'TOMADA INDUSTRIAL Industrial'];
const BATTERY_TYPES = ['INTERNO', 'EXTERNO'];
const COOLED_ENV_OPTIONS = ['SIM', 'NÃO'];
const EXTERNAL_BATTERY_CONNECTION_OPTIONS = ['DISJUNTOR', 'BORNE', 'DIRETO'];
const YES_NO_OPTIONS = ['SIM', 'NÃO'];

export default function ReportForm() {
  const { clientId, scheduleId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');
  const [activeTab, setActiveTab] = useState('equipment');
  const [activeAccordion, setActiveAccordion] = useState('equipment');
  const [isMobile, setIsMobile] = useState(false);
  const [isReadOnly] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  
  const [clients, setClients] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [clientEquipments, setClientEquipments] = useState([]);
  const [clientOpen, setClientOpen] = useState(false);
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [createdDate, setCreatedDate] = useState(new Date());
  
  const { searchTerm: clientSearchTerm, setSearchTerm: setClientSearchTerm, filteredItems: filteredClients } = useSearch(clients, ['name', 'cnpj_cpf']);
  
  const [formData, setFormData] = useState({
    client_id: clientId || '',
    equipment_id: '',
    technician_id: currentUser?.role === 'Técnico' ? currentUser.id : '',
    schedule_id: scheduleId || '',
    service_order_number: '',
    service_type: '',
    responsible_person: '',
    installation_location: '',
    installation_location_explanation: '',
    power_supply_type: '',
    breaker: '',
    cable_entry_phase: '',
    cable_entry_neutral: '',
    cable_entry_ground: '',
    cable_exit_phase: '',
    cable_exit_neutral: '',
    external_inspection: '',
    internal_inspection: '',
    attendance_description: '',
    diagnosis: '',
    conclusion: '',
    cooled_environment: '',
    electrical_measurements: { entrada: { tensions: {}, currents: {} }, saida: { tensions: {}, currents: {} } },
    battery_bank: { 
      type: '', 
      quantity: '', 
      battery_volts: '',
      battery_current: '',
      voltage: '', 
      voltage_positive_neutral: '',
      voltage_neutral_negative: '',
      charger_voltage: '', 
      brand: '', 
      model: '',
      trocou_baterias: '',
      last_change: '',
      motivo_nao_troca: ''
    },
    external_battery_positive_cable: '',
    external_battery_negative_cable: '',
    external_battery_neutral_cable: '',
    external_battery_connection: '',
    external_battery_nobreak_connection: '',
    technician_signature: '',
    client_signature: '',
    technician_edit_count: 0
  });

  const [selectedEquipmentData, setSelectedEquipmentData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [zoomPhoto, setZoomPhoto] = useState(null);
  const clientSigPad = useRef(null);
  const techSigPad = useRef(null);

  const isTech = currentUser?.role === 'Técnico';
  const isGerente = currentUser?.role === 'Gerente' || currentUser?.role === 'Admin';

  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    initForm();
  }, [clientId, scheduleId]);

  const initForm = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('[REPORT FORM DEBUG] API_BASE_URL:', API_BASE_URL);
      console.log('[REPORT FORM DEBUG] Token:', token ? 'Present' : 'Missing');
      console.log('[REPORT FORM DEBUG] Fetching clients from:', `${API_BASE_URL}/clients`);
      console.log('[REPORT FORM DEBUG] Fetching technicians from:', `${API_BASE_URL}/schedules/technicians`);
      const [clientsRes, techRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/clients`, { headers: { 'Authorization': `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/schedules/technicians`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      console.log('[REPORT FORM DEBUG] Clients response:', clientsRes.data);
      console.log('[REPORT FORM DEBUG] Technicians response:', techRes.data);
      
      setClients(clientsRes.data.data || []);
      setTechnicians(techRes.data.data || []);
      
      if (clientId) {
        await fetchClientEquipments(clientId);
      }
      
      if (scheduleId) {
        const scheduleRes = await axios.get(`${API_BASE_URL}/schedules/${scheduleId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const schedule = scheduleRes.data.data;
        if (!formData.client_id) {
          setFormData(prev => ({ ...prev, client_id: schedule.client_id }));
          await fetchClientEquipments(schedule.client_id);
        }
      }
      
      await generateNextOsNumber();
      
      if (formData.technician_id || currentUser?.id) {
        await handleTechnicianSignature(formData.technician_id || currentUser.id);
      }
      
      setLoading(false);
    } catch (error) {
      toast.error('Erro ao carregar dados do formulário');
      setLoading(false);
    }
  };

  const generateNextOsNumber = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const reportsRes = await axios.get(`${API_BASE_URL}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reports = reportsRes.data.data || [];
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      let nextSeq = 1;
      if (reports.length > 0 && reports[0].service_order_number) {
        const match = reports[0].service_order_number.match(/RAT-\d{6}-(\d+)/);
        if (match) nextSeq = parseInt(match[1], 10) + 1;
      }
      setFormData(prev => ({ ...prev, service_order_number: `RAT-${yearMonth}-${nextSeq.toString().padStart(4, '0')}` }));
    } catch (e) {}
  };

  const fetchClientEquipments = async (cId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const eqsRes = await axios.get(`${API_BASE_URL}/equipments?client_id=${cId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setClientEquipments(eqsRes.data.data || []);
    } catch (e) {
      toast.error('Erro ao carregar equipamentos do cliente');
    }
  };

  const handleTechnicianSignature = async (techId) => {
    if (!techId) return;
    
    try {
      const tech = technicians.find(t => t.id === techId);
      const techName = tech?.name?.toUpperCase() || '';
      
      // Simplificado - não carrega assinatura predefinida por enquanto
      // Backend não tem endpoint para company_settings ainda
    } catch (e) {
      console.error('Error loading technician signature:', e);
    }
  };

  const handleTechChange = async (techId) => {
    setFormData(prev => ({ ...prev, technician_id: techId }));
    await handleTechnicianSignature(techId);
  };

  const handleClientChange = async (cId) => {
    setFormData(prev => ({ ...prev, client_id: cId, equipment_id: '' }));
    setSelectedEquipmentData(null);
    await fetchClientEquipments(cId);
    setValidationErrors([]);
  };

  const selectEquipment = (eq) => {
    setFormData(prev => ({ ...prev, equipment_id: eq.id }));
    setSelectedEquipmentData(eq);
    setEquipmentModalOpen(false);
    setValidationErrors([]);
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.client_id) errors.push('Selecione um cliente.');
    if (!formData.technician_id) errors.push('Selecione um Técnico Responsável.');
    if (!formData.equipment_id) errors.push('Selecione um equipamento.');
    
    setValidationErrors(errors);
    if (errors.length > 0) {
      toast.error('Preencha os campos obrigatórios antes de salvar.');
      return false;
    }
    return true;
  };

  const hasBattery = selectedEquipmentData?.type === 'Nobreak' || selectedEquipmentData?.type === 'Monitor de Bateria';
  const hasExternalBattery = selectedEquipmentData?.type === 'Nobreak' && selectedEquipmentData?.battery_type === 'Externo';
  const isSymmetric = selectedEquipmentData?.symmetric === 'Sim';
  const isBatteryMonitor = selectedEquipmentData?.type === 'Monitor de Bateria';
  const trocouBaterias = formData.battery_bank.trocou_baterias;
  const tabsOrder = isBatteryMonitor 
    ? ['equipment', 'installation', 'battery', 'attendance', 'photos', 'signatures']
    : ['equipment', 'installation', 'electrical', ...(hasBattery ? ['battery'] : []), 'attendance', 'photos', 'signatures'];

  const handleNextTab = () => {
    // Fechar modais antes de navegar
    setClientOpen(false);
    setEquipmentModalOpen(false);
    setDatePickerOpen(false);
    setZoomPhoto(null);
    
    const idx = tabsOrder.indexOf(activeTab);
    if (idx < tabsOrder.length - 1) {
      setActiveTab(tabsOrder[idx + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevTab = () => {
    // Fechar modais antes de navegar
    setClientOpen(false);
    setEquipmentModalOpen(false);
    setDatePickerOpen(false);
    setZoomPhoto(null);
    
    const idx = tabsOrder.indexOf(activeTab);
    if (idx > 0) {
      setActiveTab(tabsOrder[idx - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleConfirmSignature = () => {
    if (clientSigPad.current && !clientSigPad.current.isEmpty()) {
      const base64 = clientSigPad.current.toDataURL('image/png');
      updateField('client_signature', base64);
      toast.success('Assinatura confirmada com sucesso');
    } else {
      toast.error('Por favor, assine antes de confirmar');
    }
  };

  const clearClientSignature = () => {
    if (clientSigPad.current) {
      clientSigPad.current.clear();
    }
  };

  const redrawClientSignature = () => {
    updateField('client_signature', '');
    setTimeout(() => {
      if (clientSigPad.current) {
        clientSigPad.current.clear();
      }
    }, 50);
  };

  const handleConfirmTechSignature = () => {
    if (techSigPad.current && !techSigPad.current.isEmpty()) {
      const base64 = techSigPad.current.toDataURL('image/png');
      updateField('technician_signature', base64);
      toast.success('Assinatura do técnico confirmada com sucesso');
    } else {
      toast.error('Por favor, assine antes de confirmar');
    }
  };

  const clearTechSignature = () => {
    if (techSigPad.current) {
      techSigPad.current.clear();
    }
  };

  const redrawTechSignature = () => {
    updateField('technician_signature', '');
    setTimeout(() => {
      if (techSigPad.current) {
        techSigPad.current.clear();
      }
    }, 50);
  };

  const processPhotos = async (recordId) => {
    const token = localStorage.getItem('auth_token');
    for (const photo of photos) {
      if (photo.file) {
        const formDataObj = new FormData();
        formDataObj.append('report_id', recordId);
        formDataObj.append('photo_url', photo.file);
        formDataObj.append('comment', photo.comment || '');
        formDataObj.append('photo_type', photo.photo_type || '');
        if (photo.sequence) formDataObj.append('sequence', photo.sequence);
        await axios.post(`${API_BASE_URL}/report-photos`, formDataObj, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }
    }
  };

  const handleCreateDraft = async () => {
    if (!validateForm()) return;
    setSaving(true);
    
    const isTecnico = currentUser?.role === 'Técnico';
    
    // Formatar data local sem conversão para UTC
    const formatDateLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const payload = { 
      ...formData,
      attendance_date_time: new Date().toISOString(),
      created_date: formatDateLocal(createdDate),
      external_battery_positive_cable: formData.external_battery_positive_cable || null,
      external_battery_negative_cable: formData.external_battery_negative_cable || null,
      external_battery_neutral_cable: formData.external_battery_neutral_cable || null,
      external_battery_connection: formData.external_battery_connection || null,
      external_battery_nobreak_connection: formData.external_battery_nobreak_connection || null,
      technician_edit_count: 0,
      status: isTecnico ? 'finalizado' : 'draft'
    };
    
    try {
      const token = localStorage.getItem('auth_token');
      const record = await axios.post(`${API_BASE_URL}/reports`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await processPhotos(record.data.data.id);
      
      toast.success('Relatório salvo com sucesso!');
      navigate(`/reports/${record.data.data.id}`);
    } catch (error) {
      toast.error('Erro ao criar relatório: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    
    // Formatar data local sem conversão para UTC
    const formatDateLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const payload = { 
      client_id: formData.client_id,
      equipment_id: formData.equipment_id,
      technician_id: formData.technician_id,
      created_date: formatDateLocal(createdDate),
      service_order_number: formData.service_order_number,
      service_type: formData.service_type,
      status: 'draft',
      technician_edit_count: 0
    };
    
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_BASE_URL}/reports`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Relatório criado com sucesso!');
      navigate('/reports');
    } catch (error) {
      toast.error('Erro ao criar relatório: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  const updateElectrical = (section, type, field, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      if (!updated.electrical_measurements[section]) updated.electrical_measurements[section] = { tensions: {}, currents: {} };
      
      if (type === 'frequency') {
        updated.electrical_measurements[section].frequency = value;
      } else {
        if (!updated.electrical_measurements[section][type]) updated.electrical_measurements[section][type] = {};
        updated.electrical_measurements[section][type][field] = value;
      }
      return updated;
    });
  };

  const updateBattery = (field, value) => {
    setFormData(prev => ({ ...prev, battery_bank: { ...prev.battery_bank, [field]: value } }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const { file: compressedFile, dataUrl } = await compressReportPhoto(file);
        setPhotos(prev => [...prev, { id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, url: dataUrl, file: compressedFile, comment: '', sequence: prev.length + 1 }]);
      } catch (error) {
        toast.error('Erro ao processar imagem');
      }
    }
  };

  const updatePhoto = (photoId, field, value) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, [field]: value } : p));
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const formatDateForDisplay = (isoDate) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      return format(date, 'dd/MM/yyyy');
    } catch {
      return '';
    }
  };

  const renderEquipmentContent = () => (
    <div className="mt-0 space-y-6 h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <div className="space-y-2">
          <Label className="font-bold uppercase">Cliente <span className="text-destructive">*</span></Label>
          <Popover open={clientOpen} onOpenChange={(o) => { if(!isReadOnly) { setClientOpen(o); if (!o) setClientSearchTerm(''); } }} onInteractOutside={(e) => e.preventDefault()}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={clientOpen} className={cn("w-full justify-between font-normal text-left", !formData.client_id && validationErrors.length > 0 && "border-destructive")}>
                <span className="truncate">{formData.client_id ? clients.find(c => c.id === formData.client_id)?.name : "Selecione o cliente..."}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 z-50" align="start">
              <Command shouldFilter={false}>
                <CommandInput placeholder="Buscar por nome ou CNPJ..." value={clientSearchTerm} onValueChange={setClientSearchTerm} />
                <CommandList>
                  {filteredClients.length === 0 ? <div className="p-4 text-center text-sm text-muted-foreground">Nenhum cliente.</div> : (
                    <CommandGroup>
                      {filteredClients.map(c => (
                        <CommandItem key={c.id} value={c.id} onSelect={() => { handleClientChange(c.id); setClientOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.client_id === c.id ? "opacity-100" : "opacity-0")} />
                          <div className="flex flex-col">
                            <span>{c.name}</span>
                            <span className="text-xs text-muted-foreground">{c.cnpj_cpf}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label className="font-bold uppercase">Técnico Responsável <span className="text-destructive">*</span></Label>
          <Select value={formData.technician_id} onValueChange={handleTechChange} disabled={isReadOnly}>
            <SelectTrigger className={cn(!formData.technician_id && validationErrors.length > 0 && "border-destructive")}>
              <SelectValue placeholder="Selecione o técnico..." />
            </SelectTrigger>
            <SelectContent>
              {technicians.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.client_id && (
        <div className="space-y-6">
          {!selectedEquipmentData ? (
            <div className="p-6 border rounded-xl bg-muted/30 flex flex-col items-center justify-center space-y-4">
              <MonitorSmartphone className="h-10 w-10 text-muted-foreground opacity-50" />
              <div className="text-center">
                <p className="font-medium text-foreground mb-1">Nenhum equipamento selecionado</p>
                <p className="text-sm text-muted-foreground mb-4">Selecione um equipamento deste cliente para começar.</p>
              </div>
              <Button onClick={() => setEquipmentModalOpen(true)} disabled={isReadOnly} className={cn(!formData.equipment_id && validationErrors.length > 0 && "ring-2 ring-destructive ring-offset-2")}>Selecionar Equipamento</Button>
            </div>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold">Dados do Equipamento Selecionado</CardTitle>
                {!isReadOnly && <Button variant="outline" size="sm" onClick={() => setEquipmentModalOpen(true)}>Trocar Equipamento</Button>}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                  {renderEquipmentField('Tipo', selectedEquipmentData.type)}
                  {renderEquipmentField('Marca', selectedEquipmentData.brand)}
                  {renderEquipmentField('Modelo', selectedEquipmentData.model)}
                  {renderEquipmentField('Número de Série', selectedEquipmentData.serial_number)}
                  {renderEquipmentField('Data de Instalação', formatDate(selectedEquipmentData.installation_date))}
                  {renderEquipmentField('Tipo de Tensão', selectedEquipmentData.voltage_type)}
                  {renderEquipmentField('Potência (VA)', selectedEquipmentData.power_va)}
                  {renderEquipmentField('Tensão Entrada (V)', selectedEquipmentData.voltage_in)}
                  {renderEquipmentField('Tensão Saída (V)', selectedEquipmentData.voltage_out)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Tensão Bateria (VDC)', selectedEquipmentData.voltage_battery)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Corrente Bateria', selectedEquipmentData.current_battery)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Tipo de Bateria', selectedEquipmentData.battery_type)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Quantidade de Baterias', selectedEquipmentData.battery_quantity)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Bateria Volts (VDC)', selectedEquipmentData.battery_volts)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Corrente Bateria (AH/W)', selectedEquipmentData.battery_current)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Conexão de Baterias', selectedEquipmentData.battery_connection)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Terminal de Baterias', selectedEquipmentData.battery_terminal)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Marca da Bateria', selectedEquipmentData.battery_brand)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Modelo da Bateria', selectedEquipmentData.battery_model)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Corrente Entrada (A)', selectedEquipmentData.current_in)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Corrente Saída (A)', selectedEquipmentData.current_out)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Certificação', selectedEquipmentData.certification)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Capacidade (AH/W)', selectedEquipmentData.capacity_ah)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Simétrico', selectedEquipmentData.symmetric)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Isolado', selectedEquipmentData.isolated)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Qtd. Sinalizadores', selectedEquipmentData.signalizers_quantity)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('IHM', selectedEquipmentData.ihm)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Localizadores', selectedEquipmentData.localizadores)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Tipo de Cabo de Comunicação', selectedEquipmentData.communication_cable_type)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Fixação', selectedEquipmentData.fixation)}
                  {selectedEquipmentData.type === 'Nobreak' && renderEquipmentField('Quantidade', selectedEquipmentData.quantity)}
                  {renderEquipmentField('Ambiente Refrigerado', selectedEquipmentData.cooled_environment)}
                </div>

                {!isReadOnly && (
                  <div className="flex justify-end mt-6 pt-6 border-t">
                    <Button 
                      onClick={handleQuickCreate} 
                      disabled={saving || isReadOnly} 
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    >
                      {saving ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" /> : <Clock className="mr-2 h-4 w-4" />}
                      Criar Relatório Rápido
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  const shouldDisplayField = (value) => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'number' && value === 0) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  };

  const renderEquipmentField = (label, value) => {
    if (!shouldDisplayField(value)) return null;
    return (
      <div>
        <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wide">{label}</span>
        <span className="font-medium text-sm">{value}</span>
      </div>
    );
  };

  const handleCancel = () => {
    navigate('/reports');
  };

  const handleGeneratePDF = async () => {
    if (!validateForm()) return;
    
    setGeneratingPDF(true);
    setPdfProgress('Iniciando geração do PDF...');
    
    try {
      // Importar dinamicamente para não carregar no início
      const { generateReportPDF } = await import('@/utils/generateReportPDF.js');
      
      setPdfProgress('Preparando dados do relatório...');
      
      // Criar referências temporárias para o PDF
      const refs = {
        coverRef: { current: document.querySelector('[data-pdf-cover]') },
        clientEquipRef: { current: document.querySelector('[data-pdf-client-equip]') },
        infraElecBatRef: { current: document.querySelector('[data-pdf-infra-elec-bat]') },
        descRef: { current: document.querySelector('[data-pdf-desc]') },
        signaturesRef: { current: document.querySelector('[data-pdf-signatures]') }
      };
      
      setPdfProgress('Capturando conteúdo das páginas...');
      
      // Simular progresso enquanto gera o PDF
      const progressSteps = [
        'Processando capa do relatório...',
        'Adicionando dados do cliente e equipamento...',
        'Processando medições elétricas...',
        'Adicionando informações das baterias...',
        'Processando descrição do atendimento...',
        'Adicionando assinaturas...',
        'Finalizando PDF...'
      ];
      
      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setPdfProgress(progressSteps[currentStep]);
          currentStep++;
        } else {
          clearInterval(progressInterval);
        }
      }, 800);
      
      const pdfBlob = await generateReportPDF(formData, null, refs);
      
      clearInterval(progressInterval);
      setPdfProgress('PDF gerado com sucesso!');
      
      // Fazer download do PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${formData.service_order_number || 'sem-numero'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('PDF gerado e baixado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF: ' + error.message);
    } finally {
      setGeneratingPDF(false);
      setPdfProgress('');
    }
  };

  const handleAccordionChange = (value) => {
    setActiveAccordion(value);
    // Scroll suave para mostrar o topo do card aberto (mobile)
    if (isMobile && value) {
      setTimeout(() => {
        try {
          const accordionElement = document.getElementById(`accordion-${value}`);
          if (accordionElement) {
            const top = accordionElement.getBoundingClientRect().top + window.scrollY - 70;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        } catch (error) {
          console.error('Erro ao fazer scroll:', error);
        }
      }, 350);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center py-24"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  const vType = selectedEquipmentData?.voltage_type;
  const getElecValue = (section, type, field) => formData.electrical_measurements?.[section]?.[type]?.[field] || '';
  const selectedTech = technicians.find(t => t.id === formData.technician_id);

  return (
    <div className="bg-background">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Novo Relatório {formData.service_order_number && `- OS: ${formData.service_order_number}`}
          </h2>
          {selectedEquipmentData && (
            <p className="text-muted-foreground font-medium mt-1 text-sm flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4" />
              {selectedEquipmentData.type} ({selectedEquipmentData.brand} - {selectedEquipmentData.serial_number})
            </p>
          )}
        </div>
        
        {/* Barra de Progresso do PDF */}
        {generatingPDF && (
          <div className="w-full md:w-auto">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    {pdfProgress}
                  </p>
                  <Progress value={85} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
        <div className="space-y-2">
          <Label className="font-bold uppercase">Data do Relatório</Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={isReadOnly}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(createdDate, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={createdDate}
                onSelect={(date) => {
                  if (date) setCreatedDate(date);
                  setDatePickerOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {validationErrors.length > 0 && !isReadOnly && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold mb-1">Verifique os campos obrigatórios:</h4>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      <fieldset disabled={isReadOnly} className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col min-h-[600px] group">
        {/* Desktop: Tabs */}
        {!isMobile && (
        <div key="desktop-tabs">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto overflow-x-auto flex-nowrap shrink-0">
              <TabsTrigger value="equipment" className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-6 py-3 font-bold uppercase"><Settings2 className="w-4 h-4 mr-2"/> EQUIPAMENTO</TabsTrigger>
              <TabsTrigger value="installation" disabled={!formData.equipment_id} className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-6 py-3 font-bold uppercase"><Activity className="w-4 h-4 mr-2"/> INSTALAÇÃO</TabsTrigger>
              {!isBatteryMonitor && <TabsTrigger value="electrical" disabled={!formData.equipment_id} className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-6 py-3 font-bold uppercase"><Zap className="w-4 h-4 mr-2"/> ELÉTRICA</TabsTrigger>}
              {hasBattery && <TabsTrigger value="battery" disabled={!formData.equipment_id} className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-6 py-3 font-bold uppercase"><Battery className="w-4 h-4 mr-2"/> BATERIAS</TabsTrigger>}
              <TabsTrigger value="attendance" disabled={!formData.equipment_id} className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-6 py-3 font-bold uppercase"><FileText className="w-4 h-4 mr-2"/> DESCRIÇÃO</TabsTrigger>
              <TabsTrigger value="photos" disabled={!formData.equipment_id} className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-6 py-3 font-bold uppercase"><ImageIcon className="w-4 h-4 mr-2"/> FOTOS</TabsTrigger>
              <TabsTrigger value="signatures" disabled={!formData.equipment_id} className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-6 py-3 font-bold uppercase"><PenTool className="w-4 h-4 mr-2"/> ASSINATURAS</TabsTrigger>
            </TabsList>

            <div className="p-6 md:p-8 flex-1">
            <TabsContent value="equipment" className="mt-0 space-y-6 h-full">
              {renderEquipmentContent()}
            </TabsContent>

            <TabsContent value="installation" className="mt-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label className="font-bold uppercase">Tipo de Serviço</Label>
                  <Input 
                    value={formData.service_type} 
                    onChange={e => updateField('service_type', e.target.value.toUpperCase())} 
                    placeholder="Ex: Manutenção Preventiva, Instalação..."
                    disabled={isReadOnly} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase">Ambiente Refrigerado</Label>
                  <Select value={formData.cooled_environment} onValueChange={(v) => updateField('cooled_environment', v)} disabled={isReadOnly}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{COOLED_ENV_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase">LOCAL DA INSTALAÇÃO <span className="text-destructive">*</span></Label>
                  <Select value={formData.installation_location} onValueChange={(v) => updateField('installation_location', v)} disabled={isReadOnly}>
                    <SelectTrigger className={cn(!formData.installation_location && validationErrors.length > 0 && "border-destructive")}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{INSTALLATION_LOCATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {!isBatteryMonitor && (
                <div className="space-y-2">
                  <Label className="font-bold uppercase">TIPO DE ALIMENTAÇÃO <span className="text-destructive">*</span></Label>
                  <Select value={formData.power_supply_type} onValueChange={(v) => updateField('power_supply_type', v)} disabled={isReadOnly}>
                    <SelectTrigger className={cn(!formData.power_supply_type && validationErrors.length > 0 && "border-destructive")}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{POWER_SUPPLY_TYPES.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                )}
              </div>

              {formData.installation_location === 'Inadequado' && (
                <div className="space-y-2">
                  <Label className="font-bold uppercase">Motivo do Local Inadequado <span className="text-destructive">*</span></Label>
                  <Textarea 
                    value={formData.installation_location_explanation} 
                    onChange={e => updateField('installation_location_explanation', e.target.value.toUpperCase())} 
                    rows={2} 
                    className={cn(!formData.installation_location_explanation && validationErrors.length > 0 && "border-destructive")}
                    disabled={isReadOnly}
                  />
                </div>
              )}

              {!isBatteryMonitor && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-border">
                <div className="space-y-2"><Label className="font-bold uppercase">DISJUNTOR</Label><Input value={formData.breaker} onChange={e => updateField('breaker', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
                <div className="space-y-2"><Label className="font-bold uppercase">CABO ENTRADA FASE (MM²)</Label><Input type="number" value={formData.cable_entry_phase} onChange={e => updateField('cable_entry_phase', e.target.value)} disabled={isReadOnly} /></div>
                <div className="space-y-2"><Label className="font-bold uppercase">CABO ENTRADA NEUTRO (MM²)</Label><Input type="number" value={formData.cable_entry_neutral} onChange={e => updateField('cable_entry_neutral', e.target.value)} disabled={isReadOnly} /></div>
                <div className="space-y-2"><Label className="font-bold uppercase">CABO ENTRADA TERRA (MM²)</Label><Input type="number" value={formData.cable_entry_ground} onChange={e => updateField('cable_entry_ground', e.target.value)} disabled={isReadOnly} /></div>
                <div className="space-y-2"><Label className="font-bold uppercase">CABO SAÍDA FASE (MM²)</Label><Input type="number" value={formData.cable_exit_phase} onChange={e => updateField('cable_exit_phase', e.target.value)} disabled={isReadOnly} /></div>
                <div className="space-y-2"><Label className="font-bold uppercase">CABO SAÍDA NEUTRO (MM²)</Label><Input type="number" value={formData.cable_exit_neutral} onChange={e => updateField('cable_exit_neutral', e.target.value)} disabled={isReadOnly} /></div>
              </div>
              )}

              {hasExternalBattery && (
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-primary flex items-center">
                    <Battery className="mr-2 h-5 w-5" />
                    Banco Externo
                  </h3>
                  <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Cabo Positivo (mm²)</Label>
                        <Input 
                          type="number" 
                          value={formData.external_battery_positive_cable} 
                          onChange={e => updateField('external_battery_positive_cable', e.target.value)} 
                          disabled={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Cabo Negativo (mm²)</Label>
                        <Input 
                          type="number" 
                          value={formData.external_battery_negative_cable} 
                          onChange={e => updateField('external_battery_negative_cable', e.target.value)} 
                          disabled={isReadOnly}
                        />
                      </div>
                      {isSymmetric && (
                        <div className="space-y-2">
                          <Label className="font-bold uppercase">Cabo Neutro (mm²)</Label>
                          <Input 
                            type="number" 
                            value={formData.external_battery_neutral_cable} 
                            onChange={e => updateField('external_battery_neutral_cable', e.target.value)} 
                            disabled={isReadOnly}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Conexão Bateria</Label>
                        <Select 
                          value={formData.external_battery_connection} 
                          onValueChange={(v) => updateField('external_battery_connection', v)}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {EXTERNAL_BATTERY_CONNECTION_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Conexão Nobreak</Label>
                        <Select 
                          value={formData.external_battery_nobreak_connection} 
                          onValueChange={(v) => updateField('external_battery_nobreak_connection', v)}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {EXTERNAL_BATTERY_CONNECTION_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="electrical" className="mt-0 space-y-10">
              {!vType && (
                <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg font-medium text-center">
                  O tipo de tensão não está definido no cadastro deste equipamento. Configure o tipo de tensão no cadastro de equipamentos.
                </div>
              )}

              <div className="space-y-6">
                <h3 className="text-xl font-bold tracking-tight text-primary flex items-center border-b pb-2"><Zap className="mr-2 h-5 w-5" /> Entrada</h3>
                <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
                  {vType === 'MONOFÁSICA' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-2"><Label className="font-bold uppercase">Tensão F/N (V)</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'single')} onChange={e => updateElectrical('entrada', 'tensions', 'single', e.target.value)} disabled={isReadOnly} /></div>
                      <div className="space-y-2"><Label className="font-bold uppercase">Tensão N/T (V)</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'nt')} onChange={e => updateElectrical('entrada', 'tensions', 'nt', e.target.value)} disabled={isReadOnly} /></div>
                      <div className="space-y-2"><Label className="font-bold uppercase">Corrente Fase (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'single')} onChange={e => updateElectrical('entrada', 'currents', 'single', e.target.value)} disabled={isReadOnly} /></div>
                      <div className="space-y-2"><Label className="font-bold uppercase">Corrente Neutro (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'neutral')} onChange={e => updateElectrical('entrada', 'currents', 'neutral', e.target.value)} disabled={isReadOnly} /></div>
                      <div className="space-y-2"><Label className="font-bold uppercase">Corrente Terra (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'ground')} onChange={e => updateElectrical('entrada', 'currents', 'ground', e.target.value)} disabled={isReadOnly} /></div>
                    </div>
                  )}
                  {(vType === 'TRIFÁSICA' || vType === 'TRIMONO') && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão R/S</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'rs')} onChange={e => updateElectrical('entrada', 'tensions', 'rs', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão S/T</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'st')} onChange={e => updateElectrical('entrada', 'tensions', 'st', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão R/T</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'rt')} onChange={e => updateElectrical('entrada', 'tensions', 'rt', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão R/N</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'rn')} onChange={e => updateElectrical('entrada', 'tensions', 'rn', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão S/N</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'sn')} onChange={e => updateElectrical('entrada', 'tensions', 'sn', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão T/N</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'tn')} onChange={e => updateElectrical('entrada', 'tensions', 'tn', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão Neutro/Terra</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'nt')} onChange={e => updateElectrical('entrada', 'tensions', 'nt', e.target.value)} disabled={isReadOnly} /></div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 border-t border-border/50">
                        <div className="space-y-2"><Label className="font-bold uppercase">Corrente R (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'r')} onChange={e => updateElectrical('entrada', 'currents', 'r', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Corrente S (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 's')} onChange={e => updateElectrical('entrada', 'currents', 's', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Corrente T (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 't')} onChange={e => updateElectrical('entrada', 'currents', 't', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Corrente Neutro (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'neutral')} onChange={e => updateElectrical('entrada', 'currents', 'neutral', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Corrente Terra (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'ground')} onChange={e => updateElectrical('entrada', 'currents', 'ground', e.target.value)} disabled={isReadOnly} /></div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold tracking-tight text-primary flex items-center border-b pb-2"><Zap className="mr-2 h-5 w-5" /> Saída</h3>
                <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
                  {(vType === 'MONOFÁSICA' || vType === 'TRIMONO') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-2"><Label className="font-bold uppercase">Tensão F/N (V)</Label><Input type="number" value={getElecValue('saida', 'tensions', 'single')} onChange={e => updateElectrical('saida', 'tensions', 'single', e.target.value)} disabled={isReadOnly} /></div>
                      <div className="space-y-2"><Label className="font-bold uppercase">Tensão N/T (V)</Label><Input type="number" value={getElecValue('saida', 'tensions', 'nt')} onChange={e => updateElectrical('saida', 'tensions', 'nt', e.target.value)} disabled={isReadOnly} /></div>
                      <div className="space-y-2"><Label className="font-bold uppercase">Corrente Fase (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 'single')} onChange={e => updateElectrical('saida', 'currents', 'single', e.target.value)} disabled={isReadOnly} /></div>
                      <div className="space-y-2"><Label className="font-bold uppercase">Corrente Neutro (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 'neutral')} onChange={e => updateElectrical('saida', 'currents', 'neutral', e.target.value)} disabled={isReadOnly} /></div>
                    </div>
                  )}
                  {vType === 'TRIFÁSICA' && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão R/S</Label><Input type="number" value={getElecValue('saida', 'tensions', 'rs')} onChange={e => updateElectrical('saida', 'tensions', 'rs', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão S/T</Label><Input type="number" value={getElecValue('saida', 'tensions', 'st')} onChange={e => updateElectrical('saida', 'tensions', 'st', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão R/T</Label><Input type="number" value={getElecValue('saida', 'tensions', 'rt')} onChange={e => updateElectrical('saida', 'tensions', 'rt', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão R/N</Label><Input type="number" value={getElecValue('saida', 'tensions', 'rn')} onChange={e => updateElectrical('saida', 'tensions', 'rn', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão S/N</Label><Input type="number" value={getElecValue('saida', 'tensions', 'sn')} onChange={e => updateElectrical('saida', 'tensions', 'sn', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão T/N</Label><Input type="number" value={getElecValue('saida', 'tensions', 'tn')} onChange={e => updateElectrical('saida', 'tensions', 'tn', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Tensão N/T</Label><Input type="number" value={getElecValue('saida', 'tensions', 'nt')} onChange={e => updateElectrical('saida', 'tensions', 'nt', e.target.value)} disabled={isReadOnly} /></div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 border-t border-border/50">
                        <div className="space-y-2"><Label className="font-bold uppercase">Corrente R (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 'r')} onChange={e => updateElectrical('saida', 'currents', 'r', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Corrente S (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 's')} onChange={e => updateElectrical('saida', 'currents', 's', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Corrente T (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 't')} onChange={e => updateElectrical('saida', 'currents', 't', e.target.value)} disabled={isReadOnly} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Corrente Neutro (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 'neutral')} onChange={e => updateElectrical('saida', 'currents', 'neutral', e.target.value)} disabled={isReadOnly} /></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {hasBattery && (
              <TabsContent value="battery" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {!isBatteryMonitor && (
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">Banco de Baterias</Label>
                    <Select value={formData.battery_bank.type} onValueChange={v => updateBattery('type', v)} disabled={isReadOnly}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{BATTERY_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">QUANTIDADE BATERIAS</Label>
                    <Input type="number" value={formData.battery_bank.quantity} onChange={e => updateBattery('quantity', e.target.value)} disabled={isReadOnly} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">BATERIA VOLTS (VDC)</Label>
                    <Input type="number" value={formData.battery_bank.battery_volts} onChange={e => updateBattery('battery_volts', e.target.value)} disabled={isReadOnly} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">CORRENTE BATERIA (AH/W)</Label>
                    <Input value={formData.battery_bank.battery_current} onChange={e => updateBattery('battery_current', e.target.value.toUpperCase())} disabled={isReadOnly} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">TENSÃO DO BANCO +/- (VDC)</Label>
                    <Input type="number" value={formData.battery_bank.voltage} onChange={e => updateBattery('voltage', e.target.value)} disabled={isReadOnly} />
                  </div>
                  
                  {!isBatteryMonitor && isSymmetric && (
                    <>
                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Tensão do Banco +/N (VDC)</Label>
                        <Input type="number" value={formData.battery_bank.voltage_positive_neutral} onChange={e => updateBattery('voltage_positive_neutral', e.target.value)} disabled={isReadOnly} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Tensão do Banco N/- (VDC)</Label>
                        <Input type="number" value={formData.battery_bank.voltage_neutral_negative} onChange={e => updateBattery('voltage_neutral_negative', e.target.value)} disabled={isReadOnly} />
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">TENSÃO CARREGADOR (VDC)</Label>
                    <Input type="number" value={formData.battery_bank.charger_voltage} onChange={e => updateBattery('charger_voltage', e.target.value)} disabled={isReadOnly} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">MARCA</Label>
                    <Input value={formData.battery_bank.brand} onChange={e => updateBattery('brand', e.target.value.toUpperCase())} disabled={isReadOnly} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">MODELO</Label>
                    <Input value={formData.battery_bank.model} onChange={e => updateBattery('model', e.target.value.toUpperCase())} disabled={isReadOnly} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">TROCOU BATERIAS</Label>
                    <Select value={formData.battery_bank.trocou_baterias} onValueChange={v => updateBattery('trocou_baterias', v)} disabled={isReadOnly}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{YES_NO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  {!isBatteryMonitor && trocouBaterias === 'SIM' && (
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Última Troca</Label>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.battery_bank.last_change && "text-muted-foreground")} disabled={isReadOnly}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.battery_bank.last_change ? formatDateForDisplay(formData.battery_bank.last_change) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.battery_bank.last_change ? new Date(formData.battery_bank.last_change) : undefined}
                            onSelect={(date) => {
                              updateBattery('last_change', date ? date.toISOString().split('T')[0] : '');
                              setDatePickerOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  
                  {!isBatteryMonitor && trocouBaterias === 'NÃO' && (
                    <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                      <Label className="font-bold uppercase">Motivo</Label>
                      <Textarea 
                        value={formData.battery_bank.motivo_nao_troca} 
                        onChange={e => updateBattery('motivo_nao_troca', e.target.value.toUpperCase())} 
                        rows={2}
                        disabled={isReadOnly}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            <TabsContent value="attendance" className="mt-0 space-y-6">
              <div className="space-y-2"><Label className="font-bold uppercase">PROBLEMAS REPORTADOS</Label><Textarea rows={4} value={formData.reported_problems || ''} onChange={e => updateField('reported_problems', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="font-bold uppercase">INSPEÇÃO EXTERNA</Label><Textarea rows={4} value={formData.external_inspection} onChange={e => updateField('external_inspection', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
                <div className="space-y-2"><Label className="font-bold uppercase">INSPEÇÃO INTERNA</Label><Textarea rows={4} value={formData.internal_inspection} onChange={e => updateField('internal_inspection', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
              </div>
              <div className="space-y-2"><Label className="font-bold uppercase">REALIZADO NO ATENDIMENTO</Label><Textarea rows={4} value={formData.attendance_description} onChange={e => updateField('attendance_description', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
              <div className="space-y-2"><Label className="font-bold uppercase">DIAGNÓSTICO / NECESSÁRIO</Label><Textarea rows={4} value={formData.diagnosis} onChange={e => updateField('diagnosis', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
              <div className="space-y-2"><Label className="font-bold uppercase">CONCLUSÃO / RESULTADO</Label><Textarea rows={4} value={formData.conclusion} onChange={e => updateField('conclusion', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
            </TabsContent>

            <TabsContent value="photos" className="mt-0 space-y-6">
              {!isReadOnly && (
                <div className="border-2 border-dashed rounded-xl p-8 text-center bg-muted/20 hover:bg-muted/40 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <span className="text-primary font-semibold hover:underline">Clique para adicionar fotos</span>
                    <span className="text-muted-foreground block text-sm mt-1">Formato JPG, PNG (Max 5MB)</span>
                  </Label>
                  <Input id="photo-upload" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={isReadOnly} />
                </div>
              )}
              
              {photos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group relative border rounded-xl overflow-hidden bg-card shadow-sm flex flex-col">
                      <div className="aspect-video relative bg-muted shrink-0">
                        <img src={photo.url} alt="Foto" className="w-full h-full object-cover cursor-pointer" onClick={() => setZoomPhoto(photo.url)} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => setZoomPhoto(photo.url)}><ZoomIn className="h-4 w-4" /></Button>
                          {!isReadOnly && (
                            <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => removePhoto(photo.id)}><X className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </div>
                      <div className="p-3 space-y-2 flex-1 flex flex-col">
                        <Textarea 
                          placeholder="Comentário da foto..." 
                          className="text-xs resize-none flex-1 min-h-[60px]" 
                          value={photo.comment} 
                          onChange={e => updatePhoto(photo.id, 'comment', e.target.value.toUpperCase())} 
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="signatures" className="mt-0 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4 border p-6 rounded-xl bg-card shadow-sm">
                  <h4 className="font-semibold text-lg flex items-center border-b pb-2"><PenTool className="mr-2 w-5 h-5"/> Assinatura Técnica</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Nome do Técnico</Label>
                      <Input value={selectedTech?.name || ''} readOnly className="bg-muted text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Assinatura <span className="text-destructive">*</span></Label>
                      {formData.technician_signature ? (
                        <div className="space-y-2">
                          <div className="border bg-white rounded-xl p-4 flex justify-center">
                            <img src={formData.technician_signature} alt="Assinatura do Técnico" className="max-w-full max-h-32 object-contain" />
                          </div>
                          {!isReadOnly && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={redrawTechSignature}
                              className="w-full"
                            >
                              Redesenhar Assinatura
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="border rounded-lg overflow-hidden bg-white ring-1 ring-border shadow-inner">
                            <SignatureCanvas 
                              ref={techSigPad}
                              penColor="#3B82F6"
                              backgroundColor="white"
                              canvasProps={{ 
                                className: 'w-full touch-none', 
                                style: { minHeight: '200px', maxWidth: '400px', margin: '0 auto', display: 'block' } 
                              }}
                            />
                          </div>
                          {!isReadOnly && (
                            <div className="flex gap-2">
                              <Button 
                                type="button"
                                variant="outline" 
                                size="sm" 
                                onClick={clearTechSignature}
                                className="flex-1"
                              >
                                Limpar
                              </Button>
                              <Button 
                                type="button"
                                size="sm" 
                                onClick={handleConfirmTechSignature}
                                className="flex-1"
                              >
                                Confirmar Assinatura
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={cn("space-y-4 border p-6 rounded-xl bg-card shadow-sm", (!formData.client_signature && validationErrors.length > 0) && "border-destructive ring-1 ring-destructive")}>
                  <h4 className="font-semibold text-lg flex items-center border-b pb-2"><PenTool className="mr-2 w-5 h-5"/> Assinatura do Cliente</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Nome do Cliente / Responsável <span className="text-destructive">*</span></Label>
                      <Input value={formData.responsible_person} onChange={e => updateField('responsible_person', e.target.value.toUpperCase())} className={cn(!formData.responsible_person && validationErrors.length > 0 && "border-destructive")} disabled={isReadOnly} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Assinatura <span className="text-destructive">*</span></Label>
                      {formData.client_signature ? (
                        <div className="space-y-2">
                          <div className="border bg-white rounded-xl p-4 flex justify-center">
                            <img src={formData.client_signature} alt="Assinatura do Cliente" className="max-w-full max-h-32 object-contain" />
                          </div>
                          {!isReadOnly && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={redrawClientSignature}
                              className="w-full"
                            >
                              Redesenhar Assinatura
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="border rounded-lg overflow-hidden bg-white ring-1 ring-border shadow-inner">
                            <SignatureCanvas 
                              ref={clientSigPad}
                              penColor="#3B82F6"
                              backgroundColor="white"
                              canvasProps={{ 
                                className: 'w-full touch-none', 
                                style: { minHeight: '200px', maxWidth: '400px', margin: '0 auto', display: 'block' } 
                              }}
                            />
                          </div>
                          {!isReadOnly && (
                            <div className="flex gap-2">
                              <Button 
                                type="button"
                                variant="outline" 
                                size="sm" 
                                onClick={clearClientSignature}
                                className="flex-1"
                              >
                                Limpar
                              </Button>
                              <Button 
                                type="button"
                                size="sm" 
                                onClick={handleConfirmSignature}
                                className="flex-1"
                              >
                                Confirmar Assinatura
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
          
          <div className="bg-muted/50 border-t p-4 md:px-8 md:py-5 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
            <div className="w-full sm:w-auto flex gap-3">
              <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">Cancelar / Voltar</Button>
              {tabsOrder.indexOf(activeTab) > 0 && (
                <Button variant="secondary" onClick={handlePrevTab} className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar Etapa
                </Button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
              {activeTab !== 'signatures' ? (
                <Button onClick={handleNextTab} className="w-full sm:w-auto min-w-[140px]" disabled={!formData.equipment_id}>
                  Próxima <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateDraft} 
                  disabled={saving || !formData.equipment_id}
                  className="w-full sm:w-auto min-w-[160px]"
                >
                  {saving ? <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Relatório
                </Button>
              )}
            </div>
          </div>
        </Tabs>
        </div>
        )}

        {/* Mobile: Accordion */}
        {isMobile && (
        <div key="mobile-accordion" className="space-y-3 px-2">
          <Accordion type="single" value={activeAccordion} onValueChange={handleAccordionChange} className="w-full" collapsible>
            <AccordionItem id="accordion-equipment" value="equipment" className="border-0">
              <AccordionTrigger className="px-5 py-4 font-bold uppercase text-sm hover:no-underline bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                    <Settings2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-blue-700 dark:text-blue-300">EQUIPAMENTO</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 overflow-visible">
                {renderEquipmentContent()}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem id="accordion-installation" value="installation" className="border-0" disabled={!formData.equipment_id}>
              <AccordionTrigger className="px-5 py-4 font-bold uppercase text-sm hover:no-underline bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg shadow-sm">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-emerald-700 dark:text-emerald-300">INSTALAÇÃO</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Tipo de Serviço</Label>
                      <Input 
                        value={formData.service_type} 
                        onChange={e => updateField('service_type', e.target.value.toUpperCase())} 
                        placeholder="Ex: Manutenção Preventiva, Instalação..."
                        disabled={isReadOnly} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Ambiente Refrigerado</Label>
                      <Select value={formData.cooled_environment} onValueChange={(v) => updateField('cooled_environment', v)} disabled={isReadOnly}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{COOLED_ENV_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">LOCAL DA INSTALAÇÃO <span className="text-destructive">*</span></Label>
                      <Select value={formData.installation_location} onValueChange={(v) => updateField('installation_location', v)} disabled={isReadOnly}>
                        <SelectTrigger className={cn(!formData.installation_location && validationErrors.length > 0 && "border-destructive")}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{INSTALLATION_LOCATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {!isBatteryMonitor && (
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">TIPO DE ALIMENTAÇÃO <span className="text-destructive">*</span></Label>
                      <Select value={formData.power_supply_type} onValueChange={(v) => updateField('power_supply_type', v)} disabled={isReadOnly}>
                        <SelectTrigger className={cn(!formData.power_supply_type && validationErrors.length > 0 && "border-destructive")}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{POWER_SUPPLY_TYPES.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    )}
                  </div>

                  {formData.installation_location === 'Inadequado' && (
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Motivo do Local Inadequado <span className="text-destructive">*</span></Label>
                      <Textarea 
                        value={formData.installation_location_explanation} 
                        onChange={e => updateField('installation_location_explanation', e.target.value.toUpperCase())} 
                        rows={2} 
                        className={cn(!formData.installation_location_explanation && validationErrors.length > 0 && "border-destructive")}
                        disabled={isReadOnly}
                      />
                    </div>
                  )}

                  {!isBatteryMonitor && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="space-y-2"><Label className="font-bold uppercase">DISJUNTOR</Label><Input value={formData.breaker} onChange={e => updateField('breaker', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
                    <div className="space-y-2"><Label className="font-bold uppercase">CABO ENTRADA FASE (MM²)</Label><Input type="number" value={formData.cable_entry_phase} onChange={e => updateField('cable_entry_phase', e.target.value)} disabled={isReadOnly} /></div>
                    <div className="space-y-2"><Label className="font-bold uppercase">CABO ENTRADA NEUTRO (MM²)</Label><Input type="number" value={formData.cable_entry_neutral} onChange={e => updateField('cable_entry_neutral', e.target.value)} disabled={isReadOnly} /></div>
                    <div className="space-y-2"><Label className="font-bold uppercase">CABO ENTRADA TERRA (MM²)</Label><Input type="number" value={formData.cable_entry_ground} onChange={e => updateField('cable_entry_ground', e.target.value)} disabled={isReadOnly} /></div>
                    <div className="space-y-2"><Label className="font-bold uppercase">CABO SAÍDA FASE (MM²)</Label><Input type="number" value={formData.cable_exit_phase} onChange={e => updateField('cable_exit_phase', e.target.value)} disabled={isReadOnly} /></div>
                    <div className="space-y-2"><Label className="font-bold uppercase">CABO SAÍDA NEUTRO (MM²)</Label><Input type="number" value={formData.cable_exit_neutral} onChange={e => updateField('cable_exit_neutral', e.target.value)} disabled={isReadOnly} /></div>
                  </div>
                  )}

                  {hasExternalBattery && (
                    <div className="space-y-4 pt-4 border-t border-border">
                      <h3 className="text-lg font-semibold text-primary flex items-center">
                        <Battery className="mr-2 h-5 w-5" />
                        Banco Externo
                      </h3>
                      <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Cabo Positivo (mm²)</Label>
                            <Input 
                              type="number" 
                              value={formData.external_battery_positive_cable} 
                              onChange={e => updateField('external_battery_positive_cable', e.target.value)} 
                              disabled={isReadOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Cabo Negativo (mm²)</Label>
                            <Input 
                              type="number" 
                              value={formData.external_battery_negative_cable} 
                              onChange={e => updateField('external_battery_negative_cable', e.target.value)} 
                              disabled={isReadOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Cabo Neutro (mm²)</Label>
                            <Input 
                              type="number" 
                              value={formData.external_battery_neutral_cable} 
                              onChange={e => updateField('external_battery_neutral_cable', e.target.value)} 
                              disabled={isReadOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Conexão</Label>
                            <Select 
                              value={formData.external_battery_connection} 
                              onValueChange={(v) => updateField('external_battery_connection', v)}
                              disabled={isReadOnly}
                            >
                              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                {EXTERNAL_BATTERY_CONNECTION_OPTIONS.map(opt => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Conexão Nobreak</Label>
                            <Select 
                              value={formData.external_battery_nobreak_connection} 
                              onValueChange={(v) => updateField('external_battery_nobreak_connection', v)}
                              disabled={isReadOnly}
                            >
                              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                {EXTERNAL_BATTERY_CONNECTION_OPTIONS.map(opt => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem id="accordion-electrical" value="electrical" className="border-0" disabled={!formData.equipment_id || isBatteryMonitor}>
              <AccordionTrigger className="px-5 py-4 font-bold uppercase text-sm hover:no-underline bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-amber-700 dark:text-amber-300">ELÉTRICA</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {!vType && (
                  <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg font-medium text-center">
                    O tipo de tensão não está definido no cadastro deste equipamento. Configure o tipo de tensão no cadastro de equipamentos.
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold tracking-tight text-primary flex items-center border-b pb-2"><Zap className="mr-2 h-5 w-5" /> Entrada</h3>
                    <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                      {vType === 'MONOFÁSICA' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label className="font-bold uppercase">Tensão F/N (V)</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'single')} onChange={e => updateElectrical('entrada', 'tensions', 'single', e.target.value)} disabled={isReadOnly} /></div>
                          <div className="space-y-2"><Label className="font-bold uppercase">Tensão N/T (V)</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'nt')} onChange={e => updateElectrical('entrada', 'tensions', 'nt', e.target.value)} disabled={isReadOnly} /></div>
                          <div className="space-y-2"><Label className="font-bold uppercase">Corrente Fase (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'single')} onChange={e => updateElectrical('entrada', 'currents', 'single', e.target.value)} disabled={isReadOnly} /></div>
                          <div className="space-y-2"><Label className="font-bold uppercase">Corrente Neutro (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'neutral')} onChange={e => updateElectrical('entrada', 'currents', 'neutral', e.target.value)} disabled={isReadOnly} /></div>
                          <div className="space-y-2"><Label className="font-bold uppercase">Corrente Terra (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'ground')} onChange={e => updateElectrical('entrada', 'currents', 'ground', e.target.value)} disabled={isReadOnly} /></div>
                        </div>
                      )}
                      {(vType === 'TRIFÁSICA' || vType === 'TRIMONO') && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão R/S</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'rs')} onChange={e => updateElectrical('entrada', 'tensions', 'rs', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão S/T</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'st')} onChange={e => updateElectrical('entrada', 'tensions', 'st', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão R/T</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'rt')} onChange={e => updateElectrical('entrada', 'tensions', 'rt', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão R/N</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'rn')} onChange={e => updateElectrical('entrada', 'tensions', 'rn', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão S/N</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'sn')} onChange={e => updateElectrical('entrada', 'tensions', 'sn', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão T/N</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'tn')} onChange={e => updateElectrical('entrada', 'tensions', 'tn', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão Neutro/Terra</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'nt')} onChange={e => updateElectrical('entrada', 'tensions', 'nt', e.target.value)} disabled={isReadOnly} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                            <div className="space-y-2"><Label className="font-bold uppercase">Corrente R (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'r')} onChange={e => updateElectrical('entrada', 'currents', 'r', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Corrente S (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 's')} onChange={e => updateElectrical('entrada', 'currents', 's', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Corrente T (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 't')} onChange={e => updateElectrical('entrada', 'currents', 't', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Corrente Neutro (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'neutral')} onChange={e => updateElectrical('entrada', 'currents', 'neutral', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Corrente Terra (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'ground')} onChange={e => updateElectrical('entrada', 'currents', 'ground', e.target.value)} disabled={isReadOnly} /></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold tracking-tight text-primary flex items-center border-b pb-2"><Zap className="mr-2 h-5 w-5" /> Saída</h3>
                    <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                      {(vType === 'MONOFÁSICA' || vType === 'TRIMONO') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label className="font-bold uppercase">Tensão F/N (V)</Label><Input type="number" value={getElecValue('saida', 'tensions', 'single')} onChange={e => updateElectrical('saida', 'tensions', 'single', e.target.value)} disabled={isReadOnly} /></div>
                          <div className="space-y-2"><Label className="font-bold uppercase">Tensão N/T (V)</Label><Input type="number" value={getElecValue('saida', 'tensions', 'nt')} onChange={e => updateElectrical('saida', 'tensions', 'nt', e.target.value)} disabled={isReadOnly} /></div>
                          <div className="space-y-2"><Label className="font-bold uppercase">Corrente Fase (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 'single')} onChange={e => updateElectrical('saida', 'currents', 'single', e.target.value)} disabled={isReadOnly} /></div>
                          <div className="space-y-2"><Label className="font-bold uppercase">Corrente Neutro (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 'neutral')} onChange={e => updateElectrical('saida', 'currents', 'neutral', e.target.value)} disabled={isReadOnly} /></div>
                        </div>
                      )}
                      {vType === 'TRIFÁSICA' && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão R/S</Label><Input type="number" value={getElecValue('saida', 'tensions', 'rs')} onChange={e => updateElectrical('saida', 'tensions', 'rs', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão S/T</Label><Input type="number" value={getElecValue('saida', 'tensions', 'st')} onChange={e => updateElectrical('saida', 'tensions', 'st', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão R/T</Label><Input type="number" value={getElecValue('saida', 'tensions', 'rt')} onChange={e => updateElectrical('saida', 'tensions', 'rt', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão R/N</Label><Input type="number" value={getElecValue('saida', 'tensions', 'rn')} onChange={e => updateElectrical('saida', 'tensions', 'rn', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão S/N</Label><Input type="number" value={getElecValue('saida', 'tensions', 'sn')} onChange={e => updateElectrical('saida', 'tensions', 'sn', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão T/N</Label><Input type="number" value={getElecValue('saida', 'tensions', 'tn')} onChange={e => updateElectrical('saida', 'tensions', 'tn', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Tensão N/T</Label><Input type="number" value={getElecValue('saida', 'tensions', 'nt')} onChange={e => updateElectrical('saida', 'tensions', 'nt', e.target.value)} disabled={isReadOnly} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                            <div className="space-y-2"><Label className="font-bold uppercase">Corrente R (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 'r')} onChange={e => updateElectrical('saida', 'currents', 'r', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Corrente S (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 's')} onChange={e => updateElectrical('saida', 'currents', 's', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Corrente T (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 't')} onChange={e => updateElectrical('saida', 'currents', 't', e.target.value)} disabled={isReadOnly} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase">Corrente Neutro (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 'neutral')} onChange={e => updateElectrical('saida', 'currents', 'neutral', e.target.value)} disabled={isReadOnly} /></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem id="accordion-battery" value="battery" className="border-0" disabled={!formData.equipment_id || !hasBattery}>
              <AccordionTrigger className="px-5 py-4 font-bold uppercase text-sm hover:no-underline bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-950/20 dark:to-lime-950/20 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                    <Battery className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-green-700 dark:text-green-300">BATERIAS</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 gap-4">
                  {!isBatteryMonitor && (
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">Banco de Baterias</Label>
                    <Select value={formData.battery_bank.type} onValueChange={v => updateBattery('type', v)} disabled={isReadOnly}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{BATTERY_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">QUANTIDADE BATERIAS</Label>
                    <Input type="number" value={formData.battery_bank.quantity} onChange={e => updateBattery('quantity', e.target.value)} disabled={isReadOnly} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">BATERIA VOLTS (VDC)</Label>
                    <Input type="number" value={formData.battery_bank.battery_volts} onChange={e => updateBattery('battery_volts', e.target.value)} disabled={isReadOnly} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">CORRENTE BATERIA (AH/W)</Label>
                    <Input value={formData.battery_bank.battery_current} onChange={e => updateBattery('battery_current', e.target.value.toUpperCase())} disabled={isReadOnly} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">TENSÃO DO BANCO +/- (VDC)</Label>
                    <Input type="number" value={formData.battery_bank.voltage} onChange={e => updateBattery('voltage', e.target.value)} disabled={isReadOnly} />
                  </div>
                  
                  {!isBatteryMonitor && isSymmetric && (
                    <>
                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Tensão do Banco +/N (VDC)</Label>
                        <Input type="number" value={formData.battery_bank.voltage_positive_neutral} onChange={e => updateBattery('voltage_positive_neutral', e.target.value)} disabled={isReadOnly} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Tensão do Banco N/- (VDC)</Label>
                        <Input type="number" value={formData.battery_bank.voltage_neutral_negative} onChange={e => updateBattery('voltage_neutral_negative', e.target.value)} disabled={isReadOnly} />
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">TENSÃO CARREGADOR (VDC)</Label>
                    <Input type="number" value={formData.battery_bank.charger_voltage} onChange={e => updateBattery('charger_voltage', e.target.value)} disabled={isReadOnly} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">MARCA</Label>
                    <Input value={formData.battery_bank.brand} onChange={e => updateBattery('brand', e.target.value.toUpperCase())} disabled={isReadOnly} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">MODELO</Label>
                    <Input value={formData.battery_bank.model} onChange={e => updateBattery('model', e.target.value.toUpperCase())} disabled={isReadOnly} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">TROCOU BATERIAS</Label>
                    <Select value={formData.battery_bank.trocou_baterias} onValueChange={v => updateBattery('trocou_baterias', v)} disabled={isReadOnly}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{YES_NO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  {!isBatteryMonitor && trocouBaterias === 'SIM' && (
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Última Troca</Label>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.battery_bank.last_change && "text-muted-foreground")} disabled={isReadOnly}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.battery_bank.last_change ? formatDateForDisplay(formData.battery_bank.last_change) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.battery_bank.last_change ? new Date(formData.battery_bank.last_change) : undefined}
                            onSelect={(date) => {
                              updateBattery('last_change', date ? date.toISOString().split('T')[0] : '');
                              setDatePickerOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  
                  {!isBatteryMonitor && trocouBaterias === 'NÃO' && (
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Motivo</Label>
                      <Textarea 
                        value={formData.battery_bank.motivo_nao_troca} 
                        onChange={e => updateBattery('motivo_nao_troca', e.target.value.toUpperCase())} 
                        rows={2}
                        disabled={isReadOnly}
                      />
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem id="accordion-attendance" value="attendance" className="border-0" disabled={!formData.equipment_id}>
              <AccordionTrigger className="px-5 py-4 font-bold uppercase text-sm hover:no-underline bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg shadow-sm">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-purple-700 dark:text-purple-300">DESCRIÇÃO</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                <div className="space-y-2"><Label className="font-bold uppercase">PROBLEMAS REPORTADOS</Label><Textarea rows={3} value={formData.reported_problems || ''} onChange={e => updateField('reported_problems', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
                <div className="space-y-2"><Label className="font-bold uppercase">INSPEÇÃO EXTERNA</Label><Textarea rows={3} value={formData.external_inspection} onChange={e => updateField('external_inspection', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
                <div className="space-y-2"><Label className="font-bold uppercase">INSPEÇÃO INTERNA</Label><Textarea rows={3} value={formData.internal_inspection} onChange={e => updateField('internal_inspection', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
                <div className="space-y-2"><Label className="font-bold uppercase">REALIZADO NO ATENDIMENTO</Label><Textarea rows={3} value={formData.attendance_description} onChange={e => updateField('attendance_description', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
                <div className="space-y-2"><Label className="font-bold uppercase">DIAGNÓSTICO / NECESSÁRIO</Label><Textarea rows={3} value={formData.diagnosis} onChange={e => updateField('diagnosis', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
                <div className="space-y-2"><Label className="font-bold uppercase">CONCLUSÃO / RESULTADO</Label><Textarea rows={3} value={formData.conclusion} onChange={e => updateField('conclusion', e.target.value.toUpperCase())} disabled={isReadOnly} /></div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem id="accordion-photos" value="photos" className="border-0" disabled={!formData.equipment_id}>
              <AccordionTrigger className="px-5 py-4 font-bold uppercase text-sm hover:no-underline bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-950/20 dark:to-sky-950/20 rounded-xl border border-cyan-100 dark:border-cyan-900/30 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500 rounded-lg shadow-sm">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-cyan-700 dark:text-cyan-300">FOTOS</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                {!isReadOnly && (
                  <div className="border-2 border-dashed rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                    <Label htmlFor="photo-upload-mobile" className="cursor-pointer">
                      <span className="text-primary font-semibold hover:underline text-sm">Clique para adicionar fotos</span>
                    </Label>
                    <Input id="photo-upload-mobile" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={isReadOnly} />
                  </div>
                )}
                
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((photo) => (
                      <div key={photo.id} className="group relative border rounded-xl overflow-hidden bg-card shadow-sm flex flex-col">
                        <div className="aspect-video relative bg-muted shrink-0">
                          <img src={photo.url} alt="Foto" className="w-full h-full object-cover cursor-pointer" onClick={() => setZoomPhoto(photo.url)} />
                        </div>
                        <div className="p-2 space-y-2 flex-1 flex flex-col">
                          <Textarea 
                            placeholder="Comentário..." 
                            className="text-xs resize-none flex-1 min-h-[50px]" 
                            value={photo.comment} 
                            onChange={e => updatePhoto(photo.id, 'comment', e.target.value.toUpperCase())} 
                            disabled={isReadOnly}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem id="accordion-signatures" value="signatures" className="border-0" disabled={!formData.equipment_id}>
              <AccordionTrigger className="px-5 py-4 font-bold uppercase text-sm hover:no-underline bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500 rounded-lg shadow-sm">
                    <PenTool className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-rose-700 dark:text-rose-300">ASSINATURAS</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">Nome do Técnico</Label>
                    <Input value={selectedTech?.name || ''} readOnly className="bg-muted text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">Assinatura Técnica <span className="text-destructive">*</span></Label>
                    {formData.technician_signature ? (
                      <div className="border bg-white rounded-xl p-3 flex justify-center">
                        <img src={formData.technician_signature} alt="Assinatura do Técnico" className="max-w-full max-h-24 object-contain" />
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden bg-white ring-1 ring-border shadow-inner">
                        <SignatureCanvas 
                          ref={techSigPad}
                          penColor="#3B82F6"
                          backgroundColor="white"
                          canvasProps={{ 
                            className: 'w-full touch-none', 
                            style: { minHeight: '150px', maxWidth: '100%', margin: '0 auto', display: 'block' } 
                          }}
                        />
                      </div>
                    )}
                    {!formData.technician_signature && !isReadOnly && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={clearTechSignature} className="flex-1">Limpar</Button>
                        <Button size="sm" onClick={handleConfirmTechSignature} className="flex-1">Confirmar</Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">Nome do Cliente <span className="text-destructive">*</span></Label>
                    <Input value={formData.responsible_person} onChange={e => updateField('responsible_person', e.target.value.toUpperCase())} className={cn(!formData.responsible_person && validationErrors.length > 0 && "border-destructive")} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">Assinatura Cliente <span className="text-destructive">*</span></Label>
                    {formData.client_signature ? (
                      <div className="border bg-white rounded-xl p-3 flex justify-center">
                        <img src={formData.client_signature} alt="Assinatura do Cliente" className="max-w-full max-h-24 object-contain" />
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden bg-white ring-1 ring-border shadow-inner">
                        <SignatureCanvas 
                          ref={clientSigPad}
                          penColor="#3B82F6"
                          backgroundColor="white"
                          canvasProps={{ 
                            className: 'w-full touch-none', 
                            style: { minHeight: '150px', maxWidth: '100%', margin: '0 auto', display: 'block' } 
                          }}
                        />
                      </div>
                    )}
                    {!formData.client_signature && !isReadOnly && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={clearClientSignature} className="flex-1">Limpar</Button>
                        <Button size="sm" onClick={handleConfirmSignature} className="flex-1">Confirmar</Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={handleCreateDraft} 
                    disabled={saving || !formData.equipment_id}
                    className="w-full"
                  >
                    {saving ? <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Relatório
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="bg-muted/50 border-t p-4 mt-4 space-y-3">
            <Button 
              onClick={handleGeneratePDF} 
              disabled={generatingPDF || saving || !formData.equipment_id}
              className="w-full"
              variant="secondary"
            >
              {generatingPDF ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" /> : <FileText className="mr-2 h-4 w-4" />}
              {generatingPDF ? 'Gerando PDF...' : 'Gerar PDF'}
            </Button>
            <Button variant="outline" onClick={handleCancel} className="w-full">Cancelar / Voltar</Button>
          </div>
        </div>
        )}
      </fieldset>

      <Dialog open={!!zoomPhoto} onOpenChange={() => setZoomPhoto(null)}>
        <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none">
          {zoomPhoto && <img src={zoomPhoto} alt="Zoomed" className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl" />}
        </DialogContent>
      </Dialog>

      <EquipmentSelectionModal 
        isOpen={equipmentModalOpen}
        onClose={() => setEquipmentModalOpen(false)}
        equipments={clientEquipments}
        includedIds={[formData.equipment_id]}
        onSelect={selectEquipment}
      />
    </div>
  );
}

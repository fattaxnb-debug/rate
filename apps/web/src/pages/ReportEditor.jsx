
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Upload, X, ZoomIn, ArrowRight, ArrowLeft, Save, Settings2, Zap, Battery, Activity, FileText, Image as ImageIcon, PenTool, MonitorSmartphone, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSearch } from '@/hooks/useSearch.js';
import { compressImage } from '@/utils/imageCompression.js';
import SignatureCanvas from 'react-signature-canvas';
import { cn } from '@/lib/utils.js';
import EquipmentSelectionModal from '@/components/EquipmentSelectionModal.jsx';
import ClientSignatureDisplay from '@/components/ClientSignatureDisplay.jsx';
import { API_BASE_URL } from '@/config/api.js';

const INSTALLATION_LOCATION_OPTIONS = ['Adequado', 'Inadequado'];
const POWER_SUPPLY_TYPES = ['Circuito', 'Tomada', 'Tomada Industrial'];
const BATTERY_TYPES = ['Interno', 'Externo'];
const COOLED_ENV_OPTIONS = ['SIM', 'NÃO'];
const EXTERNAL_CONNECTION_OPTIONS = ['DISJUNTOR', 'BORNE', 'DIRETO'];

const getImageOrientation = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.height > img.width ? 'portrait' : 'landscape');
    };
    img.onerror = () => resolve('landscape');
    img.src = url;
  });
};

export default function ReportEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('equipment');
  const [validationErrors, setValidationErrors] = useState([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  const [clients, setClients] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [clientEquipments, setClientEquipments] = useState([]);
  const [clientOpen, setClientOpen] = useState(false);
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  
  const { searchTerm: clientSearchTerm, setSearchTerm: setClientSearchTerm, filteredItems: filteredClients } = useSearch(clients, ['name', 'cnpj_cpf']);
  
  const [formData, setFormData] = useState({
    client_id: '',
    equipment_id: '',
    technician_id: '',
    schedule_id: '',
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
    external_battery_positive_cable: '',
    external_battery_negative_cable: '',
    external_battery_neutral_cable: '',
    external_battery_connection: '',
    external_battery_nobreak_connection: '',
    electrical_measurements: { entrada: { tensions: {}, currents: {} }, saida: { tensions: {}, currents: {} } },
    battery_bank: { 
      type: '', quantity: '', voltage: '', battery_volts: '', battery_current: '',
      charger_voltage: '', brand: '', model: '', last_change: '', trocou_baterias: '',
      motivo_nao_troca: '', voltage_positive_neutral: '', voltage_neutral_negative: ''
    },
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
  const isGerente = currentUser?.role === 'Gerente';

  useEffect(() => {
    initForm();
  }, [id]);

  const initForm = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const [clientsRes, techRes, reportRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/clients`, { headers: { 'Authorization': `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/users?role=Técnico`, { headers: { 'Authorization': `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/reports/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const report = reportRes.data.data;
      
      // Access Control: Block editing if not owner
      if (isTech && report.technician_id !== currentUser.id) {
        setIsReadOnly(true);
      } else if (isTech && report.status === 'submitted') {
        setIsReadOnly(true);
      }

      setClients(clientsRes.data.data || []);
      setTechnicians(techRes.data.data || []);
      
      setFormData({
        client_id: report.client_id || '',
        equipment_id: report.equipment_id || '',
        technician_id: report.technician_id || '',
        schedule_id: report.schedule_id || '',
        service_order_number: report.service_order_number || '',
        service_type: report.service_type || '',
        responsible_person: report.responsible_person || '',
        installation_location: report.installation_location || '',
        installation_location_explanation: report.installation_location_explanation || '',
        power_supply_type: report.power_supply_type || '',
        breaker: report.breaker || '',
        cable_entry_phase: report.cable_entry_phase || '',
        cable_entry_neutral: report.cable_entry_neutral || '',
        cable_entry_ground: report.cable_entry_ground || '',
        cable_exit_phase: report.cable_exit_phase || '',
        cable_exit_neutral: report.cable_exit_neutral || '',
        external_inspection: report.external_inspection || '',
        internal_inspection: report.internal_inspection || '',
        attendance_description: report.attendance_description || '',
        diagnosis: report.diagnosis || '',
        conclusion: report.conclusion || '',
        cooled_environment: report.cooled_environment || '',
        external_battery_positive_cable: report.external_battery_positive_cable || '',
        external_battery_negative_cable: report.external_battery_negative_cable || '',
        external_battery_neutral_cable: report.external_battery_neutral_cable || '',
        external_battery_connection: report.external_battery_connection || '',
        external_battery_nobreak_connection: report.external_battery_nobreak_connection || '',
        electrical_measurements: report.electrical_measurements || { entrada: { tensions: {}, currents: {} }, saida: { tensions: {}, currents: {} } },
        battery_bank: report.battery_bank || { 
          type: '', quantity: '', voltage: '', battery_volts: '', battery_current: '',
          charger_voltage: '', brand: '', model: '', last_change: '', trocou_baterias: '',
          motivo_nao_troca: '', voltage_positive_neutral: '', voltage_neutral_negative: ''
        },
        technician_signature: report.technician_signature || '',
        client_signature: report.client_signature || '',
        technician_edit_count: report.technician_edit_count || 0
      });

      if (report.expand?.equipment_id) {
        setSelectedEquipmentData(report.expand.equipment_id);
      }
      
      if (report.client_id) {
        await fetchClientEquipments(report.client_id);
      }
      
      const photoRes = await axios.get(`${API_BASE_URL}/report-photos?report_id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const photoRecords = photoRes.data.data || [];
      
      const processedPhotos = await Promise.all(photoRecords.map(async p => {
        const url = p.photo_url;
        const orientation = await getImageOrientation(url);
        return {
          id: p.id,
          url,
          comment: p.comment || '',
          sequence: p.sequence || 0,
          orientation
        };
      }));
      
      setPhotos(processedPhotos);

      if (report.technician_id && !report.technician_signature) {
        await handleTechnicianSignature(report.technician_id);
      }

      setLoading(false);
    } catch (error) {
      toast.error('Erro ao carregar relatório');
      setLoading(false);
    }
  };

  const fetchClientEquipments = async (cId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const eqsRes = await axios.get(`${API_BASE_URL}/equipments?client_id=${cId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setClientEquipments(eqsRes.data.data || []);
    } catch (e) {
      toast.error('Erro ao carregar equipamentos');
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

    if (formData.equipment_id) {
      if (!formData.service_type) errors.push('Informe o Tipo de Serviço.');
      if (!formData.installation_location) errors.push('Informe o Local da Instalação.');
      if (formData.installation_location === 'Inadequado' && !formData.installation_location_explanation) {
        errors.push('Informe o motivo do local inadequado.');
      }
      if (!formData.power_supply_type) errors.push('Informe o Tipo de Alimentação.');
      if (!formData.responsible_person) errors.push('Informe o Responsável no Local (Aba Assinaturas).');
    }

    setValidationErrors(errors);
    if (errors.length > 0) {
      toast.error('Preencha os campos obrigatórios antes de salvar.');
      return false;
    }
    return true;
  };

  const hasBattery = selectedEquipmentData?.type === 'Nobreak';
  const tabsOrder = ['equipment', 'installation', 'electrical', ...(hasBattery ? ['battery'] : []), 'attendance', 'photos', 'signatures'];

  const handleNextTab = () => {
    const idx = tabsOrder.indexOf(activeTab);
    if (idx < tabsOrder.length - 1) {
      setActiveTab(tabsOrder[idx + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevTab = () => {
    const idx = tabsOrder.indexOf(activeTab);
    if (idx > 0) {
      setActiveTab(tabsOrder[idx - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const clearTechSignature = () => {
    if (techSigPad.current) {
      techSigPad.current.clear();
    }
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

  const handleFinalSave = async () => {
    if (isReadOnly) return;
    if (!validateForm()) return;
    setSaving(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const existingReportRes = await axios.get(`${API_BASE_URL}/reports/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const existingReport = existingReportRes.data.data;
      const finalStatus = 'submitted';
      
      let editCount = existingReport.technician_edit_count || 0;
      if (isTech && editCount === 0) editCount = 1;
      
      let techSignatureToSave = existingReport.technician_signature || '';
      if (techSigPad.current && !techSigPad.current.isEmpty()) {
        techSignatureToSave = techSigPad.current.toDataURL('image/png');
      } else if (formData.technician_signature) {
        techSignatureToSave = formData.technician_signature;
      }

      let clientSignatureToSave = existingReport.client_signature || formData.client_signature || '';
      if (clientSigPad.current && !clientSigPad.current.isEmpty()) {
        clientSignatureToSave = clientSigPad.current.getTrimmedCanvas().toDataURL('image/png');
      }
      
      const payload = {
        ...existingReport,
        ...formData,
        status: finalStatus,
        technician_edit_count: editCount,
        technician_signature: techSignatureToSave,
        client_signature: clientSignatureToSave
      };

      await axios.put(`${API_BASE_URL}/reports/${id}`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      for (const photo of photos) {
        if (photo.file && photo.id.startsWith('temp_')) {
          const formDataObj = new FormData();
          formDataObj.append('report_id', id);
          formDataObj.append('photo_url', photo.file);
          formDataObj.append('comment', photo.comment || '');
          if (photo.sequence) formDataObj.append('sequence', photo.sequence);
          await axios.post(`${API_BASE_URL}/report-photos`, formDataObj, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          });
        } else if (photo.id && !photo.id.startsWith('temp_')) {
          await axios.put(`${API_BASE_URL}/report-photos/${photo.id}`, {
            comment: photo.comment || ''
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      }

      toast.success('Relatório salvo e finalizado com sucesso');
      navigate(`/reports/${id}`);
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    if (isReadOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  const updateElectrical = (section, type, field, value) => {
    if (isReadOnly) return;
    setFormData(prev => {
      const updated = { ...prev };
      if (!updated.electrical_measurements[section]) updated.electrical_measurements[section] = { tensions: {}, currents: {} };
      if (!updated.electrical_measurements[section][type]) updated.electrical_measurements[section][type] = {};
      updated.electrical_measurements[section][type][field] = value;
      return updated;
    });
  };

  const updateBattery = (field, value) => {
    if (isReadOnly) return;
    setFormData(prev => ({
      ...prev,
      battery_bank: { ...prev.battery_bank, [field]: value }
    }));
  };

  const handlePhotoUpload = async (e) => {
    if (isReadOnly) return;
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const { file: compressedFile, dataUrl } = await compressImage(file, 800);
        const orientation = await getImageOrientation(dataUrl);
        setPhotos(prev => [
          ...prev, 
          { id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, url: dataUrl, file: compressedFile, comment: '', sequence: prev.length + 1, orientation }
        ]);
      } catch (error) {
        toast.error('Erro ao processar imagem');
      }
    }
  };

  const updatePhoto = (photoId, field, value) => {
    if (isReadOnly) return;
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, [field]: value } : p));
  };

  const removePhoto = async (photoId) => {
    if (isReadOnly) return;
    if (!photoId.startsWith('temp_')) {
      try {
        const token = localStorage.getItem('auth_token');
        await axios.delete(`${API_BASE_URL}/report-photos/${photoId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {}
    }
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const clearClientSignature = () => {
    if (isReadOnly) return;
    setFormData(prev => ({ ...prev, client_signature: '' }));
    if (clientSigPad.current) {
      clientSigPad.current.clear();
    }
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
        <span className="text-[hsl(var(--text-primary))] block text-[10px] font-bold uppercase tracking-wide">{label}</span>
        <span className="font-medium text-sm text-[hsl(var(--text-primary))]">{value}</span>
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center py-24"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  const vType = selectedEquipmentData?.voltage_type;
  const getElecValue = (section, type, field) => formData.electrical_measurements?.[section]?.[type]?.[field] || '';
  const selectedTech = technicians.find(t => t.id === formData.technician_id);
  const isSymmetric = selectedEquipmentData?.symmetric === 'Sim';
  const hasClientSignature = formData.client_signature && typeof formData.client_signature === 'string' && formData.client_signature.trim() !== '';

  const inputClasses = "bg-[hsl(var(--input-bg))] text-[hsl(var(--text-primary))] border-border focus-visible:ring-1";
  const labelClasses = "text-[hsl(var(--text-primary))] font-semibold";
  const headerClasses = "bg-[hsl(var(--primary))] text-[hsl(var(--text-primary))] p-3 rounded-t-lg font-bold uppercase tracking-wide";

  return (
    <div className="bg-background text-[hsl(var(--text-primary))]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isReadOnly ? 'Visualizando Relatório' : 'Editar Relatório'} {formData.service_order_number && `- OS: ${formData.service_order_number}`}
          </h2>
          {selectedEquipmentData && (
            <p className="font-medium mt-1 text-sm flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4" />
              {selectedEquipmentData.type} ({selectedEquipmentData.brand} - {selectedEquipmentData.serial_number})
            </p>
          )}
        </div>
      </div>

      {isReadOnly && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 flex items-start gap-3 shadow-sm">
          <Info className="h-5 w-5 mt-0.5 shrink-0 text-blue-600" />
          <div>
            <h4 className="font-semibold mb-1">Modo de Leitura</h4>
            <p className="text-sm">Você não tem permissão para editar este relatório. Apenas o autor do relatório ({selectedTech?.name || 'outro técnico'}) ou um gerente pode editá-lo.</p>
          </div>
        </div>
      )}

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

      <fieldset disabled={isReadOnly} className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto overflow-x-auto flex-nowrap shrink-0">
            <TabsTrigger value="equipment" className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:text-black border-b-2 border-transparent rounded-none px-6 py-3 font-semibold"><Settings2 className="w-4 h-4 mr-2"/> Equipamento</TabsTrigger>
            <TabsTrigger value="installation" disabled={!formData.equipment_id} className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:text-black border-b-2 border-transparent rounded-none px-6 py-3 font-semibold"><Activity className="w-4 h-4 mr-2"/> Instalação</TabsTrigger>
            <TabsTrigger value="electrical" disabled={!formData.equipment_id} className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:text-black border-b-2 border-transparent rounded-none px-6 py-3 font-semibold"><Zap className="w-4 h-4 mr-2"/> Elétrica</TabsTrigger>
            {hasBattery && <TabsTrigger value="battery" disabled={!formData.equipment_id} className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:text-black border-b-2 border-transparent rounded-none px-6 py-3 font-semibold"><Battery className="w-4 h-4 mr-2"/> Baterias</TabsTrigger>}
            <TabsTrigger value="attendance" disabled={!formData.equipment_id} className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:text-black border-b-2 border-transparent rounded-none px-6 py-3 font-semibold"><FileText className="w-4 h-4 mr-2"/> Descrição</TabsTrigger>
            <TabsTrigger value="photos" disabled={!formData.equipment_id} className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:text-black border-b-2 border-transparent rounded-none px-6 py-3 font-semibold"><ImageIcon className="w-4 h-4 mr-2"/> Fotos</TabsTrigger>
            <TabsTrigger value="signatures" disabled={!formData.equipment_id} className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:text-black border-b-2 border-transparent rounded-none px-6 py-3 font-semibold"><PenTool className="w-4 h-4 mr-2"/> Assinaturas</TabsTrigger>
          </TabsList>

          <div className="p-6 md:p-8 flex-1">
            <TabsContent value="equipment" className="mt-0 space-y-6 h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                <div className="space-y-2">
                  <Label className={labelClasses}>Cliente <span className="text-destructive">*</span></Label>
                  <Popover open={clientOpen} onOpenChange={(o) => { if(!isReadOnly) { setClientOpen(o); if (!o) setClientSearchTerm(''); } }}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={clientOpen} className={cn("w-full justify-between font-normal text-left", inputClasses, !formData.client_id && validationErrors.length > 0 && "border-destructive")}>
                        <span className="truncate">{formData.client_id ? clients.find(c => c.id === formData.client_id)?.name : "Selecione o cliente..."}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
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
                  <Label className={labelClasses}>Técnico Responsável <span className="text-destructive">*</span></Label>
                  <Select value={formData.technician_id} onValueChange={handleTechChange} disabled={isReadOnly}>
                    <SelectTrigger className={cn(inputClasses, !formData.technician_id && validationErrors.length > 0 && "border-destructive")}>
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
                    <div className="p-6 border rounded-xl bg-white flex flex-col items-center justify-center space-y-4">
                      <MonitorSmartphone className="h-10 w-10 text-muted-foreground opacity-50" />
                      <div className="text-center">
                        <p className="font-medium text-foreground mb-1">Nenhum equipamento selecionado</p>
                        <p className="text-sm text-muted-foreground mb-4">Selecione um equipamento deste cliente para começar.</p>
                      </div>
                      <Button onClick={() => setEquipmentModalOpen(true)} disabled={isReadOnly} className={cn(!formData.equipment_id && validationErrors.length > 0 && "ring-2 ring-destructive ring-offset-2")}>Selecionar Equipamento</Button>
                    </div>
                  ) : (
                    <Card className="border-border">
                      <div className={headerClasses}>
                        <div className="flex flex-row items-center justify-between">
                          <span className="text-lg">Dados do Equipamento Selecionado</span>
                          {!isReadOnly && <Button variant="outline" size="sm" onClick={() => setEquipmentModalOpen(true)} className="text-black border-black hover:bg-black/10">Trocar Equipamento</Button>}
                        </div>
                      </div>
                      <CardContent className="pt-6 bg-white">
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
                          {renderEquipmentField('Tensão Bateria (VDC)', selectedEquipmentData.voltage_battery)}
                          {renderEquipmentField('Corrente Bateria', selectedEquipmentData.current_battery)}
                          {renderEquipmentField('Tipo de Bateria', selectedEquipmentData.battery_type)}
                          {renderEquipmentField('Quantidade de Baterias', selectedEquipmentData.battery_quantity)}
                          {renderEquipmentField('Bateria Volts (VDC)', selectedEquipmentData.battery_volts)}
                          {renderEquipmentField('Corrente Bateria (AH/W)', selectedEquipmentData.battery_current)}
                          {renderEquipmentField('Conexão de Baterias', selectedEquipmentData.battery_connection)}
                          {renderEquipmentField('Terminal de Baterias', selectedEquipmentData.battery_terminal)}
                          {renderEquipmentField('Marca da Bateria', selectedEquipmentData.battery_brand)}
                          {renderEquipmentField('Modelo da Bateria', selectedEquipmentData.battery_model)}
                          {renderEquipmentField('Corrente Entrada (A)', selectedEquipmentData.current_in)}
                          {renderEquipmentField('Corrente Saída (A)', selectedEquipmentData.current_out)}
                          {renderEquipmentField('Certificação', selectedEquipmentData.certification)}
                          {renderEquipmentField('Capacidade (AH/W)', selectedEquipmentData.capacity_ah)}
                          {renderEquipmentField('Simétrico', selectedEquipmentData.symmetric)}
                          {renderEquipmentField('Isolado', selectedEquipmentData.isolated)}
                          {renderEquipmentField('Qtd. Sinalizadores', selectedEquipmentData.signalizers_quantity)}
                          {renderEquipmentField('IHM', selectedEquipmentData.ihm)}
                          {renderEquipmentField('Localizadores', selectedEquipmentData.localizadores)}
                          {renderEquipmentField('Tipo de Cabo de Comunicação', selectedEquipmentData.communication_cable_type)}
                          {renderEquipmentField('Fixação', selectedEquipmentData.fixation)}
                          {renderEquipmentField('Quantidade', selectedEquipmentData.quantity)}
                          {renderEquipmentField('Ambiente Refrigerado', selectedEquipmentData.cooled_environment)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="installation" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                <div className="space-y-2 md:col-span-2">
                  <Label className={labelClasses}>Tipo de Serviço <span className="text-destructive">*</span></Label>
                  <Input 
                    value={formData.service_type} 
                    onChange={e => updateField('service_type', e.target.value.toUpperCase())} 
                    placeholder="Ex: Manutenção Preventiva, Instalação..."
                    className={cn(inputClasses, !formData.service_type && validationErrors.length > 0 && "border-destructive")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses}>Local da Instalação <span className="text-destructive">*</span></Label>
                  <Select value={formData.installation_location} onValueChange={(v) => updateField('installation_location', v)}>
                    <SelectTrigger className={cn(inputClasses, !formData.installation_location && validationErrors.length > 0 && "border-destructive")}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTALLATION_LOCATION_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.installation_location === 'Inadequado' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className={labelClasses}>Motivo do Local Inadequado <span className="text-destructive">*</span></Label>
                    <Textarea 
                      value={formData.installation_location_explanation} 
                      onChange={(e) => updateField('installation_location_explanation', e.target.value)}
                      placeholder="Descreva o motivo..."
                      className={cn(inputClasses, !formData.installation_location_explanation && validationErrors.length > 0 && "border-destructive")}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className={labelClasses}>Tipo de Alimentação <span className="text-destructive">*</span></Label>
                  <Select value={formData.power_supply_type} onValueChange={(v) => updateField('power_supply_type', v)}>
                    <SelectTrigger className={cn(inputClasses, !formData.power_supply_type && validationErrors.length > 0 && "border-destructive")}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {POWER_SUPPLY_TYPES.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Disjuntor</Label>
                  <Input className={inputClasses} value={formData.breaker} onChange={(e) => updateField('breaker', e.target.value)} placeholder="Ex: 20A" />
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Cabos de Entrada - Fase (mm²)</Label>
                  <Input className={inputClasses} type="number" value={formData.cable_entry_phase} onChange={(e) => updateField('cable_entry_phase', e.target.value)} placeholder="Ex: 2.5" />
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Cabos de Entrada - Neutro (mm²)</Label>
                  <Input className={inputClasses} type="number" value={formData.cable_entry_neutral} onChange={(e) => updateField('cable_entry_neutral', e.target.value)} placeholder="Ex: 2.5" />
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Cabos de Entrada - Terra (mm²)</Label>
                  <Input className={inputClasses} type="number" value={formData.cable_entry_ground} onChange={(e) => updateField('cable_entry_ground', e.target.value)} placeholder="Ex: 2.5" />
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Cabos de Saída - Fase (mm²)</Label>
                  <Input className={inputClasses} type="number" value={formData.cable_exit_phase} onChange={(e) => updateField('cable_exit_phase', e.target.value)} placeholder="Ex: 2.5" />
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Cabos de Saída - Neutro (mm²)</Label>
                  <Input className={inputClasses} type="number" value={formData.cable_exit_neutral} onChange={(e) => updateField('cable_exit_neutral', e.target.value)} placeholder="Ex: 2.5" />
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Ambiente Refrigerado</Label>
                  <Select value={formData.cooled_environment} onValueChange={(v) => updateField('cooled_environment', v)}>
                    <SelectTrigger className={inputClasses}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COOLED_ENV_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="electrical" className="mt-0 space-y-6">
              <div className="space-y-8">
                <Card className="border-border">
                  <div className={headerClasses}>Medições de Entrada</div>
                  <CardContent className="pt-6 space-y-4 bg-white">
                    {vType === 'TRIFÁSICA' || vType === 'TRIMONO' ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão R-S (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'tensions', 'rs')} onChange={(e) => updateElectrical('entrada', 'tensions', 'rs', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão S-T (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'tensions', 'st')} onChange={(e) => updateElectrical('entrada', 'tensions', 'st', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão R-T (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'tensions', 'rt')} onChange={(e) => updateElectrical('entrada', 'tensions', 'rt', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão R-N (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'tensions', 'rn')} onChange={(e) => updateElectrical('entrada', 'tensions', 'rn', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão S-N (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'tensions', 'sn')} onChange={(e) => updateElectrical('entrada', 'tensions', 'sn', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão T-N (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'tensions', 'tn')} onChange={(e) => updateElectrical('entrada', 'tensions', 'tn', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão N-T (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'tensions', 'nt')} onChange={(e) => updateElectrical('entrada', 'tensions', 'nt', e.target.value)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente R (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'currents', 'r')} onChange={(e) => updateElectrical('entrada', 'currents', 'r', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente S (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'currents', 's')} onChange={(e) => updateElectrical('entrada', 'currents', 's', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente T (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'currents', 't')} onChange={(e) => updateElectrical('entrada', 'currents', 't', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente Neutro (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'currents', 'neutral')} onChange={(e) => updateElectrical('entrada', 'currents', 'neutral', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente Terra (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'currents', 'ground')} onChange={(e) => updateElectrical('entrada', 'currents', 'ground', e.target.value)} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão F/N (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'tensions', 'single')} onChange={(e) => updateElectrical('entrada', 'tensions', 'single', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão N/T (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'tensions', 'nt')} onChange={(e) => updateElectrical('entrada', 'tensions', 'nt', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente Fase (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'currents', 'single')} onChange={(e) => updateElectrical('entrada', 'currents', 'single', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente Neutro (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'currents', 'neutral')} onChange={(e) => updateElectrical('entrada', 'currents', 'neutral', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente Terra (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('entrada', 'currents', 'ground')} onChange={(e) => updateElectrical('entrada', 'currents', 'ground', e.target.value)} />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <div className={headerClasses}>Medições de Saída</div>
                  <CardContent className="pt-6 space-y-4 bg-white">
                    {vType === 'TRIFÁSICA' || (vType === 'TRIMONO') ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão R-S (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'tensions', 'rs')} onChange={(e) => updateElectrical('saida', 'tensions', 'rs', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão S-T (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'tensions', 'st')} onChange={(e) => updateElectrical('saida', 'tensions', 'st', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão R-T (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'tensions', 'rt')} onChange={(e) => updateElectrical('saida', 'tensions', 'rt', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão R-N (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'tensions', 'rn')} onChange={(e) => updateElectrical('saida', 'tensions', 'rn', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão S-N (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'tensions', 'sn')} onChange={(e) => updateElectrical('saida', 'tensions', 'sn', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão T-N (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'tensions', 'tn')} onChange={(e) => updateElectrical('saida', 'tensions', 'tn', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão N-T (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'tensions', 'nt')} onChange={(e) => updateElectrical('saida', 'tensions', 'nt', e.target.value)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente R (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'currents', 'r')} onChange={(e) => updateElectrical('saida', 'currents', 'r', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente S (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'currents', 's')} onChange={(e) => updateElectrical('saida', 'currents', 's', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente T (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'currents', 't')} onChange={(e) => updateElectrical('saida', 'currents', 't', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente Neutro (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'currents', 'neutral')} onChange={(e) => updateElectrical('saida', 'currents', 'neutral', e.target.value)} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão F/N (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'tensions', 'single')} onChange={(e) => updateElectrical('saida', 'tensions', 'single', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Tensão N/T (V)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'tensions', 'nt')} onChange={(e) => updateElectrical('saida', 'tensions', 'nt', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente Fase (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'currents', 'single')} onChange={(e) => updateElectrical('saida', 'currents', 'single', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClasses}>Corrente Neutro (A)</Label>
                            <Input className={inputClasses} type="number" value={getElecValue('saida', 'currents', 'neutral')} onChange={(e) => updateElectrical('saida', 'currents', 'neutral', e.target.value)} />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {hasBattery && (
              <TabsContent value="battery" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                  <div className="space-y-2">
                    <Label className={labelClasses}>Banco de Baterias</Label>
                    <Select value={formData.battery_bank.type} onValueChange={(v) => updateBattery('type', v)}>
                      <SelectTrigger className={inputClasses}>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BATTERY_TYPES.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses}>Quantidade de Baterias</Label>
                    <Input className={inputClasses} type="number" value={formData.battery_bank.quantity} onChange={(e) => updateBattery('quantity', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses}>Bateria Volts (VDC)</Label>
                    <Input className={inputClasses} type="number" value={formData.battery_bank.battery_volts} onChange={(e) => updateBattery('battery_volts', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses}>Corrente Bateria (Ah/W)</Label>
                    <Input className={inputClasses} value={formData.battery_bank.battery_current} onChange={(e) => updateBattery('battery_current', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses}>Tensão do Banco +/- (VDC)</Label>
                    <Input className={inputClasses} type="number" value={formData.battery_bank.voltage} onChange={(e) => updateBattery('voltage', e.target.value)} />
                  </div>

                  {isSymmetric && (
                    <>
                      <div className="space-y-2">
                        <Label className={labelClasses}>Tensão do Banco +/N (VDC)</Label>
                        <Input className={inputClasses} type="number" value={formData.battery_bank.voltage_positive_neutral} onChange={(e) => updateBattery('voltage_positive_neutral', e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClasses}>Tensão do Banco N/- (VDC)</Label>
                        <Input className={inputClasses} type="number" value={formData.battery_bank.voltage_neutral_negative} onChange={(e) => updateBattery('voltage_neutral_negative', e.target.value)} />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label className={labelClasses}>Tensão Carregador (VDC)</Label>
                    <Input className={inputClasses} type="number" value={formData.battery_bank.charger_voltage} onChange={(e) => updateBattery('charger_voltage', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses}>Marca</Label>
                    <Input className={inputClasses} value={formData.battery_bank.brand} onChange={(e) => updateBattery('brand', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses}>Modelo</Label>
                    <Input className={inputClasses} value={formData.battery_bank.model} onChange={(e) => updateBattery('model', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses}>Trocou Baterias?</Label>
                    <Select value={formData.battery_bank.trocou_baterias} onValueChange={(v) => updateBattery('trocou_baterias', v)}>
                      <SelectTrigger className={inputClasses}>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">SIM</SelectItem>
                        <SelectItem value="NÃO">NÃO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.battery_bank.trocou_baterias === 'SIM' && (
                    <div className="space-y-2">
                      <Label className={labelClasses}>Data da Última Troca</Label>
                      <Input className={inputClasses} type="date" value={formData.battery_bank.last_change} onChange={(e) => updateBattery('last_change', e.target.value)} />
                    </div>
                  )}

                  {formData.battery_bank.trocou_baterias === 'NÃO' && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className={labelClasses}>Motivo de Não Trocar</Label>
                      <Textarea className={inputClasses} value={formData.battery_bank.motivo_nao_troca} onChange={(e) => updateBattery('motivo_nao_troca', e.target.value)} />
                    </div>
                  )}

                  {formData.battery_bank.type === 'Externo' && (
                    <>
                      <div className="space-y-2">
                        <Label className={labelClasses}>Cabo Positivo Bat. Ext. (mm²)</Label>
                        <Input className={inputClasses} type="number" value={formData.external_battery_positive_cable} onChange={(e) => updateField('external_battery_positive_cable', e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClasses}>Cabo Negativo Bat. Ext. (mm²)</Label>
                        <Input className={inputClasses} type="number" value={formData.external_battery_negative_cable} onChange={(e) => updateField('external_battery_negative_cable', e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClasses}>Cabo Neutro Bat. Ext. (mm²)</Label>
                        <Input className={inputClasses} type="number" value={formData.external_battery_neutral_cable} onChange={(e) => updateField('external_battery_neutral_cable', e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClasses}>Conexão Bateria</Label>
                        <Select value={formData.external_battery_connection} onValueChange={(v) => updateField('external_battery_connection', v)}>
                          <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {EXTERNAL_CONNECTION_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClasses}>Conexão Nobreak</Label>
                        <Select value={formData.external_battery_nobreak_connection} onValueChange={(v) => updateField('external_battery_nobreak_connection', v)}>
                          <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {EXTERNAL_CONNECTION_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            )}

            <TabsContent value="attendance" className="mt-0 space-y-6">
              <div className="space-y-6 max-w-4xl">
                <div className="space-y-2">
                  <Label className={labelClasses}>Realizado no Atendimento</Label>
                  <Textarea 
                    className={inputClasses}
                    value={formData.attendance_description} 
                    onChange={(e) => updateField('attendance_description', e.target.value)}
                    placeholder="Descreva as atividades realizadas..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Diagnóstico</Label>
                  <Textarea 
                    className={inputClasses}
                    value={formData.diagnosis} 
                    onChange={(e) => updateField('diagnosis', e.target.value)}
                    placeholder="Descreva o diagnóstico técnico..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Conclusão</Label>
                  <Textarea 
                    className={inputClasses}
                    value={formData.conclusion} 
                    onChange={(e) => updateField('conclusion', e.target.value)}
                    placeholder="Conclusão do atendimento..."
                    rows={6}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="photos" className="mt-0 space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))]">Fotos do Atendimento</h3>
                  {!isReadOnly && (
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="bg-[hsl(var(--primary))] text-[hsl(var(--text-primary))] hover:opacity-90 px-4 py-2 rounded-md inline-flex items-center text-sm font-medium transition-colors">
                        <Upload className="mr-2 h-4 w-4" />
                        Adicionar Fotos
                      </div>
                    </Label>
                  )}
                  <Input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handlePhotoUpload} 
                    disabled={isReadOnly}
                  />
                </div>

                {photos.length === 0 ? (
                  <div className="border-2 border-dashed rounded-xl p-12 text-center bg-[hsl(var(--input-bg))]">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--text-primary))] opacity-30" />
                    <p className="text-[hsl(var(--text-primary))] opacity-60 mb-2">Nenhuma foto adicionada</p>
                    {!isReadOnly && <p className="text-sm text-[hsl(var(--text-primary))] opacity-50">Clique em "Adicionar Fotos" para fazer upload</p>}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {photos.map((photo) => (
                      <Card key={photo.id} className="overflow-hidden border-border shadow-sm">
                        <div className={photo.orientation === 'portrait' ? "relative flex justify-center bg-muted py-2" : "relative aspect-video bg-muted"}>
                          <img 
                            src={photo.url} 
                            alt="Foto" 
                            className={photo.orientation === 'portrait' ? "max-w-[150px] h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity" : "w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"} 
                            onClick={() => setZoomPhoto(photo.url)}
                          />
                          {!isReadOnly && (
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="absolute top-2 right-2 h-8 w-8 shadow-sm"
                              onClick={() => removePhoto(photo.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="absolute top-2 left-2 h-8 w-8 shadow-sm"
                            onClick={() => setZoomPhoto(photo.url)}
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardContent className="p-4 bg-white">
                          <div className="space-y-2">
                            <Label className={cn("text-xs", labelClasses)}>Comentário</Label>
                            <Textarea 
                              value={photo.comment} 
                              onChange={(e) => updatePhoto(photo.id, 'comment', e.target.value)}
                              placeholder="Adicione um comentário..."
                              rows={2}
                              className={cn("text-sm", inputClasses)}
                              disabled={isReadOnly}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="signatures" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                <Card className="border-border">
                  <div className={headerClasses}>Assinatura do Técnico</div>
                  <CardContent className="pt-6 bg-white">
                    {formData.technician_signature ? (
                      <div className={cn("border rounded-lg p-4", inputClasses)}>
                        <img src={formData.technician_signature} alt="Assinatura Técnico" className="w-full h-32 object-contain" />
                        <p className="text-sm mt-2 text-center font-medium">{selectedTech?.name}</p>
                      </div>
                    ) : (
                      <div className={cn("border-2 border-dashed rounded-lg p-8 text-center", inputClasses)}>
                        <p className="text-sm opacity-60">Assinatura será carregada automaticamente</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <div className={headerClasses}>Responsável no Local <span className="text-destructive">*</span></div>
                  <CardContent className="pt-6 space-y-4 bg-white">
                    <div className="space-y-2">
                      <Label className={labelClasses}>Nome do Responsável</Label>
                      <Input 
                        value={formData.responsible_person} 
                        onChange={(e) => updateField('responsible_person', e.target.value)}
                        placeholder="Nome completo"
                        className={cn(inputClasses, !formData.responsible_person && validationErrors.length > 0 && "border-destructive")}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClasses}>Assinatura do Cliente</Label>
                      {hasClientSignature ? (
                        <div className="space-y-2">
                          <div className={cn("border rounded-lg p-4 bg-white")}>
                            <ClientSignatureDisplay signature={formData.client_signature} />
                          </div>
                          {!isReadOnly && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={clearClientSignature}
                              className="w-full text-[hsl(var(--text-primary))] border-[hsl(var(--text-primary))] hover:bg-black/5"
                            >
                              Redesenhar Assinatura
                            </Button>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="border rounded-lg overflow-hidden bg-white">
                            <SignatureCanvas 
                              ref={clientSigPad}
                              canvasProps={{ className: 'w-full h-32' }}
                            />
                          </div>
                          {!isReadOnly && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => clientSigPad.current?.clear()}
                                className="flex-1 text-[hsl(var(--text-primary))] border-[hsl(var(--text-primary))] hover:bg-black/5"
                              >
                                Limpar
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
          
          <div className="bg-muted/50 border-t p-4 md:px-8 md:py-5 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
            <div className="w-full sm:w-auto flex gap-3">
              <Button variant="outline" onClick={() => navigate('/reports')} className="w-full sm:w-auto border-black text-black hover:bg-black/10">Cancelar</Button>
              {tabsOrder.indexOf(activeTab) > 0 && (
                <Button variant="secondary" onClick={handlePrevTab} className="w-full sm:w-auto text-black border border-black/20 hover:bg-black/10">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
              {activeTab !== 'signatures' ? (
                <Button onClick={handleNextTab} className="w-full sm:w-auto min-w-[140px] bg-[hsl(var(--primary))] text-[hsl(var(--text-primary))] hover:opacity-90">
                  Próxima <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                !isReadOnly && (
                  <Button 
                    onClick={handleFinalSave} 
                    disabled={saving || !formData.equipment_id}
                    className="w-full sm:w-auto min-w-[160px] bg-[hsl(var(--primary))] text-[hsl(var(--text-primary))] hover:opacity-90"
                  >
                    {saving ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Alterações
                  </Button>
                )
              )}
            </div>
          </div>
        </Tabs>
      </fieldset>

      <Dialog open={!!zoomPhoto} onOpenChange={() => setZoomPhoto(null)}>
        <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none">
          {zoomPhoto && <img src={zoomPhoto} alt="Zoomed" className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white/5 backdrop-blur-sm p-1" />}
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

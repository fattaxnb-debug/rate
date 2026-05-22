
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
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Upload, X, ZoomIn, ArrowRight, ArrowLeft, Save, Settings2, Zap, Battery, Activity, FileText, Image as ImageIcon, PenTool, MonitorSmartphone, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSearch } from '@/hooks/useSearch.js';
import { compressImage } from '@/utils/imageCompression.js';
import SignatureCanvas from 'react-signature-canvas';
import SignaturePadNative from '@/components/SignaturePadNative.jsx';
import { cn } from '@/lib/utils.js';
import EquipmentSelectionModal from '@/components/EquipmentSelectionModal.jsx';
import ClientSignatureDisplay from '@/components/ClientSignatureDisplay.jsx';
import { API_BASE_URL } from '@/config/api.js';

const INSTALLATION_LOCATION_OPTIONS = ['ADEQUADO', 'INADEQUADO'];
const POWER_SUPPLY_TYPES = ['CIRCUITO', 'TOMADA', 'TOMADA INDUSTRIAL'];
const BATTERY_TYPES = ['INTERNO', 'EXTERNO'];
const COOLED_ENV_OPTIONS = ['SIM', 'NÃO'];
const BATTERY_CONNECTION_OPTIONS = ['CABOS', 'BARRA', 'CABOS E BARRAS'];
const EXTERNAL_CONNECTION_OPTIONS = ['DISJUNTOR', 'BORNE', 'DIRETO'];

export default function ReportEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('equipment');
  const [activeAccordion, setActiveAccordion] = useState('equipment');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  const [validationErrors, setValidationErrors] = useState([]);
  
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
    reported_problems: '',
    identified_defects: '',
    procedures_performed: '',
    replaced_parts: '',
    parts_request: '',
    observations: '',
    external_battery_positive_cable: '',
    external_battery_negative_cable: '',
    external_battery_neutral_cable: '',
    external_battery_connection: '',
    external_battery_nobreak_connection: '',
    electrical_measurements: { entrada: { tensions: {}, currents: {} }, saida: { tensions: {}, currents: {} } },
    battery_bank: { 
      type: '', 
      quantity: '', 
      voltage: '', 
      battery_volts: '', 
      battery_current: '',
      charger_voltage: '', 
      brand: '', 
      model: '',
      last_change: '',
      trocou_baterias: '',
      motivo_nao_troca: '',
      voltage_positive_neutral: '',
      voltage_neutral_negative: ''
    },
    technician_signature: '',
    client_signature: '',
    technician_edit_count: 0
  });

  const [selectedEquipmentData, setSelectedEquipmentData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [zoomPhoto, setZoomPhoto] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const clientSigPad = useRef(null);
  const techSigPad = useRef(null);

  const isTech = currentUser?.role === 'Técnico';
  const isGerente = currentUser?.role === 'Gerente';

  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
      
      // Buscar assinatura do técnico das configurações
      let techSignatureFromSettings = '';
      try {
        const settingsRes = await axios.get(`${API_BASE_URL}/settings/user/${currentUser.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const settings = settingsRes.data.data || {};
        
        if (currentUser.email.includes('tiago') && settings.signature_tiago_viana) {
          techSignatureFromSettings = settings.signature_tiago_viana;
        } else if (currentUser.email.includes('tito') && settings.signature_tito_livio) {
          techSignatureFromSettings = settings.signature_tito_livio;
        }
        
        console.log('[REPORT EDITOR DEBUG] Technician signature from settings:', techSignatureFromSettings ? 'Found' : 'Not found');
      } catch (e) {
        console.log('[REPORT EDITOR DEBUG] Error fetching settings:', e.message);
      }
      
      // Access Control
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
        reported_problems: report.reported_problems || '',
        identified_defects: report.identified_defects || '',
        procedures_performed: report.procedures_performed || '',
        replaced_parts: report.replaced_parts || '',
        parts_request: report.parts_request || '',
        observations: report.observations || '',
        external_battery_positive_cable: report.external_battery_positive_cable || '',
        external_battery_negative_cable: report.external_battery_negative_cable || '',
        external_battery_neutral_cable: report.external_battery_neutral_cable || '',
        external_battery_connection: report.external_battery_connection || '',
        external_battery_nobreak_connection: report.external_battery_nobreak_connection || '',
        electrical_measurements: report.electrical_measurements || { entrada: { tensions: {}, currents: {} }, saida: { tensions: {}, currents: {} } },
        battery_bank: report.battery_bank || { 
          type: '', 
          quantity: '', 
          voltage: '', 
          battery_volts: '', 
          battery_current: '',
          charger_voltage: '', 
          brand: '', 
          model: '',
          last_change: '',
          trocou_baterias: '',
          motivo_nao_troca: '',
          voltage_positive_neutral: '',
          voltage_neutral_negative: ''
        },
        technician_signature: report.technician_signature || techSignatureFromSettings || '',
        client_signature: report.client_signature || '',
        technician_edit_count: report.technician_edit_count || 0
      });

      if (report.expand?.equipment_id) {
        setSelectedEquipmentData(report.expand.equipment_id);
      }
      
      // Buscar dados do equipamento separadamente
      if (report.equipment_id && !report.expand?.equipment_id) {
        try {
          console.log('[REPORT EDITOR DEBUG] Fetching equipment:', report.equipment_id);
          const equipmentResponse = await axios.get(`${API_BASE_URL}/equipments/${report.equipment_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('[REPORT EDITOR DEBUG] Equipment response:', equipmentResponse.data.data);
          setSelectedEquipmentData(equipmentResponse.data.data);
        } catch (e) {
          console.error('[REPORT EDITOR DEBUG] Error fetching equipment:', e);
          setSelectedEquipmentData(null);
        }
      }
      
      if (report.client_id) {
        await fetchClientEquipments(report.client_id);
      }
      
      // Usar fotos do campo photos do relatório
      const manualPhotos = report.photos || [];
      console.log('[REPORT EDITOR DEBUG] Report object:', report);
      console.log('[REPORT EDITOR DEBUG] Photos from backend:', manualPhotos.length, manualPhotos.map(p => ({ id: p.id, urlLength: p.photo_url?.length, hasUrl: !!p.photo_url })));
      const processedPhotos = manualPhotos.map(p => ({
        id: p.id,
        url: p.photo_url || '',
        comment: p.comment || '',
        sequence: p.sequence || 0,
        orientation: null
      }));

      console.log('[REPORT EDITOR DEBUG] Processed photos:', processedPhotos.length);
      setPhotos(processedPhotos);
      console.log('[REPORT EDITOR DEBUG] Photos state set to:', processedPhotos.length);

      if (report.technician_id && !report.technician_signature) {
        await handleTechnicianSignature(report.technician_id);
      }

      // Verificar se há rascunho salvo
      const draft = loadDraft();
      if (draft && confirm('Há um rascunho não salvo deste relatório. Deseja restaurar?')) {
        setFormData(prev => ({ ...prev, ...draft.formData }));
        if (draft.photos) setPhotos(draft.photos);
        if (draft.activeTab) setActiveTab(draft.activeTab);
        toast.success('Rascunho restaurado com sucesso');
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
  const isBatteryMonitor = selectedEquipmentData?.type === 'Monitor de Bateria';
  const tabsOrder = isBatteryMonitor 
    ? ['equipment', 'installation', 'battery', 'attendance', 'photos', 'signatures']
    : ['equipment', 'installation', 'electrical', ...(hasBattery ? ['battery'] : []), 'attendance', 'photos', 'signatures'];

  // ==================== RASCUNHO (PRE-SALVE) ====================
  const saveDraft = () => {
    try {
      const draft = {
        formData,
        photos: photos.map(p => ({ ...p, file: null })), // Não salva arquivo blob no localStorage
        activeTab,
        timestamp: new Date().toISOString(),
        reportId: id
      };
      localStorage.setItem(`report_draft_${id}`, JSON.stringify(draft));
      console.log('💾 Rascunho salvo:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
    }
  };

  const loadDraft = () => {
    try {
      const draftJson = localStorage.getItem(`report_draft_${id}`);
      if (!draftJson) return null;
      return JSON.parse(draftJson);
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
      return null;
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(`report_draft_${id}`);
  };

  const handleNextTab = () => {
    saveDraft(); // Salva rascunho antes de avançar
    const idx = tabsOrder.indexOf(activeTab);
    if (idx < tabsOrder.length - 1) {
      setActiveTab(tabsOrder[idx + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevTab = () => {
    saveDraft(); // Salva rascunho antes de voltar
    const idx = tabsOrder.indexOf(activeTab);
    if (idx > 0) {
      setActiveTab(tabsOrder[idx - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTabChange = (newTab) => {
    saveDraft(); // Salva rascunho ao mudar de aba
    setActiveTab(newTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mobileTabsOrder = tabsOrder;
  const handleMobileNext = () => {
    const currentIndex = mobileTabsOrder.indexOf(activeAccordion);
    const nextIndex = currentIndex + 1;
    if (nextIndex < mobileTabsOrder.length) {
      setActiveAccordion(mobileTabsOrder[nextIndex]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleFinalSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      console.log('[REPORT EDITOR FRONTEND DEBUG] Fetching existing report:', id);
      const existingReportRes = await axios.get(`${API_BASE_URL}/reports/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const existingReport = existingReportRes.data.data;
      console.log('[REPORT EDITOR FRONTEND DEBUG] Existing report:', existingReport);
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

      console.log('[REPORT EDITOR FRONTEND DEBUG] Payload size:', JSON.stringify(payload).length);
      console.log('[REPORT EDITOR FRONTEND DEBUG] Sending PUT request to:', `${API_BASE_URL}/reports/${id}`);
      await axios.put(`${API_BASE_URL}/reports/${id}`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Salvar fotos na tabela report_photos
      for (const photo of photos) {
        if (photo.file && photo.id.startsWith('temp_')) {
          const formDataObj = new FormData();
          formDataObj.append('report_id', id);
          formDataObj.append('photo_url', photo.file);
          formDataObj.append('comment', photo.comment || '');
          if (photo.sequence) formDataObj.append('sequence', photo.sequence);
          if (photo.photo_type) formDataObj.append('photo_type', photo.photo_type);
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
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  const updateElectrical = (section, type, field, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      if (!updated.electrical_measurements[section]) updated.electrical_measurements[section] = { tensions: {}, currents: {} };
      
      if (!updated.electrical_measurements[section][type]) updated.electrical_measurements[section][type] = {};
      updated.electrical_measurements[section][type][field] = value;
      return updated;
    });
  };

  const updateBattery = (field, value) => {
    setFormData(prev => ({
      ...prev,
      battery_bank: { ...prev.battery_bank, [field]: value }
    }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        // Sem compressão para manter qualidade máxima original da foto
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        setPhotos(prev => [
          ...prev, 
          { 
            id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
            url: dataUrl, 
            file: file, 
            comment: '',
            sequence: prev.length + 1
          }
        ]);
      } catch (error) {
        toast.error('Erro ao processar imagem');
      }
    }
  };

  const updatePhoto = (photoId, field, value) => {
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
    updateField('client_signature', '');
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
        <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wide">{label}</span>
        <span className="font-medium text-sm">{value}</span>
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

  const tabConfig = [
    { value: 'equipment', label: 'EQUIPAMENTO', icon: <Settings2 className="w-4 h-4" /> },
    { value: 'installation', label: 'INSTALAÇÃO', icon: <Activity className="w-4 h-4" /> },
    ...(!isBatteryMonitor ? [{ value: 'electrical', label: 'ELÉTRICA', icon: <Zap className="w-4 h-4" /> }] : []),
    ...(hasBattery ? [{ value: 'battery', label: 'BATERIAS', icon: <Battery className="w-4 h-4" /> }] : []),
    { value: 'attendance', label: 'DESCRIÇÃO', icon: <FileText className="w-4 h-4" /> },
    { value: 'photos', label: 'FOTOS', icon: <ImageIcon className="w-4 h-4" /> },
    { value: 'signatures', label: 'ASSINATURAS', icon: <PenTool className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-background">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Editar Relatório {formData.service_order_number && `- OS: ${formData.service_order_number}`}
          </h2>
          {selectedEquipmentData && (
            <p className="text-muted-foreground font-medium mt-1 text-sm flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4" />
              {selectedEquipmentData.type} ({selectedEquipmentData.brand} - {selectedEquipmentData.serial_number})
            </p>
          )}
        </div>
      </div>

      {validationErrors.length > 0 && (
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

      {/* ── DESKTOP: Tabs ── */}
      {!isMobile && (
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto overflow-x-auto flex-nowrap shrink-0">
            {tabConfig.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} disabled={tab.value !== 'equipment' && !formData.equipment_id} className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-6 py-3 font-bold uppercase flex items-center">
                <span className="mr-2">{tab.icon}</span>{tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="p-6 md:p-8 flex-1">
            <TabsContent value="equipment" className="mt-0 space-y-6 h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                <div className="space-y-2">
                  <Label className="font-bold uppercase">Cliente <span className="text-destructive">*</span></Label>
                  <Popover open={clientOpen} onOpenChange={(o) => { setClientOpen(o); if (!o) setClientSearchTerm(''); }}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={clientOpen} className={cn("w-full justify-between font-normal text-left", !formData.client_id && validationErrors.length > 0 && "border-destructive")}>
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
                  <Label className="font-bold uppercase">Técnico Responsável <span className="text-destructive">*</span></Label>
                  <Select value={formData.technician_id} onValueChange={handleTechChange}>
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
                      <Button onClick={() => setEquipmentModalOpen(true)} className={cn(!formData.equipment_id && validationErrors.length > 0 && "ring-2 ring-destructive ring-offset-2")}>Selecionar Equipamento</Button>
                    </div>
                  ) : (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-lg font-semibold">Dados do Equipamento Selecionado</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setEquipmentModalOpen(true)}>Trocar Equipamento</Button>
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
                  <Label className="font-bold uppercase">Tipo de Serviço <span className="text-destructive">*</span></Label>
                  <Input 
                    value={formData.service_type} 
                    onChange={e => updateField('service_type', e.target.value.toUpperCase())} 
                    placeholder="Ex: Manutenção Preventiva, Instalação..."
                    className={cn(!formData.service_type && validationErrors.length > 0 && "border-destructive")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase">Local da Instalação <span className="text-destructive">*</span></Label>
                  <Select value={formData.installation_location} onValueChange={(v) => updateField('installation_location', v)}>
                    <SelectTrigger className={cn(!formData.installation_location && validationErrors.length > 0 && "border-destructive")}>
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
                    <Label className="font-bold uppercase">Motivo do Local Inadequado <span className="text-destructive">*</span></Label>
                    <Textarea 
                      value={formData.installation_location_explanation} 
                      onChange={(e) => updateField('installation_location_explanation', e.target.value)}
                      placeholder="Descreva o motivo..."
                      className={cn(!formData.installation_location_explanation && validationErrors.length > 0 && "border-destructive")}
                    />
                  </div>
                )}

                {!isBatteryMonitor && (
                <div className="space-y-2">
                  <Label className="font-bold uppercase">TIPO DE ALIMENTAÇÃO <span className="text-destructive">*</span></Label>
                  <Select value={formData.power_supply_type} onValueChange={(v) => updateField('power_supply_type', v)}>
                    <SelectTrigger className={cn(!formData.power_supply_type && validationErrors.length > 0 && "border-destructive")}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {POWER_SUPPLY_TYPES.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                )}

                {!isBatteryMonitor && (
                <>
                <div className="space-y-2">
                  <Label className="font-bold uppercase">DISJUNTOR</Label>
                  <Input value={formData.breaker} onChange={(e) => updateField('breaker', e.target.value)} placeholder="Ex: 20A" />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold uppercase">CABO ENTRADA FASE (MM²)</Label>
                  <Input type="number" value={formData.cable_entry_phase} onChange={(e) => updateField('cable_entry_phase', e.target.value)} placeholder="Ex: 2.5" />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold uppercase">CABO ENTRADA NEUTRO (MM²)</Label>
                  <Input type="number" value={formData.cable_entry_neutral} onChange={(e) => updateField('cable_entry_neutral', e.target.value)} placeholder="Ex: 2.5" />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold uppercase">CABO ENTRADA TERRA (MM²)</Label>
                  <Input type="number" value={formData.cable_entry_ground} onChange={(e) => updateField('cable_entry_ground', e.target.value)} placeholder="Ex: 2.5" />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold uppercase">CABO SAÍDA FASE (MM²)</Label>
                  <Input type="number" value={formData.cable_exit_phase} onChange={(e) => updateField('cable_exit_phase', e.target.value)} placeholder="Ex: 2.5" />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold uppercase">CABO SAÍDA NEUTRO (MM²)</Label>
                  <Input type="number" value={formData.cable_exit_neutral} onChange={(e) => updateField('cable_exit_neutral', e.target.value)} placeholder="Ex: 2.5" />
                </div>
                </>
                )}

                <div className="space-y-2">
                  <Label className="font-bold uppercase">Ambiente Refrigerado</Label>
                  <Select value={formData.cooled_environment} onValueChange={(v) => updateField('cooled_environment', v)}>
                    <SelectTrigger>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Medições de Entrada</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vType === 'TRIFÁSICA' || vType === 'TRIMONO' ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão R-S (V)</Label>
                            <Input type="number" value={getElecValue('entrada', 'tensions', 'rs')} onChange={(e) => updateElectrical('entrada', 'tensions', 'rs', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão S-T (V)</Label>
                            <Input type="number" value={getElecValue('entrada', 'tensions', 'st')} onChange={(e) => updateElectrical('entrada', 'tensions', 'st', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão R-T (V)</Label>
                            <Input type="number" value={getElecValue('entrada', 'tensions', 'rt')} onChange={(e) => updateElectrical('entrada', 'tensions', 'rt', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão R-N (V)</Label>
                            <Input type="number" value={getElecValue('entrada', 'tensions', 'rn')} onChange={(e) => updateElectrical('entrada', 'tensions', 'rn', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão S-N (V)</Label>
                            <Input type="number" value={getElecValue('entrada', 'tensions', 'sn')} onChange={(e) => updateElectrical('entrada', 'tensions', 'sn', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão T-N (V)</Label>
                            <Input type="number" value={getElecValue('entrada', 'tensions', 'tn')} onChange={(e) => updateElectrical('entrada', 'tensions', 'tn', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão N-T (V)</Label>
                            <Input type="number" value={getElecValue('entrada', 'tensions', 'nt')} onChange={(e) => updateElectrical('entrada', 'tensions', 'nt', e.target.value)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente R (A)</Label>
                            <Input type="number" value={getElecValue('entrada', 'currents', 'r')} onChange={(e) => updateElectrical('entrada', 'currents', 'r', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente S (A)</Label>
                            <Input type="number" value={getElecValue('entrada', 'currents', 's')} onChange={(e) => updateElectrical('entrada', 'currents', 's', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente T (A)</Label>
                            <Input type="number" value={getElecValue('entrada', 'currents', 't')} onChange={(e) => updateElectrical('entrada', 'currents', 't', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente Neutro (A)</Label>
                            <Input type="number" value={getElecValue('entrada', 'currents', 'neutral')} onChange={(e) => updateElectrical('entrada', 'currents', 'neutral', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente Terra (A)</Label>
                            <Input type="number" value={getElecValue('entrada', 'currents', 'ground')} onChange={(e) => updateElectrical('entrada', 'currents', 'ground', e.target.value)} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão F/N (V)</Label>
                            <Input type="number" value={getElecValue('entrada', 'tensions', 'single')} onChange={(e) => updateElectrical('entrada', 'tensions', 'single', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão N/T (V)</Label>
                            <Input type="number" value={getElecValue('entrada', 'tensions', 'nt')} onChange={(e) => updateElectrical('entrada', 'tensions', 'nt', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente Fase (A)</Label>
                            <Input type="number" value={getElecValue('entrada', 'currents', 'single')} onChange={(e) => updateElectrical('entrada', 'currents', 'single', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente Neutro (A)</Label>
                            <Input type="number" value={getElecValue('entrada', 'currents', 'neutral')} onChange={(e) => updateElectrical('entrada', 'currents', 'neutral', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente Terra (A)</Label>
                            <Input type="number" value={getElecValue('entrada', 'currents', 'ground')} onChange={(e) => updateElectrical('entrada', 'currents', 'ground', e.target.value)} />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Medições de Saída</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vType === 'TRIFÁSICA' || (vType === 'TRIMONO') ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão R-S (V)</Label>
                            <Input type="number" value={getElecValue('saida', 'tensions', 'rs')} onChange={(e) => updateElectrical('saida', 'tensions', 'rs', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão S-T (V)</Label>
                            <Input type="number" value={getElecValue('saida', 'tensions', 'st')} onChange={(e) => updateElectrical('saida', 'tensions', 'st', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão R-T (V)</Label>
                            <Input type="number" value={getElecValue('saida', 'tensions', 'rt')} onChange={(e) => updateElectrical('saida', 'tensions', 'rt', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão R-N (V)</Label>
                            <Input type="number" value={getElecValue('saida', 'tensions', 'rn')} onChange={(e) => updateElectrical('saida', 'tensions', 'rn', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão S-N (V)</Label>
                            <Input type="number" value={getElecValue('saida', 'tensions', 'sn')} onChange={(e) => updateElectrical('saida', 'tensions', 'sn', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão T-N (V)</Label>
                            <Input type="number" value={getElecValue('saida', 'tensions', 'tn')} onChange={(e) => updateElectrical('saida', 'tensions', 'tn', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão N-T (V)</Label>
                            <Input type="number" value={getElecValue('saida', 'tensions', 'nt')} onChange={(e) => updateElectrical('saida', 'tensions', 'nt', e.target.value)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente R (A)</Label>
                            <Input type="number" value={getElecValue('saida', 'currents', 'r')} onChange={(e) => updateElectrical('saida', 'currents', 'r', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente S (A)</Label>
                            <Input type="number" value={getElecValue('saida', 'currents', 's')} onChange={(e) => updateElectrical('saida', 'currents', 's', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente T (A)</Label>
                            <Input type="number" value={getElecValue('saida', 'currents', 't')} onChange={(e) => updateElectrical('saida', 'currents', 't', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente Neutro (A)</Label>
                            <Input type="number" value={getElecValue('saida', 'currents', 'neutral')} onChange={(e) => updateElectrical('saida', 'currents', 'neutral', e.target.value)} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão F/N (V)</Label>
                            <Input type="number" value={getElecValue('saida', 'tensions', 'single')} onChange={(e) => updateElectrical('saida', 'tensions', 'single', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tensão N/T (V)</Label>
                            <Input type="number" value={getElecValue('saida', 'tensions', 'nt')} onChange={(e) => updateElectrical('saida', 'tensions', 'nt', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente Fase (A)</Label>
                            <Input type="number" value={getElecValue('saida', 'currents', 'single')} onChange={(e) => updateElectrical('saida', 'currents', 'single', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Corrente Neutro (A)</Label>
                            <Input type="number" value={getElecValue('saida', 'currents', 'neutral')} onChange={(e) => updateElectrical('saida', 'currents', 'neutral', e.target.value)} />
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
                  {!isBatteryMonitor && (
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">Banco de Baterias</Label>
                    <Select value={formData.battery_bank.type} onValueChange={(v) => updateBattery('type', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BATTERY_TYPES.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  )}

                  <div className="space-y-2">
                    <Label className="font-bold uppercase">QUANTIDADE DE BATERIAS</Label>
                    <Input type="number" value={formData.battery_bank.quantity} onChange={(e) => updateBattery('quantity', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold uppercase">BATERIA VOLTS (VDC)</Label>
                    <Input type="number" value={formData.battery_bank.battery_volts} onChange={(e) => updateBattery('battery_volts', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold uppercase">CORRENTE BATERIA (AH/W)</Label>
                    <Input value={formData.battery_bank.battery_current} onChange={(e) => updateBattery('battery_current', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold uppercase">TENSÃO DO BANCO +/- (VDC)</Label>
                    <Input type="number" value={formData.battery_bank.voltage} onChange={(e) => updateBattery('voltage', e.target.value)} />
                  </div>

                  {!isBatteryMonitor && isSymmetric && (
                    <>
                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Tensão do Banco +/N (VDC)</Label>
                        <Input type="number" value={formData.battery_bank.voltage_positive_neutral} onChange={(e) => updateBattery('voltage_positive_neutral', e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Tensão do Banco N/- (VDC)</Label>
                        <Input type="number" value={formData.battery_bank.voltage_neutral_negative} onChange={(e) => updateBattery('voltage_neutral_negative', e.target.value)} />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label className="font-bold uppercase">TENSÃO CARREGADOR (VDC)</Label>
                    <Input type="number" value={formData.battery_bank.charger_voltage} onChange={(e) => updateBattery('charger_voltage', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold uppercase">MARCA</Label>
                    <Input value={formData.battery_bank.brand} onChange={(e) => updateBattery('brand', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold uppercase">MODELO</Label>
                    <Input value={formData.battery_bank.model} onChange={(e) => updateBattery('model', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold uppercase">TROCOU BATERIAS?</Label>
                    <Select value={formData.battery_bank.trocou_baterias} onValueChange={(v) => updateBattery('trocou_baterias', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">SIM</SelectItem>
                        <SelectItem value="NÃO">NÃO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {!isBatteryMonitor && formData.battery_bank.trocou_baterias === 'SIM' && (
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Data da Última Troca</Label>
                      <Input type="date" value={formData.battery_bank.last_change} onChange={(e) => updateBattery('last_change', e.target.value)} />
                    </div>
                  )}

                  {!isBatteryMonitor && formData.battery_bank.trocou_baterias === 'NÃO' && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-bold uppercase">Motivo de Não Trocar</Label>
                      <Textarea value={formData.battery_bank.motivo_nao_troca} onChange={(e) => updateBattery('motivo_nao_troca', e.target.value)} />
                    </div>
                  )}

                  {!isBatteryMonitor && formData.battery_bank.type === 'Externo' && (
                    <>
                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Cabo Positivo Bat. Ext. (mm²)</Label>
                        <Input type="number" value={formData.external_battery_positive_cable} onChange={(e) => updateField('external_battery_positive_cable', e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Cabo Negativo Bat. Ext. (mm²)</Label>
                        <Input type="number" value={formData.external_battery_negative_cable} onChange={(e) => updateField('external_battery_negative_cable', e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Cabo Neutro Bat. Ext. (mm²)</Label>
                        <Input type="number" value={formData.external_battery_neutral_cable} onChange={(e) => updateField('external_battery_neutral_cable', e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold uppercase">Conexão Bateria</Label>
                        <Select value={formData.external_battery_connection} onValueChange={(v) => updateField('external_battery_connection', v)}>
                          <SelectTrigger>
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
                        <Label className="font-bold uppercase">Conexão Nobreak</Label>
                        <Select value={formData.external_battery_nobreak_connection} onValueChange={(v) => updateField('external_battery_nobreak_connection', v)}>
                          <SelectTrigger>
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
                  <Label className="font-bold uppercase">PROBLEMAS REPORTADOS</Label>
                  <Textarea 
                    value={formData.reported_problems || ''} 
                    onChange={(e) => updateField('reported_problems', e.target.value.toUpperCase())}
                    placeholder="Descreva os problemas reportados..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">INSPEÇÃO EXTERNA</Label>
                    <Textarea 
                      value={formData.external_inspection} 
                      onChange={(e) => updateField('external_inspection', e.target.value.toUpperCase())}
                      placeholder="Descreva a inspeção externa..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold uppercase">INSPEÇÃO INTERNA</Label>
                    <Textarea 
                      value={formData.internal_inspection} 
                      onChange={(e) => updateField('internal_inspection', e.target.value.toUpperCase())}
                      placeholder="Descreva a inspeção interna..."
                      rows={4}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase">REALIZADO NO ATENDIMENTO</Label>
                  <Textarea 
                    value={formData.attendance_description} 
                    onChange={(e) => updateField('attendance_description', e.target.value.toUpperCase())}
                    placeholder="Descreva as atividades realizadas..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold uppercase">DIAGNÓSTICO / NECESSÁRIO</Label>
                  <Textarea 
                    value={formData.diagnosis} 
                    onChange={(e) => updateField('diagnosis', e.target.value.toUpperCase())}
                    placeholder="Descreva o diagnóstico técnico..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold uppercase">CONCLUSÃO / RESULTADO</Label>
                  <Textarea 
                    value={formData.conclusion} 
                    onChange={(e) => updateField('conclusion', e.target.value.toUpperCase())}
                    placeholder="Conclusão do atendimento..."
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="photos" className="mt-0 space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Fotos do Atendimento</h3>
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md inline-flex items-center text-sm font-medium transition-colors">
                      <Upload className="mr-2 h-4 w-4" />
                      Adicionar Fotos
                    </div>
                  </Label>
                  <Input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handlePhotoUpload} 
                  />
                </div>

                {photos.length === 0 ? (
                  <div className="border-2 border-dashed rounded-xl p-12 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-2">Nenhuma foto adicionada</p>
                    <p className="text-sm text-muted-foreground">Clique em "Adicionar Fotos" para fazer upload</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {photos.map((photo) => (
                      <Card key={photo.id} className="overflow-hidden">
                        <div className="relative aspect-video bg-muted">
                          <img 
                            src={photo.url} 
                            alt="Foto" 
                            width="640"
                            height="360"
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                            onClick={() => setZoomPhoto(photo.url)}
                          />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => removePhoto(photo.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="absolute top-2 left-2 h-8 w-8"
                            onClick={() => setZoomPhoto(photo.url)}
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Comentário</Label>
                            <Textarea 
                              value={photo.comment} 
                              onChange={(e) => updatePhoto(photo.id, 'comment', e.target.value)}
                              placeholder="Adicione um comentário..."
                              rows={2}
                              className="text-sm"
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Assinatura do Técnico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isGerente ? (
                      formData.technician_signature ? (
                        <div className="border rounded-lg p-4 bg-muted/30 flex justify-center">
                          <img src={formData.technician_signature} alt="Assinatura Técnico" width="200" height="128" className="max-w-full max-h-32 object-contain" />
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <p className="text-sm text-muted-foreground">Assinatura não capturada</p>
                        </div>
                      )
                    ) : (
                      formData.technician_signature ? (
                        <div className="space-y-2">
                          <div className="border bg-white rounded-xl p-4 flex justify-center">
                            <img src={formData.technician_signature} alt="Assinatura do Técnico" width="200" height="128" className="max-w-full max-h-32 object-contain" />
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={redrawTechSignature} className="w-full">
                            Redesenhar Assinatura
                          </Button>
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
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={clearTechSignature} className="flex-1">
                              Limpar
                            </Button>
                            <Button type="button" size="sm" onClick={handleConfirmTechSignature} className="flex-1">
                              Confirmar Assinatura
                            </Button>
                          </div>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Responsável no Local <span className="text-destructive">*</span></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Nome do Responsável</Label>
                      <Input 
                        value={formData.responsible_person} 
                        onChange={(e) => updateField('responsible_person', e.target.value)}
                        placeholder="Nome completo"
                        className={cn(!formData.responsible_person && validationErrors.length > 0 && "border-destructive")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold uppercase">Assinatura do Cliente</Label>
                      {formData.client_signature ? (
                        <div className="space-y-2">
                          <ClientSignatureDisplay signature={formData.client_signature} />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={clearClientSignature}
                            className="w-full"
                          >
                            Redesenhar Assinatura
                          </Button>
                        </div>
                      ) : (
                        <>
                          <SignaturePadNative 
                            onSave={(dataUrl) => updateField('client_signature', dataUrl)}
                            onClear={() => updateField('client_signature', '')}
                            width={400}
                            height={128}
                          />
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
              <Button variant="outline" onClick={() => navigate('/reports')} className="w-full sm:w-auto">Cancelar</Button>
              {tabsOrder.indexOf(activeTab) > 0 && (
                <Button variant="secondary" onClick={handlePrevTab} className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
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
                  onClick={handleFinalSave} 
                  disabled={saving || !formData.equipment_id}
                  className="w-full sm:w-auto min-w-[160px]"
                >
                  {saving ? <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Alterações
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </div>
      )}

      {/* ── MOBILE: Cards expansíveis ── */}
      {isMobile && (
        <div className="space-y-2">
          {tabConfig.map((tab) => {
            const isActive = activeAccordion === tab.value;
            const isDisabled = tab.value !== 'equipment' && !formData.equipment_id;
            return (
              <div key={tab.value} className={cn('bg-card rounded-xl border shadow-sm overflow-hidden', isActive && 'ring-2 ring-primary')}>
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setActiveAccordion(isActive ? '' : tab.value)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between font-bold uppercase text-sm hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">{tab.icon}{tab.label}</span>
                  {isActive ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>

                {isActive && (
                  <div className="px-4 pb-4 pt-2 border-t space-y-4">

                    {tab.value === 'equipment' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="font-bold uppercase">Cliente <span className="text-destructive">*</span></Label>
                          <Popover open={clientOpen} onOpenChange={(o) => { setClientOpen(o); if (!o) setClientSearchTerm(''); }}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" className={cn("w-full justify-between font-normal text-left", !formData.client_id && validationErrors.length > 0 && "border-destructive")}>
                                <span className="truncate">{formData.client_id ? clients.find(c => c.id === formData.client_id)?.name : "Selecione o cliente..."}</span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command shouldFilter={false}>
                                <CommandInput placeholder="Buscar cliente..." value={clientSearchTerm} onValueChange={setClientSearchTerm} />
                                <CommandList>
                                  {filteredClients.length === 0 ? <div className="p-4 text-center text-sm text-muted-foreground">Nenhum cliente.</div> : (
                                    <CommandGroup>
                                      {filteredClients.map(c => (
                                        <CommandItem key={c.id} value={c.id} onSelect={() => { handleClientChange(c.id); setClientOpen(false); }}>
                                          <Check className={cn("mr-2 h-4 w-4", formData.client_id === c.id ? "opacity-100" : "opacity-0")} />
                                          <div className="flex flex-col"><span>{c.name}</span><span className="text-xs text-muted-foreground">{c.cnpj_cpf}</span></div>
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
                          <Select value={formData.technician_id} onValueChange={handleTechChange}>
                            <SelectTrigger className={cn(!formData.technician_id && validationErrors.length > 0 && "border-destructive")}><SelectValue placeholder="Selecione o técnico..." /></SelectTrigger>
                            <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        {formData.client_id && (
                          !selectedEquipmentData ? (
                            <div className="p-4 border rounded-xl bg-muted/30 flex flex-col items-center gap-3 text-center">
                              <MonitorSmartphone className="h-8 w-8 text-muted-foreground opacity-50" />
                              <p className="text-sm text-muted-foreground">Nenhum equipamento selecionado</p>
                              <Button onClick={() => setEquipmentModalOpen(true)} size="sm">Selecionar Equipamento</Button>
                            </div>
                          ) : (
                            <div className="border rounded-xl p-3 bg-muted/20 space-y-2">
                              <div className="flex justify-between items-center">
                                <p className="font-semibold text-sm">{selectedEquipmentData.type} — {selectedEquipmentData.brand}</p>
                                <Button variant="outline" size="sm" onClick={() => setEquipmentModalOpen(true)}>Trocar</Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {renderEquipmentField('Modelo', selectedEquipmentData.model)}
                                {renderEquipmentField('Série', selectedEquipmentData.serial_number)}
                                {renderEquipmentField('Tensão', selectedEquipmentData.voltage_type)}
                                {renderEquipmentField('Potência', selectedEquipmentData.power_va)}
                              </div>
                            </div>
                          )
                        )}
                        <Button onClick={handleMobileNext} className="w-full" disabled={!formData.equipment_id}>Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                      </div>
                    )}

                    {tab.value === 'installation' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="font-bold uppercase">Tipo de Serviço <span className="text-destructive">*</span></Label>
                          <Input value={formData.service_type} onChange={e => updateField('service_type', e.target.value.toUpperCase())} placeholder="Ex: Manutenção Preventiva..." className={cn(!formData.service_type && validationErrors.length > 0 && "border-destructive")} />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold uppercase">Local da Instalação <span className="text-destructive">*</span></Label>
                          <Select value={formData.installation_location} onValueChange={(v) => updateField('installation_location', v)}>
                            <SelectTrigger className={cn(!formData.installation_location && validationErrors.length > 0 && "border-destructive")}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>{INSTALLATION_LOCATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        {formData.installation_location === 'INADEQUADO' && (
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Motivo do Local Inadequado <span className="text-destructive">*</span></Label>
                            <Textarea value={formData.installation_location_explanation} onChange={(e) => updateField('installation_location_explanation', e.target.value)} rows={3} />
                          </div>
                        )}
                        {!isBatteryMonitor && (
                          <div className="space-y-2">
                            <Label className="font-bold uppercase">Tipo de Alimentação <span className="text-destructive">*</span></Label>
                            <Select value={formData.power_supply_type} onValueChange={(v) => updateField('power_supply_type', v)}>
                              <SelectTrigger className={cn(!formData.power_supply_type && validationErrors.length > 0 && "border-destructive")}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>{POWER_SUPPLY_TYPES.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        )}
                        {!isBatteryMonitor && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label className="font-bold uppercase text-xs">Disjuntor</Label><Input value={formData.breaker} onChange={(e) => updateField('breaker', e.target.value)} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase text-xs">Cabo Ent. Fase (mm²)</Label><Input type="number" value={formData.cable_entry_phase} onChange={(e) => updateField('cable_entry_phase', e.target.value)} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase text-xs">Cabo Ent. Neutro (mm²)</Label><Input type="number" value={formData.cable_entry_neutral} onChange={(e) => updateField('cable_entry_neutral', e.target.value)} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase text-xs">Cabo Ent. Terra (mm²)</Label><Input type="number" value={formData.cable_entry_ground} onChange={(e) => updateField('cable_entry_ground', e.target.value)} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase text-xs">Cabo Saída Fase (mm²)</Label><Input type="number" value={formData.cable_exit_phase} onChange={(e) => updateField('cable_exit_phase', e.target.value)} /></div>
                            <div className="space-y-2"><Label className="font-bold uppercase text-xs">Cabo Saída Neutro (mm²)</Label><Input type="number" value={formData.cable_exit_neutral} onChange={(e) => updateField('cable_exit_neutral', e.target.value)} /></div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label className="font-bold uppercase">Ambiente Refrigerado</Label>
                          <Select value={formData.cooled_environment} onValueChange={(v) => updateField('cooled_environment', v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>{COOLED_ENV_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleMobileNext} className="w-full">Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                      </div>
                    )}

                    {tab.value === 'electrical' && (
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Medições de Entrada</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Tensão F/N (V)</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'single')} onChange={(e) => updateElectrical('entrada', 'tensions', 'single', e.target.value)} /></div>
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Tensão N/T (V)</Label><Input type="number" value={getElecValue('entrada', 'tensions', 'nt')} onChange={(e) => updateElectrical('entrada', 'tensions', 'nt', e.target.value)} /></div>
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Corrente Fase (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'single')} onChange={(e) => updateElectrical('entrada', 'currents', 'single', e.target.value)} /></div>
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Corrente Neutro (A)</Label><Input type="number" value={getElecValue('entrada', 'currents', 'neutral')} onChange={(e) => updateElectrical('entrada', 'currents', 'neutral', e.target.value)} /></div>
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase pt-2">Medições de Saída</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Tensão F/N (V)</Label><Input type="number" value={getElecValue('saida', 'tensions', 'single')} onChange={(e) => updateElectrical('saida', 'tensions', 'single', e.target.value)} /></div>
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Tensão N/T (V)</Label><Input type="number" value={getElecValue('saida', 'tensions', 'nt')} onChange={(e) => updateElectrical('saida', 'tensions', 'nt', e.target.value)} /></div>
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Corrente Fase (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 'single')} onChange={(e) => updateElectrical('saida', 'currents', 'single', e.target.value)} /></div>
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Corrente Neutro (A)</Label><Input type="number" value={getElecValue('saida', 'currents', 'neutral')} onChange={(e) => updateElectrical('saida', 'currents', 'neutral', e.target.value)} /></div>
                        </div>
                        <Button onClick={handleMobileNext} className="w-full">Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                      </div>
                    )}

                    {tab.value === 'battery' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Qtd. Baterias</Label><Input type="number" value={formData.battery_bank.quantity} onChange={(e) => updateBattery('quantity', e.target.value)} /></div>
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Bateria Volts (VDC)</Label><Input type="number" value={formData.battery_bank.battery_volts} onChange={(e) => updateBattery('battery_volts', e.target.value)} /></div>
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Corrente (Ah/W)</Label><Input value={formData.battery_bank.battery_current} onChange={(e) => updateBattery('battery_current', e.target.value)} /></div>
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Tensão Banco (VDC)</Label><Input type="number" value={formData.battery_bank.voltage} onChange={(e) => updateBattery('voltage', e.target.value)} /></div>
                          <div className="space-y-1"><Label className="font-bold uppercase text-xs">Tensão Carregador</Label><Input type="number" value={formData.battery_bank.charger_voltage} onChange={(e) => updateBattery('charger_voltage', e.target.value)} /></div>
                          <div className="space-y-1 col-span-2">
                            <Label className="font-bold uppercase text-xs">Trocou Baterias?</Label>
                            <Select value={formData.battery_bank.trocou_baterias} onValueChange={(v) => updateBattery('trocou_baterias', v)}>
                              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent><SelectItem value="SIM">SIM</SelectItem><SelectItem value="NÃO">NÃO</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button onClick={handleMobileNext} className="w-full">Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                      </div>
                    )}

                    {tab.value === 'attendance' && (
                      <div className="space-y-4">
                        <div className="space-y-2"><Label className="font-bold uppercase">Problemas Reportados</Label><Textarea rows={3} value={formData.reported_problems || ''} onChange={e => updateField('reported_problems', e.target.value.toUpperCase())} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Inspeção Externa</Label><Textarea rows={3} value={formData.external_inspection || ''} onChange={e => updateField('external_inspection', e.target.value.toUpperCase())} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Inspeção Interna</Label><Textarea rows={3} value={formData.internal_inspection || ''} onChange={e => updateField('internal_inspection', e.target.value.toUpperCase())} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Realizado no Atendimento</Label><Textarea rows={3} value={formData.attendance_description} onChange={e => updateField('attendance_description', e.target.value.toUpperCase())} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Diagnóstico</Label><Textarea rows={3} value={formData.diagnosis} onChange={e => updateField('diagnosis', e.target.value.toUpperCase())} /></div>
                        <div className="space-y-2"><Label className="font-bold uppercase">Conclusão</Label><Textarea rows={3} value={formData.conclusion} onChange={e => updateField('conclusion', e.target.value.toUpperCase())} /></div>
                        <Button onClick={handleMobileNext} className="w-full">Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                      </div>
                    )}

                    {tab.value === 'photos' && (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed rounded-xl p-4 text-center bg-muted/20">
                          <Upload className="mx-auto h-6 w-6 text-muted-foreground/50 mb-2" />
                          <Label htmlFor="photo-upload-mobile" className="cursor-pointer">
                            <span className="text-primary font-semibold text-sm">Clique para adicionar fotos</span>
                          </Label>
                          <Input id="photo-upload-mobile" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                        </div>
                        {photos.length > 0 && (
                          <div className="grid grid-cols-2 gap-3">
                            {photos.map((photo) => (
                              <div key={photo.id} className="relative border rounded-xl overflow-hidden bg-card shadow-sm flex flex-col">
                                <div className="aspect-video relative bg-muted">
                                  <img src={photo.url} alt="Foto" width="640" height="360" className="w-full h-full object-cover cursor-pointer" onClick={() => setZoomPhoto(photo.url)} />
                                  <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removePhoto(photo.id)}><X className="h-3 w-3" /></Button>
                                </div>
                                <div className="p-2"><Textarea placeholder="Comentário..." className="text-xs resize-none min-h-[40px]" value={photo.comment} onChange={e => updatePhoto(photo.id, 'comment', e.target.value)} /></div>
                              </div>
                            ))}
                          </div>
                        )}
                        <Button onClick={handleMobileNext} className="w-full">Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                      </div>
                    )}

                    {tab.value === 'signatures' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="font-bold uppercase">Nome do Técnico</Label>
                          <Input value={selectedTech?.name || ''} readOnly className="bg-muted text-muted-foreground" />
                        </div>
                        {formData.technician_signature ? (
                          <div className="border bg-white rounded-xl p-3 flex justify-center">
                            <img src={formData.technician_signature} alt="Assinatura Técnico" width="200" height="96" className="max-w-full max-h-24 object-contain" />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="border rounded-lg overflow-hidden bg-white ring-1 ring-border">
                              <SignatureCanvas ref={techSigPad} penColor="#3B82F6" backgroundColor="white" canvasProps={{ className: 'w-full touch-none', style: { minHeight: '150px', maxWidth: '100%', margin: '0 auto', display: 'block' } }} />
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={clearTechSignature} className="flex-1">Limpar</Button>
                              <Button size="sm" onClick={handleConfirmTechSignature} className="flex-1">Confirmar</Button>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2 pt-4 border-t">
                          <Label className="font-bold uppercase">Nome do Cliente <span className="text-destructive">*</span></Label>
                          <Input value={formData.responsible_person} onChange={e => updateField('responsible_person', e.target.value.toUpperCase())} className={cn(!formData.responsible_person && validationErrors.length > 0 && "border-destructive")} />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold uppercase">Assinatura Cliente <span className="text-destructive">*</span></Label>
                          {formData.client_signature ? (
                            <div className="space-y-2">
                              <ClientSignatureDisplay signature={formData.client_signature} />
                              <Button variant="outline" size="sm" onClick={clearClientSignature} className="w-full">Redesenhar</Button>
                            </div>
                          ) : (
                            <SignaturePadNative onSave={(dataUrl) => updateField('client_signature', dataUrl)} onClear={() => updateField('client_signature', '')} width={400} height={128} />
                          )}
                        </div>
                        <Button onClick={handleFinalSave} disabled={saving || !formData.equipment_id} className="w-full">
                          {saving ? <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                          Salvar Alterações
                        </Button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
          <div className="bg-muted/50 border rounded-xl p-4 mt-2">
            <Button variant="outline" onClick={() => navigate('/reports')} className="w-full">Cancelar / Voltar</Button>
          </div>
        </div>
      )}

      <Dialog open={!!zoomPhoto} onOpenChange={() => setZoomPhoto(null)}>
        <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none">
          {zoomPhoto && <img src={zoomPhoto} alt="Zoomed" width="1920" height="1080" className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl" />}
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

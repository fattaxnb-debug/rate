
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '../components/ui/button';
import { FileDown, ArrowLeft, Pencil, Trash2, Printer, Image as ImageIcon, Palette } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';
import { format } from 'date-fns';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { Skeleton } from '../components/ui/skeleton';
import { generateReportPDF } from '../utils/generateReportPDF.js';
import { API_BASE_URL } from '../config/api.js';

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

export default function ReportViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isGerente = currentUser?.role === 'Gerente' || currentUser?.role === 'Admin';
  const isTech = currentUser?.role === 'Técnico';

  const [report, setReport] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState(null);
  const [colorMode, setColorMode] = useState('color');
  
  const coverRef = useRef(null);
  const clientEquipRef = useRef(null);
  const infraElecBatRef = useRef(null);
  const descRef = useRef(null);
  const photosAndSignaturesRef = useRef(null);
  const photosRef = useRef(null);
  const signaturesRef = useRef(null);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    let retries = 0;
    while (retries < 3) {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/reports/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const record = response.data.data;

        // Usar fotos que já vêm do backend
        const manualPhotos = record.photos || [];

        console.log('[REPORT VIEWER DEBUG] Processing photos:', manualPhotos.length);
        const processedPhotos = await Promise.all(manualPhotos.map(async p => {
          let url = p.photo_url || '';
          
          // 🔥 CORREÇÃO: Adicionar URL base do backend se não for base64 ou URL completa
          if (url && !url.startsWith('http') && !url.startsWith('data:')) {
            url = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
          }
          
          console.log('[PHOTO DEBUG] Photo ID:', p.id, 'Final URL:', url.substring(0, 100) + '...');
          const orientation = await getImageOrientation(url).catch(() => 'landscape');
          return {
            id: p.id,
            url,
            comment: p.comment,
            photo_type: p.photo_type,
            orientation
          };
        }));

        record.fetched_photos = processedPhotos;

        // Buscar dados do equipamento
        if (record.equipment_id) {
          try {
            const equipmentResponse = await axios.get(`${API_BASE_URL}/equipments/${record.equipment_id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            record.expand = {
              equipment_id: equipmentResponse.data.data
            };
          } catch (e) {
            console.error('Error fetching equipment:', e);
            record.expand = { equipment_id: {} };
          }
        } else {
          record.expand = { equipment_id: {} };
        }

        setReport(record);

        if (record.technician_id) {
          try {
            const settingsResponse = await axios.get(`${API_BASE_URL}/settings/user/${record.technician_id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            setCompanySettings(settingsResponse.data.data);
          } catch (e) {
            try {
              const mySettingsResponse = await axios.get(`${API_BASE_URL}/settings/user/${currentUser.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              setCompanySettings(mySettingsResponse.data.data);
            } catch (err) {}
          }
        }

        setLoading(false);
        return;
      } catch (error) {
        retries++;
        if (error.response?.status === 404) {
          toast.error('Relatório não encontrado');
          setLoading(false);
          navigate('/reports');
          return;
        }
        if (retries >= 3) {
          toast.error('Erro ao carregar relatório. Tente novamente.');
          setLoading(false);
          navigate('/reports');
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const handleEditClick = async () => {
    navigate(`/reports/${id}/edit`);
  };

  const deleteReport = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_BASE_URL}/reports/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Relatório excluído com sucesso');
      setDeleteDialogOpen(false);
      navigate('/reports');
    } catch (error) {
      toast.error('Erro ao excluir relatório');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = async () => {
    setGeneratingPdf(true);
    toast.info('Gerando PDF, aguarde...');
    try {
      await generateReportPDF(report, companySettings, {
        coverRef,
        clientEquipRef,
        infraElecBatRef,
        descRef,
        photosAndSignaturesRef,
        photosRef,
        signaturesRef
      });
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleFinalize = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`${API_BASE_URL}/reports/${id}/finalize`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Relatório finalizado com sucesso!');
      fetchReport();
    } catch (error) {
      toast.error('Erro ao finalizar relatório');
    }
  };

  const valOrDash = val => {
    if (val === null || val === undefined || val === '') return '-';
    if (typeof val === 'number' && val === 0) return '-';
    if (typeof val === 'string' && val.trim() === '') return '-';
    return val;
  };

  const hasValue = val => {
    if (val === null || val === undefined || val === '') return false;
    if (typeof val === 'number' && val === 0) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    return true;
  };

  const renderField = (label, value, unit = '') => {
    // Só renderiza se houver valor
    if (value === null || value === undefined || value === '' || value === false) return null;
    if (typeof value === 'number' && (isNaN(value) || value === 0)) return null;
    
    const displayValue = unit ? `${value}${unit}` : value;
    const labelColor = colorMode === 'color' ? '#E31E24' : '#000000';
    return (
      <div className="field-group">
        <span className="block text-[10px] font-bold uppercase tracking-wide" style={{
          color: labelColor
        }}>{label}</span>
        <span className="font-semibold text-sm text-black">{displayValue}</span>
      </div>
    );
  };

  const renderElecBlock = (section, label) => {
    // Usar tipo de tensão do equipamento
    const eqData = report.expand?.equipment_id || {};
    const voltageType = eqData.voltage_type || report.equipment_voltage_type || '';
    const isMono = voltageType === 'MONOFÁSICA';
    const isTri = voltageType === 'TRIFÁSICA';
    const isTriMono = voltageType === 'TRIMONO';
    const labelColor = colorMode === 'color' ? '#E31E24' : '#000000';

    // Acessar dados do JSON electrical_measurements
    const elecData = report.electrical_measurements || {};
    const sectionData = elecData[section] || { tensions: {}, currents: {} };
    const tensions = sectionData.tensions || {};
    const currents = sectionData.currents || {};

    // Mostrar campos baseados no tipo de tensão
    const showMonoFields = (isMono || (section === 'saida' && isTriMono));
    const showTriFields = (isTri || isTriMono);

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm report-section">
        <h3 className="font-bold uppercase border-b border-gray-300 pb-2 mb-3 text-sm" style={{ color: labelColor }}>{label}</h3>
        
        {showMonoFields && (
          <div className="space-y-2 text-sm">
            {renderField('Tensão F/N (V)', tensions.single)}
            {renderField('Tensão N/T (V)', tensions.nt)}
            {renderField('Corrente Fase (A)', currents.single)}
            {renderField('Corrente Neutro (A)', currents.neutral)}
            {section === 'entrada' && renderField('Corrente Terra (A)', currents.ground)}
          </div>
        )}

        {showTriFields && (
          <div className="space-y-3 text-sm">
            <div className="field-group">
              <span className="font-bold block mb-2" style={{ color: labelColor }}>Tensões (V):</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {renderField('R-S', tensions.rs)}
                {renderField('S-T', tensions.st)}
                {renderField('R-T', tensions.rt)}
                {renderField('R-N', tensions.rn)}
                {renderField('S-N', tensions.sn)}
                {renderField('T-N', tensions.tn)}
                {renderField('N-T', tensions.nt)}
              </div>
            </div>
            <div className="field-group">
              <span className="font-bold block mb-2" style={{ color: labelColor }}>Correntes (A):</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {renderField('R', currents.r)}
                {renderField('S', currents.s)}
                {renderField('T', currents.t)}
                {renderField('N', currents.neutral)}
                {section === 'entrada' && renderField('Terra', currents.ground)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const pageTitle = report?.service_order_number ? `OS: ${report.service_order_number}` : 'Relatório';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pb-20 md:pb-8">
          <Skeleton className="h-12 w-full max-w-4xl mx-auto mb-8" />
          <div className="space-y-6 max-w-4xl mx-auto">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!report) return null;

  const client = {
    name: report.client_name,
    fantasy_name: report.client_fantasy_name,
    cnpj_cpf: report.client_cnpj,
    rg: report.client_rg,
    ie: report.client_ie,
    address: report.client_address,
    number: report.client_number,
    complement: report.client_complement,
    neighborhood: report.client_neighborhood,
    city: report.client_city,
    state: report.client_state,
    zip_code: report.client_zip_code,
    phone: report.client_phone,
    mobile: report.client_mobile,
    email: report.client_email,
    technical_contact: report.client_technical_contact
  };
  const technician = { name: report.technician_name, email: report.technician_email };
  const eqData = report.expand?.equipment_id || {};
  const bat = report.battery_bank || {};
  const photos = report.fetched_photos || [];
  const isSymmetric = eqData.symmetric === 'Sim';
  const isNobreak = eqData.type === 'Nobreak';
  const isBatteryMonitor = eqData.type === 'Monitor de Bateria';
  const hasBattery = eqData.type === 'Nobreak' || eqData.type === 'Monitor de Bateria';
  const trocouBaterias = bat.trocou_baterias;
  const sectionTitleColor = colorMode === 'color' ? '#000000' : '#000000';
  const sectionBgColor = colorMode === 'color' ? '#FFD700' : '#f5f5f5';
  
  // Can Edit Logic: Only creator can edit OR manager, but not when status is submitted
  const canEdit = isGerente && report.status !== 'submitted' || (isTech && report.technician_id === currentUser.id && report.status !== 'submitted');

  return (
    <>
      <Helmet>
        <title>{pageTitle} - FATTAX</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-muted/30 print:bg-white">
        <div className="print:hidden">
          <Header />
        </div>

        <main className="flex-1 container mx-auto px-4 py-8 print:py-0 print:px-0">
          <div className="max-w-[1024px] mx-auto mb-6 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center print:hidden">
            <Button variant="outline" onClick={() => navigate('/reports')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Select value={colorMode} onValueChange={setColorMode}>
                  <SelectTrigger className="h-8 w-[140px] border-0 shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Colorido</SelectItem>
                    <SelectItem value="bw">Preto e Branco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isGerente && (
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              )}
              {canEdit && (
                <Button variant="outline" onClick={handleEditClick}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              )}
              {report.status !== 'finalizado' && (isGerente || isTech) && (
                <Button variant="default" onClick={handleFinalize} className="bg-green-500 hover:bg-green-600">
                  Finalizar
                </Button>
              )}
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleGeneratePDF} disabled={generatingPdf}>
                <FileDown className="mr-2 h-4 w-4" />
                {generatingPdf ? 'Gerando...' : 'Baixar PDF'}
              </Button>
            </div>
          </div>

          {/* Hidden PDF Generation Areas */}
          <div className="absolute left-[-9999px] top-[-9999px] print:hidden">
            {/* PAGE 1: Cover */}
            <div ref={coverRef} className="w-[210mm] h-[297mm] bg-white flex flex-col items-center justify-center p-12 text-center">
              <div className="h-[60px] mb-4"></div>
              {companySettings?.company_logo && <img src={companySettings.company_logo} crossOrigin="anonymous" alt="Logo" className="h-96 object-contain mb-8" />}
              <h2 className="text-3xl font-semibold mb-8 uppercase" style={{
                color: '#000000'
              }}>RELATÓRIO TÉCNICO</h2>
              <div className="text-xl space-y-2" style={{
                color: '#000000'
              }}>
                <p>Cliente: <span className="font-bold">{valOrDash(client.name)}</span></p>
                <p>Data: <span className="font-bold">{report.attendance_date_time ? format(new Date(report.attendance_date_time), 'dd/MM/yyyy') : report.created ? format(new Date(report.created), 'dd/MM/yyyy') : '-'}</span></p>
                <p>O.S.: <span className="font-bold">{valOrDash(report.service_order_number)}</span></p>
                <p>Técnico Responsável: <span className="font-bold">{valOrDash(technician.name)}</span></p>
              </div>
            </div>

            {/* PAGE 2: Client + Equipment */}
            <div ref={clientEquipRef} className="w-[210mm] min-h-[297mm] bg-white p-12 text-black">
              <div className="flex justify-between items-start pb-6 mb-8" style={{ borderBottom: `2px solid ${colorMode === 'color' ? '#E31E24' : '#000000'}` }}>
                <div className="flex items-center gap-4">
                  {companySettings?.company_logo && <img src={companySettings.company_logo} crossOrigin="anonymous" alt="Logo" className="h-16 object-contain" />}
                  <div>
                    <h1 className="text-2xl font-bold tracking-tighter uppercase" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>{companySettings?.company_name || 'RELATÓRIO TÉCNICO'}</h1>
                    <p className="text-sm mt-1 uppercase font-medium">{report.service_type || 'Manutenção de Equipamentos'}</p>
                  </div>
                </div>
                <div className="text-right text-sm space-y-1">
                  <p className="uppercase text-xs font-semibold tracking-wider text-gray-500">Documento Oficial</p>
                  <p>O.S. Nº: <span className="font-bold">{valOrDash(report.service_order_number)}</span></p>
                  <p>Data: <span className="font-bold">{report.created_date ? format(new Date(report.created_date), 'dd/MM/yyyy') : report.attendance_date_time ? format(new Date(report.attendance_date_time), 'dd/MM/yyyy') : '-'}</span></p>
                </div>
              </div>
              <div className="space-y-8">
                <section className="border border-border rounded-lg overflow-hidden">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{ backgroundColor: sectionBgColor, borderColor: colorMode === 'color' ? '#E31E24' : '#000000', color: sectionTitleColor }}>Dados do Cliente</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 text-sm bg-white">
                    {renderField('Razão Social', client.name)}
                    {renderField('Nome Fantasia', client.fantasy_name)}
                    {renderField('CPF/CNPJ', client.cnpj_cpf)}
                    {renderField('Inscrição Estadual', client.ie)}
                    {renderField('Endereço', client.address)}
                    {renderField('Número', client.number)}
                    {renderField('Complemento', client.complement)}
                    {renderField('Bairro', client.neighborhood)}
                    {renderField('Cidade', client.city)}
                    {renderField('UF', client.state)}
                    {renderField('CEP', client.zip_code)}
                    {renderField('Telefone', client.phone)}
                    {renderField('Celular', client.mobile)}
                    {renderField('Contato Técnico', client.technical_contact)}
                    {client.cnpj_cpf && client.cnpj_cpf.length <= 14 && renderField('RG', client.rg)}
                    {renderField('E-mail', client.email)}
                  </div>
                </section>
                <section className="border border-border rounded-lg overflow-hidden">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{ backgroundColor: sectionBgColor, borderColor: colorMode === 'color' ? '#E31E24' : '#000000', color: sectionTitleColor }}>Equipamento</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 text-sm bg-white">
                    {renderField('Tipo', eqData.type)}
                    {renderField('Marca', eqData.brand)}
                    {renderField('Modelo', eqData.model)}
                    {renderField('Número de Série', eqData.serial_number)}
                    {eqData.installation_date && renderField('Data de Instalação', format(new Date(eqData.installation_date), 'dd/MM/yyyy'))}
                    {['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico'].includes(eqData.type) && renderField('Tipo de Tensão', eqData.voltage_type)}
                    {['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico'].includes(eqData.type) && renderField('Potência (VA)', eqData.power_va)}
                    {['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico'].includes(eqData.type) && renderField('Tensão Entrada (V)', eqData.voltage_in)}
                    {['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico'].includes(eqData.type) && renderField('Tensão Saída (V)', eqData.voltage_out)}
                    {eqData.type === 'Nobreak' && renderField('Tensão Bateria (VDC)', eqData.voltage_battery)}
                    {eqData.type === 'Nobreak' && renderField('Corrente Bateria', eqData.current_battery)}
                    {eqData.type === 'Nobreak' && renderField('Tipo de Bateria', eqData.battery_type)}
                    {eqData.type === 'Nobreak' && renderField('Quantidade de Baterias', eqData.battery_quantity)}
                    {eqData.type === 'Nobreak' && renderField('Bateria Volts (VDC)', eqData.battery_volts)}
                    {eqData.type === 'Nobreak' && renderField('Corrente Bateria (AH/W)', eqData.battery_current)}
                    {eqData.type === 'Nobreak' && renderField('Conexão de Baterias', eqData.battery_connection)}
                    {eqData.type === 'Nobreak' && renderField('Terminal de Baterias', eqData.battery_terminal)}
                    {eqData.type === 'Nobreak' && renderField('Marca da Bateria', eqData.battery_brand)}
                    {eqData.type === 'Nobreak' && renderField('Modelo da Bateria', eqData.battery_model)}
                    {eqData.type === 'Nobreak' && renderField('Corrente Entrada (A)', eqData.current_in)}
                    {eqData.type === 'Nobreak' && renderField('Corrente Saída (A)', eqData.current_out)}
                    {eqData.type === 'Nobreak' && renderField('Certificação', eqData.certification)}
                    {eqData.type === 'Nobreak' && renderField('Capacidade (AH/W)', eqData.capacity_ah)}
                    {eqData.type === 'Nobreak' && renderField('Simétrico', eqData.symmetric)}
                    {eqData.type === 'Nobreak' && renderField('Isolado', eqData.isolated)}
                    {eqData.type === 'Nobreak' && renderField('Qtd. Sinalizadores', eqData.signalizers_quantity)}
                    {eqData.type === 'Nobreak' && renderField('IHM', eqData.ihm)}
                    {eqData.type === 'Nobreak' && renderField('Localizadores', eqData.localizadores)}
                    {eqData.type === 'Nobreak' && renderField('Tipo de Cabo de Comunicação', eqData.communication_cable_type)}
                    {eqData.type === 'Nobreak' && renderField('Fixação', eqData.fixation)}
                    {eqData.type === 'Nobreak' && renderField('Quantidade', eqData.quantity)}
                  </div>
                </section>
              </div>
            </div>

            {/* PAGE 3: Infra + Elec + Battery */}
            <div ref={infraElecBatRef} className="w-[210mm] min-h-[297mm] bg-white p-12 text-black">
              <div className="space-y-8">
                <section className="border border-border rounded-lg overflow-hidden">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{ backgroundColor: sectionBgColor, borderColor: colorMode === 'color' ? '#E31E24' : '#000000', color: sectionTitleColor }}>Infra-Instalação</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 text-sm bg-white">
                    {renderField('Tipo de Serviço', report.service_type)}
                    {renderField('Ambiente Refrigerado', report.cooled_environment)}
                    {renderField('Local', report.installation_location)}
                    {!isBatteryMonitor && renderField('Alimentação', report.power_supply_type)}
                    {!isBatteryMonitor && renderField('DISJUNTOR', report.breaker)}
                  </div>
                  {!isBatteryMonitor && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 pt-0 text-sm bg-white border-t border-gray-100">
                    {renderField('CABO ENTRADA FASE (MM²)', report.cable_entry_phase)}
                    {renderField('CABO ENTRADA NEUTRO (MM²)', report.cable_entry_neutral)}
                    {renderField('CABO ENTRADA TERRA (MM²)', report.cable_entry_ground)}
                    {renderField('CABO SAÍDA FASE (MM²)', report.cable_exit_phase)}
                    {renderField('CABO SAÍDA NEUTRO (MM²)', report.cable_exit_neutral)}
                  </div>
                  )}
                  {hasValue(report.external_battery_positive_cable) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 pt-0 text-sm bg-white border-t border-gray-100">
                      <h3 className="font-bold uppercase col-span-3" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>Banco Externo</h3>
                      {renderField('Cabo Positivo (mm²)', report.external_battery_positive_cable)}
                      {renderField('Cabo Negativo (mm²)', report.external_battery_negative_cable)}
                      {renderField('Cabo Neutro (mm²)', report.external_battery_neutral_cable)}
                      {renderField('Conexão Bateria', report.external_battery_connection)}
                      {renderField('Conexão Nobreak', report.external_battery_nobreak_connection)}
                    </div>
                  )}
                  {report.installation_location === 'Inadequado' && renderField('Motivo Local Inadequado', report.installation_location_explanation)}
                </section>
                {!isBatteryMonitor && (
                <section className="border border-border rounded-lg overflow-hidden">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{ backgroundColor: sectionBgColor, borderColor: colorMode === 'color' ? '#E31E24' : '#000000', color: sectionTitleColor }}>Medições Elétricas</h2>
                  <div className="p-5 space-y-6 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 text-sm">
                      {renderElecBlock('entrada', 'Entrada')}
                      {renderElecBlock('saida', 'Saída')}
                    </div>
                  </div>
                </section>
                )}

                {hasBattery && bat && hasValue(bat.type) && (
                <section className="border border-border rounded-lg overflow-hidden">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{ backgroundColor: sectionBgColor, borderColor: colorMode === 'color' ? '#E31E24' : '#000000', color: sectionTitleColor }}>Banco de Baterias</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 text-sm bg-white">
                    {!isBatteryMonitor && renderField('Banco de Baterias', bat.type)}
                    {renderField('QUANTIDADE BATERIAS', bat.quantity)}
                    {renderField('BATERIA VOLTS (VDC)', bat.battery_volts)}
                    {renderField('CORRENTE BATERIA (AH/W)', bat.battery_current)}
                    {renderField('TENSÃO DO BANCO +/- (VDC)', bat.voltage)}
                    {!isBatteryMonitor && bat.voltage_positive_neutral && renderField('Tensão Positivo/Neutro (VDC)', bat.voltage_positive_neutral)}
                    {!isBatteryMonitor && bat.voltage_neutral_negative && renderField('Tensão Neutro/Negativo (VDC)', bat.voltage_neutral_negative)}
                    {renderField('TENSÃO DO CARREGADOR (VDC)', bat.charger_voltage)}
                    {renderField('MARCA', bat.brand)}
                    {renderField('MODELO', bat.model)}
                    {renderField('TROCOU BATERIAS', bat.trocou_baterias)}
                    {!isBatteryMonitor && bat.trocou_baterias === 'Sim' && bat.last_change && renderField('Última Troca', bat.last_change)}
                    {!isBatteryMonitor && bat.trocou_baterias === 'Não' && bat.motivo_nao_troca && renderField('Motivo da Não Troca', bat.motivo_nao_troca)}
                  </div>
                </section>
                )}
              </div>
            </div>

            {/* PAGE 4: Description */}
            <div ref={descRef} className="w-[210mm] min-h-[297mm] bg-white p-12 text-black">
              <section className="border border-border rounded-lg overflow-hidden">
                <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{ backgroundColor: sectionBgColor, borderColor: colorMode === 'color' ? '#E31E24' : '#000000', color: sectionTitleColor }}>Descrição Técnica</h2>
                <div className="p-5 space-y-6 text-sm bg-white">
                  {report.reported_problems && report.reported_problems.trim() !== '' && (
                    <div>
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>Problemas Reportados</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.reported_problems || ''}</div>
                    </div>
                  )}
                  {report.identified_defects && report.identified_defects.trim() !== '' && (
                    <div>
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>Defeitos Identificados</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.identified_defects || ''}</div>
                    </div>
                  )}
                  {report.procedures_performed && report.procedures_performed.trim() !== '' && (
                    <div>
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>Procedimentos Realizados</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.procedures_performed || ''}</div>
                    </div>
                  )}
                  {report.replaced_parts && report.replaced_parts.trim() !== '' && (
                    <div>
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>Peças Substituídas</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.replaced_parts || ''}</div>
                    </div>
                  )}
                  {report.parts_request && report.parts_request.trim() !== '' && (
                    <div>
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>Solicitação de Peças</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.parts_request || ''}</div>
                    </div>
                  )}
                  {report.observations && report.observations.trim() !== '' && (
                    <div>
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>Observações</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.observations || ''}</div>
                    </div>
                  )}
                  {report.reported_problems && report.reported_problems.trim() !== '' && (
                    <div>
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>PROBLEMAS REPORTADOS</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.reported_problems || ''}</div>
                    </div>
                  )}
                  {report.external_inspection && report.external_inspection.trim() !== '' && (
                    <div>
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>INSPEÇÃO EXTERNA</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.external_inspection || ''}</div>
                    </div>
                  )}
                  {report.internal_inspection && report.internal_inspection.trim() !== '' && (
                    <div>
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>INSPEÇÃO INTERNA</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.internal_inspection || ''}</div>
                    </div>
                  )}
                  {report.attendance_description && report.attendance_description.trim() !== '' && (
                    <div>
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>REALIZADO NO ATENDIMENTO</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.attendance_description || ''}</div>
                    </div>
                  )}
                  {report.diagnosis && report.diagnosis.trim() !== '' && (
                    <div>
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>DIAGNÓSTICO / NECESSÁRIO</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.diagnosis || ''}</div>
                    </div>
                  )}
                  {report.conclusion && report.conclusion.trim() !== '' && (
                    <div>
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>CONCLUSÃO / RESULTADO</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.conclusion || ''}</div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* PAGE 5+: Photos and Signatures Combined (for <= 15 photos) */}
            <div ref={photosAndSignaturesRef} className="w-[210mm] bg-white p-8 text-black flex flex-col gap-6">
              <div ref={photosRef} className="w-full">
                <section className="border border-border rounded-lg overflow-hidden">
                  <h2 className="border-b p-2 text-sm font-bold uppercase tracking-wide bg-[#FFD700] border-black text-black">Fotos</h2>
                  <div className="p-2 bg-white">
                    {photos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {photos.map((p, i) => (
                          <div key={p.id || i} className="border border-gray-300 p-3 rounded-md bg-white flex flex-col shadow-sm items-center">
                            {/* 🔥 DEBUG TEMPORÁRIO - Mostrar URL */}
                            <p className="text-[8px] text-red-600 break-all mb-1 w-full">URL: {p.url.substring(0, 100)}...</p>
                            {p.url ? (
                              <img 
                                src={p.url} 
                                crossOrigin="anonymous" 
                                alt={p.comment || `Foto ${i + 1}`} 
                                className="w-full h-auto max-h-80 object-contain rounded-sm"
                                style={{ 
                                  imageRendering: '-webkit-optimize-contrast',
                                  imageRendering: 'crisp-edges',
                                  imageRendering: 'pixelated'
                                }}
                                onError={(e) => {
                                  console.error('[PHOTO ERROR] Failed to load photo:', p.id, 'URL:', p.url);
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="h-20 w-full max-w-[100px] flex items-center justify-center bg-gray-100 rounded-sm">
                                <span className="text-xs text-gray-400">Sem imagem</span>
                              </div>
                            )}
                            {p.comment && p.comment.trim() !== '' ? (
                              <div className="mt-1 flex-1 flex flex-col justify-start w-full h-auto min-h-min">
                                <p className="text-[8px] text-gray-800 font-medium leading-tight text-center">{p.comment}</p>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground border-2 border-dashed rounded-lg bg-white">
                        <p className="text-sm">Nenhuma foto registrada</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
              
              <div ref={signaturesRef} className="w-full mt-auto">
                <section className="border border-border rounded-lg overflow-hidden">
                  <h2 className="border-b p-2 text-sm font-bold uppercase tracking-wide bg-[#FFD700] border-black text-black">Assinaturas</h2>
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-2 gap-12 max-w-3xl mx-auto">
                      <div className="text-center flex flex-col items-center justify-end h-full">
                        {report.technician_signature ? (
                          <img src={report.technician_signature} crossOrigin="anonymous" alt="Assinatura Técnico" className="h-24 max-w-full object-contain mb-2" style={{ imageRendering: 'crisp-edges' }} />
                        ) : (
                          <div className="h-24 w-full max-w-[200px] mb-2 bg-white rounded border border-dashed flex items-center justify-center">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">-</span>
                          </div>
                        )}
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>Técnico Responsável</p>
                      </div>
                      
                      <div className="text-center flex flex-col items-center justify-end h-full">
                        {report.client_signature ? (
                          <div className="mb-2 h-24 flex items-center justify-center">
                            <img src={report.client_signature} crossOrigin="anonymous" alt="Assinatura do Cliente" className="max-h-full max-w-full object-contain" style={{ imageRendering: 'crisp-edges' }} />
                          </div>
                        ) : (
                          <div className="h-24 w-full max-w-[200px] mb-2 bg-white rounded border border-dashed flex items-center justify-center">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">-</span>
                          </div>
                        )}
                        <div className="border-t border-gray-400 pt-2 w-full max-w-[240px]">
                          <p className="font-bold text-xs uppercase text-gray-900">{valOrDash(report.responsible_person)}</p>
                          <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mt-1">Cliente / Responsável no Local</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Visible Report View */}
          <div className="max-w-[1024px] mx-auto bg-white shadow-xl rounded-lg overflow-hidden print:shadow-none print:w-full print:max-w-none">
            <div className="p-8 sm:p-12 bg-white text-black print:p-0">
              <div className="flex justify-between items-start pb-6 mb-8 report-section" style={{
                borderBottom: `2px solid ${colorMode === 'color' ? '#E31E24' : '#000000'}`
              }}>
                <div className="flex items-center gap-4">
                  {companySettings?.company_logo && (
                    <img src={companySettings.company_logo} alt="Logo" className="h-16 object-contain" />
                  )}
                  <div>
                    <h1 className="text-2xl font-bold tracking-tighter uppercase" style={{
                      color: colorMode === 'color' ? '#E31E24' : '#000000'
                    }}>{companySettings?.company_name || 'RELATÓRIO TÉCNICO'}</h1>
                    <p className="text-sm mt-1 uppercase font-medium" style={{
                      color: '#000000'
                    }}>{report.service_type || 'Manutenção de Equipamentos'}</p>
                  </div>
                </div>
                <div className="text-right text-sm space-y-1" style={{ textAlign: 'right' }}>
                  <p className="uppercase text-xs font-semibold tracking-wider" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>Documento Oficial</p>
                  <p>O.S. Nº: <span className="font-bold">{valOrDash(report.service_order_number)}</span></p>
                  <p>Data: <span className="font-bold">{report.created_date ? format(new Date(report.created_date), 'dd/MM/yyyy') : report.attendance_date_time ? format(new Date(report.attendance_date_time), 'dd/MM/yyyy') : '-'}</span></p>
                  <p>Técnico Responsável: <span className="font-bold">{valOrDash(technician.name)}</span></p>
                </div>
              </div>

              <div className="space-y-8">
                <section className="border border-border rounded-lg overflow-hidden report-section">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{
                    backgroundColor: sectionBgColor,
                    borderColor: colorMode === 'color' ? '#E31E24' : '#000000',
                    color: sectionTitleColor
                  }}>Dados do Cliente</h2>
                  <div className="grid grid-cols-1 gap-3 p-4 text-sm bg-white">
                    {renderField('Razão Social', client.name)}
                    {renderField('Nome Fantasia', client.fantasy_name)}
                    {renderField('CPF/CNPJ', client.cnpj_cpf)}
                    {renderField('Inscrição Estadual', client.ie)}
                    {renderField('Endereço', client.address)}
                    {renderField('Número', client.number)}
                    {renderField('Complemento', client.complement)}
                    {renderField('Bairro', client.neighborhood)}
                    {renderField('Cidade', client.city)}
                    {renderField('UF', client.state)}
                    {renderField('CEP', client.zip_code)}
                    {renderField('Telefone', client.phone)}
                    {renderField('Celular', client.mobile)}
                    {renderField('Contato Técnico', client.technical_contact)}
                    {client.cnpj_cpf && client.cnpj_cpf.length <= 14 && renderField('RG', client.rg)}
                    {renderField('E-mail', client.email)}
                  </div>
                </section>

                <section className="border border-border rounded-lg overflow-hidden report-section">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{
                    backgroundColor: sectionBgColor,
                    borderColor: colorMode === 'color' ? '#E31E24' : '#000000',
                    color: sectionTitleColor
                  }}>Equipamento</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 text-sm bg-white">
                    {renderField('Tipo', eqData.type)}
                    {renderField('Marca', eqData.brand)}
                    {renderField('Modelo', eqData.model)}
                    {renderField('Nº Série', eqData.serial_number)}
                    {['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico'].includes(eqData.type) && renderField('Tensão', eqData.voltage_type)}
                    {['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico'].includes(eqData.type) && renderField('Potência', eqData.power_va, ' VA')}
                    {['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico'].includes(eqData.type) && renderField('Tensão In', eqData.voltage_in, 'V')}
                    {['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico'].includes(eqData.type) && renderField('Tensão Out', eqData.voltage_out, 'V')}
                    {eqData.type === 'Nobreak' && renderField('Tensão Bat', eqData.voltage_battery, 'V')}
                    {eqData.type === 'Nobreak' && renderField('Corrente Bat', eqData.current_battery, 'A')}
                    {eqData.type === 'Nobreak' && renderField('Tipo Bat', eqData.battery_type)}
                    {eqData.type === 'Nobreak' && renderField('Qtd Bat', eqData.battery_quantity)}
                    {eqData.type === 'Nobreak' && renderField('Bateria Volts (VDC)', eqData.battery_volts)}
                    {eqData.type === 'Nobreak' && renderField('Corrente Bateria (AH/W)', eqData.battery_current)}
                    {eqData.type === 'Nobreak' && renderField('Conexão Bat', eqData.battery_connection)}
                    {eqData.type === 'Nobreak' && renderField('Terminal Bat', eqData.battery_terminal)}
                    {eqData.type === 'Nobreak' && renderField('Marca Bat', eqData.battery_brand)}
                    {eqData.type === 'Nobreak' && renderField('Modelo Bat', eqData.battery_model)}
                    {eqData.type === 'Nobreak' && renderField('Corrente In', eqData.current_in, 'A')}
                    {eqData.type === 'Nobreak' && renderField('Corrente Out', eqData.current_out, 'A')}
                    {eqData.type === 'Nobreak' && renderField('Capacidade (AH)', eqData.capacity_ah)}
                    {eqData.type === 'Nobreak' && renderField('Certificação', eqData.certification)}
                    {eqData.type === 'Nobreak' && renderField('Simétrico', eqData.symmetric)}
                    {eqData.type === 'Nobreak' && renderField('Isolado', eqData.isolated)}
                    {eqData.type === 'Nobreak' && renderField('Qtd Sinalizadores', eqData.signalizers_quantity)}
                    {eqData.type === 'Nobreak' && renderField('IHM', eqData.ihm)}
                    {eqData.type === 'Nobreak' && renderField('Localizadores', eqData.localizadores)}
                    {eqData.type === 'Nobreak' && renderField('Cabo Com.', eqData.communication_cable_type)}
                    {eqData.type === 'Nobreak' && renderField('Fixação', eqData.fixation)}
                    {eqData.type === 'Nobreak' && renderField('Quantidade', eqData.quantity)}
                    {eqData.installation_date && renderField('Data Inst.', format(new Date(eqData.installation_date), 'dd/MM/yyyy'))}
                  </div>
                </section>

                <section className="border border-border rounded-lg overflow-hidden report-section">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{
                    backgroundColor: sectionBgColor,
                    borderColor: colorMode === 'color' ? '#E31E24' : '#000000',
                    color: sectionTitleColor
                  }}>Infra-Instalação</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 text-sm bg-white">
                    {renderField('Tipo de Serviço', report.service_type)}
                    {renderField('Ambiente Refrigerado', report.cooled_environment)}
                    {renderField('Local', report.installation_location)}
                    {!isBatteryMonitor && renderField('Alimentação', report.power_supply_type)}
                    {!isBatteryMonitor && renderField('DISJUNTOR', report.breaker)}
                  </div>
                  {!isBatteryMonitor && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 pt-0 text-sm bg-white border-t border-gray-100">
                    {renderField('CABO ENTRADA FASE (MM²)', report.cable_entry_phase)}
                    {renderField('CABO ENTRADA NEUTRO (MM²)', report.cable_entry_neutral)}
                    {renderField('CABO ENTRADA TERRA (MM²)', report.cable_entry_ground)}
                    {renderField('CABO SAÍDA FASE (MM²)', report.cable_exit_phase)}
                    {renderField('CABO SAÍDA NEUTRO (MM²)', report.cable_exit_neutral)}
                  </div>
                  )}
                  {hasValue(report.external_battery_positive_cable) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 pt-0 text-sm bg-white border-t border-gray-100">
                      <h3 className="font-bold uppercase col-span-3" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>Banco Externo</h3>
                      {renderField('Cabo Positivo (mm²)', report.external_battery_positive_cable)}
                      {renderField('Cabo Negativo (mm²)', report.external_battery_negative_cable)}
                      {renderField('Cabo Neutro Bat. Ext. (mm²)', report.external_battery_neutral_cable)}
                      {renderField('Conexão Bateria', report.external_battery_connection)}
                      {renderField('Conexão Nobreak', report.external_battery_nobreak_connection)}
                    </div>
                  )}
                  {report.installation_location === 'Inadequado' && renderField('Motivo Local Inadequado', report.installation_location_explanation)}
                </section>

                {!isBatteryMonitor && (
                <section className="border border-border rounded-lg overflow-hidden report-section">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{
                    backgroundColor: sectionBgColor,
                    borderColor: colorMode === 'color' ? '#E31E24' : '#000000',
                    color: sectionTitleColor
                  }}>Medições Elétricas</h2>
                  <div className="p-5 space-y-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      {renderElecBlock('entrada', 'Entrada')}
                      {renderElecBlock('saida', 'Saída')}
                    </div>
                  </div>
                </section>
                )}

                {hasBattery && bat && hasValue(bat.type) && (
                <section className="border border-border rounded-lg overflow-hidden report-section">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{
                    backgroundColor: sectionBgColor,
                    borderColor: colorMode === 'color' ? '#E31E24' : '#000000',
                    color: sectionTitleColor
                  }}>Banco de Baterias</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 text-sm bg-white">
                    {!isBatteryMonitor && renderField('Banco de Baterias', bat.type)}
                    {renderField('QUANTIDADE BATERIAS', bat.quantity)}
                    {renderField('BATERIA VOLTS (VDC)', bat.battery_volts)}
                    {renderField('CORRENTE BATERIA (AH/W)', bat.battery_current)}
                    {renderField('TENSÃO DO BANCO +/- (VDC)', bat.voltage)}
                    {!isBatteryMonitor && bat.voltage_positive_neutral && renderField('Tensão Positivo/Neutro (VDC)', bat.voltage_positive_neutral)}
                    {!isBatteryMonitor && bat.voltage_neutral_negative && renderField('Tensão Neutro/Negativo (VDC)', bat.voltage_neutral_negative)}
                    {renderField('TENSÃO DO CARREGADOR (VDC)', bat.charger_voltage)}
                    {renderField('MARCA', bat.brand)}
                    {renderField('MODELO', bat.model)}
                    {renderField('TROCOU BATERIAS', bat.trocou_baterias)}
                    {!isBatteryMonitor && bat.trocou_baterias === 'Sim' && bat.last_change && renderField('Última Troca', bat.last_change)}
                    {!isBatteryMonitor && bat.trocou_baterias === 'Não' && bat.motivo_nao_troca && renderField('Motivo da Não Troca', bat.motivo_nao_troca)}
                  </div>
                </section>
                )}

                <section className="border border-border rounded-lg overflow-hidden report-section">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{
                    backgroundColor: sectionBgColor,
                    borderColor: colorMode === 'color' ? '#E31E24' : '#000000',
                    color: sectionTitleColor
                  }}>Descrição Técnica</h2>
                  <div className="p-5 space-y-6 text-sm bg-white">
                    <div className="field-group">
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>PROBLEMAS REPORTADOS</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.reported_problems || ''}</div>
                    </div>
                    <div className="field-group">
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>INSPEÇÃO EXTERNA</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.external_inspection || ''}</div>
                    </div>
                    <div className="field-group">
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>INSPEÇÃO INTERNA</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.internal_inspection || ''}</div>
                    </div>
                    <div className="field-group">
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>REALIZADO NO ATENDIMENTO</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.attendance_description || ''}</div>
                    </div>
                    <div className="field-group">
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>DIAGNÓSTICO / NECESSÁRIO</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.diagnosis || ''}</div>
                    </div>
                    <div className="field-group">
                      <span className="block text-xs uppercase font-black mb-1" style={{ color: colorMode === 'color' ? '#E31E24' : '#000000' }}>CONCLUSÃO / RESULTADO</span>
                      <div className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap break-words font-medium text-black">{report.conclusion || ''}</div>
                    </div>
                  </div>
                </section>

                <section className="border border-border rounded-lg overflow-hidden report-section">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{
                    backgroundColor: sectionBgColor,
                    borderColor: colorMode === 'color' ? '#E31E24' : '#000000',
                    color: sectionTitleColor
                  }}>Fotos</h2>
                  <div className="p-5 bg-white">
                    {photos.length > 0 ? (
                      Array.from({ length: Math.ceil(photos.length / 15) }).map((_, chunkIdx) => {
                        const chunk = photos.slice(chunkIdx * 15, (chunkIdx + 1) * 15);
                        return (
                          <div key={chunkIdx} className={chunkIdx > 0 ? "mt-8 pt-6 border-t border-gray-200" : ""}>
                            {photos.length > 15 && (
                              <h3 className="text-xs font-bold uppercase mb-4 text-gray-500">Parte {chunkIdx + 1}</h3>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {chunk.map((p, i) => (
                                <div key={p.id || i} className="border border-gray-200 p-3 rounded-lg bg-white flex flex-col shadow-sm photo-item items-center">
                                  <div className="relative aspect-[4/3] bg-gray-50 rounded overflow-hidden w-full">
                                    <img 
                                      src={p.url} 
                                      alt={p.comment || `Foto ${chunkIdx * 15 + i + 1}`} 
                                      className="w-full h-full object-contain"
                                      style={{ 
                                        imageRendering: '-webkit-optimize-contrast',
                                        imageRendering: 'crisp-edges',
                                        imageRendering: 'pixelated',
                                        maxHeight: '100%',
                                        maxWidth: '100%'
                                      }}
                                      onClick={() => setZoomPhoto(p.url)}
                                      onError={(e) => {
                                        console.error('[PHOTO ERROR] Failed to load photo:', p.id, 'URL:', p.url);
                                        e.target.src = 'https://via.placeholder.com/400x300/ccc/666?text=Erro+na+Imagem';
                                      }}
                                    />
                                  </div>
                                  {p.comment && p.comment.trim() !== '' ? (
                                    <div className="photo-comment mt-2 h-auto min-h-min break-words w-full">
                                      <p className="text-xs text-gray-700 font-medium leading-tight text-center">{p.comment}</p>
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-white">
                        <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma foto registrada</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="border border-border rounded-lg overflow-hidden report-section signatures-section">
                  <h2 className="border-b p-3 text-sm font-black uppercase tracking-wide" style={{
                    backgroundColor: sectionBgColor,
                    borderColor: colorMode === 'color' ? '#E31E24' : '#000000',
                    color: sectionTitleColor
                  }}>Assinaturas</h2>
                  <div className="p-8 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl mx-auto">
                      <div className="text-center flex flex-col items-center justify-end h-full">
                        {report.technician_signature ? (
                          <img src={report.technician_signature} alt="Assinatura Técnico" className="h-32 max-w-full object-contain mb-4" style={{ imageRendering: 'crisp-edges' }} />
                        ) : (
                          <div className="h-32 w-full max-w-[250px] mb-4 bg-white rounded border border-dashed flex items-center justify-center">
                            <span className="text-xs text-gray-400 uppercase tracking-widest">-</span>
                          </div>
                        )}
                        <div className="border-t border-gray-400 pt-3 w-full max-w-[280px]">
                          <p className="font-bold text-sm uppercase text-gray-900">{valOrDash(technician.name)}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-1">Técnico Responsável</p>
                        </div>
                      </div>
                      
                      <div className="text-center flex flex-col items-center justify-end h-full">
                        {report.client_signature ? (
                          <div className="mb-4 h-32 flex items-center justify-center">
                            <img src={report.client_signature} alt="Assinatura do Cliente" className="max-h-full max-w-full object-contain" style={{ imageRendering: 'crisp-edges' }} />
                          </div>
                        ) : (
                          <div className="h-32 w-full max-w-[250px] mb-4 bg-white rounded border border-dashed flex items-center justify-center">
                            <span className="text-xs text-gray-400 uppercase tracking-widest">Assinatura não capturada</span>
                          </div>
                        )}
                        <div className="border-t border-gray-400 pt-3 w-full max-w-[280px]">
                          <p className="font-bold text-sm uppercase text-gray-900">{valOrDash(report.responsible_person)}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-1">Cliente / Responsável no Local</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

              </div>

              <div className="mt-12 pt-6 border-t border-gray-300 text-center text-[10px] text-gray-500 report-section">
                <p>Rua Dr. Ratisbona, 410 – Fátima – Fortaleza – CE – 60.411-220 | Fones: (85) 3021-0003 / 3256-6989 ± Cel: (85) 9-9212-1887 Claro</p>
                <p>CNPJ: 33.800.714/0001-90 / IE: 06.378.183 | E-mail: fattax@fattax.srv.br | Site: www.fattax.srv.br</p>
              </div>

            </div>
          </div>
        </main>

        <div className="print:hidden">
          <Footer />
        </div>
      </div>

      <Dialog open={!!zoomPhoto} onOpenChange={() => setZoomPhoto(null)}>
        <DialogContent className="max-w-6xl p-1 bg-transparent border-none shadow-none">
          {zoomPhoto && <img src={zoomPhoto} alt="Foto Ampliada" className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl bg-white" style={{ imageRendering: 'crisp-edges' }} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este relatório e todos os seus dados? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteReport} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

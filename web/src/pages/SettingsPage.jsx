import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { compressImage } from '../utils/imageCompression.js';
import { Upload, X, FileText } from 'lucide-react';
import { API_BASE_URL } from '../config/api.js';

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [sigTiagoUrl, setSigTiagoUrl] = useState('');
  const [sigTitoUrl, setSigTitoUrl] = useState('');
  const [coverPdfUrl, setCoverPdfUrl] = useState('');
  const [coverPdfName, setCoverPdfName] = useState('');
  
  const [logoFile, setLogoFile] = useState(null);
  const [sigTiagoFile, setSigTiagoFile] = useState(null);
  const [sigTitoFile, setSigTitoFile] = useState(null);
  const [coverPdfFile, setCoverPdfFile] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/settings/user/${currentUser.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const settings = response.data.data;
      
      if (settings) {
        setSettingsId(settings.id);
        setCompanyName(settings.company_name || '');
        if (settings.company_logo) setLogoUrl(`${API_BASE_URL}/uploads/${settings.company_logo}`);
        if (settings.signature_tiago_viana) setSigTiagoUrl(`${API_BASE_URL}/uploads/${settings.signature_tiago_viana}`);
        if (settings.signature_tito_livio) setSigTitoUrl(`${API_BASE_URL}/uploads/${settings.signature_tito_livio}`);
        if (settings.cover_pdf) {
          setCoverPdfUrl(`${API_BASE_URL}/uploads/${settings.cover_pdf}`);
          setCoverPdfName(settings.cover_pdf);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, setFile, setPreviewUrl) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { file: compressedFile, dataUrl } = await compressImage(file, 500);
      setFile(compressedFile);
      setPreviewUrl(dataUrl);
    } catch (error) {
      toast.error('Erro ao processar imagem');
    }
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione um arquivo PDF');
      return;
    }
    
    if (file.size > 20971520) {
      toast.error('O arquivo PDF deve ter no máximo 20MB');
      return;
    }
    
    setCoverPdfFile(file);
    setCoverPdfName(file.name);
    setCoverPdfUrl(URL.createObjectURL(file));
  };

  const handleDeleteCoverPdf = async () => {
    if (!settingsId) {
      setCoverPdfFile(null);
      setCoverPdfUrl('');
      setCoverPdfName('');
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`${API_BASE_URL}/settings/${settingsId}`, {
        cover_pdf: null
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      
      setCoverPdfFile(null);
      setCoverPdfUrl('');
      setCoverPdfName('');
      toast.success('Capa PDF removida com sucesso');
    } catch (error) {
      toast.error('Erro ao remover capa PDF');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('user_id', currentUser.id);
      formData.append('company_name', companyName);
      
      if (logoFile) formData.append('company_logo', logoFile);
      if (sigTiagoFile) formData.append('signature_tiago_viana', sigTiagoFile);
      if (sigTitoFile) formData.append('signature_tito_livio', sigTitoFile);
      if (coverPdfFile) formData.append('cover_pdf', coverPdfFile);

      const token = localStorage.getItem('auth_token');
      if (settingsId) {
        await axios.put(`${API_BASE_URL}/settings/${settingsId}`, formData, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        const newRecordRes = await axios.post(`${API_BASE_URL}/settings`, formData, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setSettingsId(newRecordRes.data.data.id);
      }
      
      toast.success('Configurações salvas com sucesso');
      
      setLogoFile(null);
      setSigTiagoFile(null);
      setSigTitoFile(null);
      setCoverPdfFile(null);
      
      await fetchSettings();
      
    } catch (error) {
      toast.error('Erro ao salvar configurações: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Configurações - FATTAX</title>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl pb-20 md:pb-8">
          <h1 className="text-3xl font-bold mb-8" style={{ letterSpacing: '-0.02em' }}>Configurações</h1>

          <div className="space-y-8">
            <div className="bg-card rounded-xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 border-b pb-2">DADOS DA EMPRESA</h2>
              
              <div className="space-y-4">
                <div>
                  <Label>E-MAIL DO USUÁRIO</Label>
                  <Input value={currentUser?.email} disabled className="bg-muted" />
                </div>
                
                <div>
                  <Label htmlFor="company_name">NOME DA EMPRESA</Label>
                  <Input 
                    id="company_name" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    placeholder="Ex: FATTAX Soluções em Energia"
                  />
                </div>

                <div>
                  <Label>LOGO DA EMPRESA (Contra-Capa do Relatório)</Label>
                  <div className="mt-2 flex items-center gap-6">
                    <div className="w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30 relative overflow-hidden">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem logo</span>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <div className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md inline-flex items-center text-sm font-medium transition-colors">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Logo
                        </div>
                      </Label>
                      <Input 
                        id="logo-upload" 
                        type="file" 
                        accept="image/png, image/jpeg" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, setLogoFile, setLogoUrl)} 
                      />
                      <p className="text-xs text-muted-foreground mt-2">PNG ou JPG. Será redimensionado automaticamente.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>CAPA DO RELATÓRIO (PDF)</Label>
                  <div className="mt-2">
                    {coverPdfUrl ? (
                      <div className="border rounded-lg p-4 bg-muted/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{coverPdfName}</p>
                            <p className="text-xs text-muted-foreground">PDF Cover</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={handleDeleteCoverPdf}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="cover-pdf-upload" className="cursor-pointer">
                          <div className="border-2 border-dashed rounded-lg p-6 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm font-medium">Clique para fazer upload da capa PDF</span>
                            <span className="text-xs text-muted-foreground">PDF até 20MB</span>
                          </div>
                        </Label>
                        <Input 
                          id="cover-pdf-upload" 
                          type="file" 
                          accept="application/pdf" 
                          className="hidden" 
                          onChange={handlePdfUpload} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 border-b pb-2">ASSINATURAS DE TÉCNICOS</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Faça upload das assinaturas que serão usadas automaticamente nos relatórios de cada técnico.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Label className="text-base font-semibold">ASSINATURA TÉCNICO 1 - TIAGO VIANA</Label>
                  <div className="mt-2 border rounded-lg p-4 bg-muted/10">
                    <div className="h-24 border-b border-dashed mb-4 flex items-center justify-center bg-white rounded">
                      {sigTiagoUrl ? (
                        <img src={sigTiagoUrl} alt="Assinatura Tiago Viana" className="h-full object-contain" />
                      ) : (
                        <span className="text-muted-foreground text-xs">Nenhuma assinatura</span>
                      )}
                    </div>
                    <Label htmlFor="sig-tiago-upload" className="cursor-pointer w-full">
                      <div className="border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md flex items-center justify-center text-sm font-medium transition-colors">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Assinatura
                      </div>
                    </Label>
                    <Input 
                      id="sig-tiago-upload" 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, setSigTiagoFile, setSigTiagoUrl)} 
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold">ASSINATURA TÉCNICO 2 - TITO LIVIO</Label>
                  <div className="mt-2 border rounded-lg p-4 bg-muted/10">
                    <div className="h-24 border-b border-dashed mb-4 flex items-center justify-center bg-white rounded">
                      {sigTitoUrl ? (
                        <img src={sigTitoUrl} alt="Assinatura Tito Livio" className="h-full object-contain" />
                      ) : (
                        <span className="text-muted-foreground text-xs">Nenhuma assinatura</span>
                      )}
                    </div>
                    <Label htmlFor="sig-tito-upload" className="cursor-pointer w-full">
                      <div className="border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md flex items-center justify-center text-sm font-medium transition-colors">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Assinatura
                      </div>
                    </Label>
                    <Input 
                      id="sig-tito-upload" 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, setSigTitoFile, setSigTitoUrl)} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
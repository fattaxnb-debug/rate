import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Save, X, Upload, XCircle, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api.js';
import { compressReportPhoto } from '@/utils/imageCompression.js';

export default function FailureForm({ failure, onSave, onCancel, isModal = false }) {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    power: '',
    board_reference: '',
    input_voltage: '',
    output_voltage: '',
    battery_voltage: '',
    failure_description: '',
    initial_symptoms: '',
    tests_performed: '',
    tools_used: '',
    components: '',
    photo_urls: '',
    suggested_solution: '',
    parts_used: '',
    category: '',
    frequency: '',
    tags: ''
  });

  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  useEffect(() => {
    if (failure) {
      setFormData({
        ...formData,
        ...failure
      });
      // Carregar fotos com comentários existentes
      if (failure.photo_urls) {
        try {
          // Tenta fazer parse como JSON (formato novo com comentários)
          const photoData = JSON.parse(failure.photo_urls);
          if (Array.isArray(photoData)) {
            setPhotos(photoData.map((p, index) => ({
              id: p.id || index,
              url: p.url,
              file: null, // Fotos carregadas não têm file
              comment: p.comment || ''
            })));
          }
        } catch (e) {
          // Se falhar, usa formato antigo (CSV)
          const urls = failure.photo_urls.split(',').filter(url => url.trim());
          setPhotos(urls.map((url, index) => ({
            id: index,
            url: url.trim(),
            file: null,
            comment: ''
          })));
        }
      }
    }
  }, [failure]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const newPhotos = [];

    for (const file of files) {
      try {
        const { file: compressedFile, dataUrl } = await compressReportPhoto(file);
        newPhotos.push({
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: dataUrl,
          file: compressedFile,
          comment: ''
        });
      } catch (error) {
        console.error('Error compressing photo:', error);
        toast.error('Erro ao processar imagem');
      }
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setUploading(false);
  };

  const handleRemovePhoto = (photoId) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handlePhotoCommentChange = (photoId, comment) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId ? { ...photo, comment } : photo
    ));
  };

  const handlePreviewPhoto = (photo) => {
    setPreviewPhoto(photo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Fazer upload das fotos que têm file
      const photosToUpload = photos.filter(p => p.file);
      const uploadedPhotos = [];

      for (const photo of photosToUpload) {
        try {
          const formData = new FormData();
          formData.append('photo', photo.file);
          formData.append('type', 'failure');

          const token = localStorage.getItem('auth_token');
          const response = await axios.post(`${API_BASE_URL}/uploads/photo`, formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });

          if (response.data.data && response.data.data.url) {
            uploadedPhotos.push({
              id: photo.id,
              url: response.data.data.url,
              comment: photo.comment || ''
            });
          }
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast.error('Erro ao fazer upload da foto');
        }
      }

      // Manter fotos que já tinham URL (não foram enviadas agora)
      const existingPhotos = photos.filter(p => !p.file).map(p => ({
        id: p.id,
        url: p.url,
        comment: p.comment || ''
      }));

      // Combinar fotos
      const allPhotos = [...existingPhotos, ...uploadedPhotos];

      // Atualizar photo_urls com as fotos e comentários em formato JSON
      const dataToSend = {
        ...formData,
        photo_urls: JSON.stringify(allPhotos)
      };

      const token = localStorage.getItem('auth_token');
      const url = failure?.id 
        ? `${API_BASE_URL}/failures/${failure.id}`
        : `${API_BASE_URL}/failures`;
      const method = failure?.id ? 'put' : 'post';

      const response = await axios[method](url, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(failure?.id ? 'Falha atualizada com sucesso!' : 'Falha registrada com sucesso!');

      if (isModal && onSave) {
        onSave();
      } else {
        onCancel();
      }
    } catch (error) {
      console.error('Error saving failure:', error);
      toast.error('Erro ao salvar falha');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identificação do Equipamento */}
      <Card>
        <CardHeader className="bg-gray-700 text-white py-2">
          <CardTitle className="text-sm font-bold">IDENTIFICAÇÃO DO EQUIPAMENTO</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div>
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="model">Modelo</Label>
            <Input
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="power">Potência</Label>
            <Input
              id="power"
              name="power"
              value={formData.power}
              onChange={handleChange}
              placeholder="Ex: 30 KVA"
            />
          </div>
          <div>
            <Label htmlFor="board_reference">Referência Placa</Label>
            <Input
              id="board_reference"
              name="board_reference"
              value={formData.board_reference}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="input_voltage">Tensão de Entrada (VAC)</Label>
            <Input
              id="input_voltage"
              name="input_voltage"
              value={formData.input_voltage}
              onChange={handleChange}
              placeholder="Ex: 220V"
            />
          </div>
          <div>
            <Label htmlFor="output_voltage">Tensão de Saída (VAC)</Label>
            <Input
              id="output_voltage"
              name="output_voltage"
              value={formData.output_voltage}
              onChange={handleChange}
              placeholder="Ex: 220V"
            />
          </div>
          <div>
            <Label htmlFor="battery_voltage">Tensão de Baterias (VDC)</Label>
            <Input
              id="battery_voltage"
              name="battery_voltage"
              value={formData.battery_voltage}
              onChange={handleChange}
              placeholder="Ex: 48V"
            />
          </div>
        </CardContent>
      </Card>

      {/* Diagnóstico */}
      <Card>
        <CardHeader className="bg-gray-700 text-white py-2">
          <CardTitle className="text-sm font-bold">DIAGNÓSTICO</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-4">
          <div>
            <Label htmlFor="failure_description">Falha Apresentada</Label>
            <textarea
              id="failure_description"
              name="failure_description"
              value={formData.failure_description}
              onChange={handleChange}
              placeholder="Ex: Falha X no display, LEDs X, Y ou Z piscando"
              className="w-full border rounded-md p-2 min-h-[80px] mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="initial_symptoms">Sintomas Iniciais</Label>
            <textarea
              id="initial_symptoms"
              name="initial_symptoms"
              value={formData.initial_symptoms}
              onChange={handleChange}
              className="w-full border rounded-md p-2 min-h-[60px] mt-1"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="tests_performed">Testes Realizados</Label>
            <textarea
              id="tests_performed"
              name="tests_performed"
              value={formData.tests_performed}
              onChange={handleChange}
              className="w-full border rounded-md p-2 min-h-[60px] mt-1"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="tools_used">Ferramentas Utilizadas</Label>
            <textarea
              id="tools_used"
              name="tools_used"
              value={formData.tools_used}
              onChange={handleChange}
              className="w-full border rounded-md p-2 min-h-[60px] mt-1"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="components">Componentes</Label>
            <textarea
              id="components"
              name="components"
              value={formData.components}
              onChange={handleChange}
              placeholder="Ex: Resistor X, Diodo Y, Capacitor Z"
              className="w-full border rounded-md p-2 min-h-[60px] mt-1"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="photo_urls">Registro Fotográfico</Label>
            <div className="mt-2">
              <input
                type="file"
                id="photo_upload"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('photo_upload').click()}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Enviando...' : 'Adicionar Fotos'}
              </Button>
            </div>

            {/* Preview das fotos */}
            {photos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {photos.map((photo) => (
                  <div key={photo.id} className="group relative border rounded-xl overflow-hidden bg-card shadow-sm flex flex-col">
                    <div className="aspect-video relative bg-muted shrink-0">
                      <img 
                        src={photo.url} 
                        alt="Foto da falha" 
                        className="w-full h-full object-cover cursor-pointer" 
                        onClick={() => handlePreviewPhoto(photo)} 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => handlePreviewPhoto(photo)}>
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleRemovePhoto(photo.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 space-y-2 flex-1 flex flex-col">
                      <textarea
                        placeholder="Comentário da foto..."
                        className="text-xs resize-none flex-1 min-h-[60px] border rounded-md p-2"
                        value={photo.comment}
                        onChange={(e) => handlePhotoCommentChange(photo.id, e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Solução */}
      <Card>
        <CardHeader className="bg-gray-700 text-white py-2">
          <CardTitle className="text-sm font-bold">SOLUÇÃO</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-4">
          <div>
            <Label htmlFor="suggested_solution">Solução Sugerida</Label>
            <textarea
              id="suggested_solution"
              name="suggested_solution"
              value={formData.suggested_solution}
              onChange={handleChange}
              placeholder="Ex: Troque Resistor X, Diodo Y ou CI Z"
              className="w-full border rounded-md p-2 min-h-[80px] mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="parts_used">Peças Utilizadas</Label>
            <textarea
              id="parts_used"
              name="parts_used"
              value={formData.parts_used}
              onChange={handleChange}
              className="w-full border rounded-md p-2 min-h-[60px] mt-1"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Classificação */}
      <Card>
        <CardHeader className="bg-gray-700 text-white py-2">
          <CardTitle className="text-sm font-bold">CLASSIFICAÇÃO</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div>
            <Label htmlFor="category">Categoria da Falha</Label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              <option value="Elétrica">Elétrica</option>
              <option value="Eletrônica">Eletrônica</option>
              <option value="Mecânica">Mecânica</option>
              <option value="Software">Software</option>
            </select>
          </div>
          <div>
            <Label htmlFor="frequency">Frequência</Label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              <option value="Rara">Rara</option>
              <option value="Ocasional">Ocasional</option>
              <option value="Comum">Comum</option>
              <option value="Muito Comum">Muito Comum</option>
            </select>
          </div>
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Tags separadas por vírgula"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="h-4 w-4 mr-2" />
          {failure?.id ? 'Atualizar Falha' : 'Registrar Falha'}
        </Button>
      </div>

      {/* Dialog de Preview de Foto */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {previewPhoto && (
            <img
              src={previewPhoto.url || previewPhoto}
              alt="Foto em tamanho completo"
              className="w-full h-auto object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}

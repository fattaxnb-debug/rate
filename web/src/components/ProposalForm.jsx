import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, X, Calculator, Search } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api.js';

export default function ProposalForm({ proposal, onSave, onCancel, isModal = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    proposal_number: '',
    proposal_date: new Date().toLocaleDateString('pt-BR'),
    status: 'ABERTA',
    client_name: '',
    client_cnpj: '',
    client_phone: '',
    client_mobile: '',
    client_email: '',
    client_contact: '',
    // Marca/Modelo
    brand: '',
    line: '',
    model: '',
    code: '',
    // Especificações
    power: '',
    input_voltage: '',
    output_voltage: '',
    battery_bank_type: '',
    battery_quantity: '',
    battery_voltage: '',
    battery_amperage: '',
    power_supply: '',
    nobreak_output: '',
    // Condições Gerais
    monitoring: '',
    installation_activation: '',
    // Condições Comerciais
    payment_terms: '',
    delivery_time: '',
    warranty: '',
    shipping_terms: '',
    proposal_validity: '',
    observations: '',
    motivo: '',
    // Itens
    items: [
      { product_code: '', product_description: '', quantity: 1, unit_price: 0, total_price: 0 }
    ],
    total_amount: 0
  });

  const [errors, setErrors] = useState({});
  const [clients, setClients] = useState([]);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  useEffect(() => {
    if (proposal) {
      setFormData({
        ...formData,
        ...proposal,
        items: proposal.items?.length > 0 ? proposal.items : formData.items
      });
    }
  }, [proposal]);

  const fetchClients = async (search = '') => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = search ? { search } : {};
      const response = await axios.get(`${API_BASE_URL}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao buscar clientes');
    }
  };

  const handleClientSearch = () => {
    fetchClients(clientSearchTerm);
    setShowClientSearch(true);
  };

  const selectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      client_name: client.name || client.fantasy_name || '',
      client_cnpj: client.cnpj_cpf || '',
      client_phone: client.phone || '',
      client_mobile: client.mobile || '',
      client_email: client.email || '',
      client_contact: client.technical_contact || ''
    }));
    setShowClientSearch(false);
    setClientSearchTerm('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      
      // Calculate total price for item
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? parseInt(value) || 0 : newItems[index].quantity;
        const price = field === 'unit_price' ? parseFloat(value) || 0 : newItems[index].unit_price;
        newItems[index].total_price = qty * price;
      }
      
      // Calculate total amount
      const totalAmount = newItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
      
      return {
        ...prev,
        items: newItems,
        total_amount: totalAmount
      };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { product_code: '', product_description: '', quantity: 1, unit_price: 0, total_price: 0 }
      ]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const totalAmount = newItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
      return {
        ...prev,
        items: newItems,
        total_amount: totalAmount
      };
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.client_name?.trim()) {
      newErrors.client_name = 'Nome do cliente é obrigatório';
    }
    
    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.product_description?.trim()) {
        newErrors[`item_${index}_description`] = 'Descrição do produto é obrigatória';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      // Converter data de valididade de dd/mm/yyyy para yyyy-mm-dd
      let validityDate = formData.proposal_validity || '';
      if (validityDate && validityDate.includes('/')) {
        const parts = validityDate.split('/');
        if (parts.length === 3) validityDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      const dataToSend = { ...formData, proposal_validity: validityDate };

      // Remover proposal_date temporariamente (será adicionado de volta depois)
      delete dataToSend.proposal_date;

      console.log('[FRONTEND DEBUG] Enviando dados:', JSON.stringify(dataToSend, null, 2));
      console.log('[FRONTEND DEBUG] Keys:', Object.keys(dataToSend));
      console.log('[FRONTEND DEBUG] Keys count:', Object.keys(dataToSend).length);

      const token = localStorage.getItem('auth_token');
      const url = proposal?.id 
        ? `${API_BASE_URL}/proposals/${proposal.id}`
        : `${API_BASE_URL}/proposals`;
      const method = proposal?.id ? 'put' : 'post';

      const response = await axios[method](url, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(proposal?.id ? 'Proposta atualizada com sucesso!' : 'Proposta criada com sucesso!');

      // Se estiver em modo modal, chamar onSave com o novo status
      if (isModal && onSave) {
        onSave(formData.status);
      } else {
        // Redirecionar para o viewer
        const proposalId = proposal?.id || response.data.id;
        navigate(`/proposals/${proposalId}`);
      }
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast.error('Erro ao salvar proposta');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader className="bg-gray-100">
          <CardTitle className="text-center text-lg font-bold">
            PROPOSTA TÉCNICA
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="font-bold">Fortaleza, {formData.proposal_date}</Label>
            </div>
            <div className="text-right">
              <Label className="font-bold">Prop. {formData.proposal_number || '_______'}</Label>
            </div>
            <div className="text-right">
              <select
                name="status"
                value={formData.status || 'ABERTA'}
                onChange={handleChange}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="ABERTA">ABERTA</option>
                <option value="FECHADA">FECHADA</option>
                <option value="DISPENSADA">DISPENSADA</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção Cliente */}
      <Card>
        <CardHeader className="bg-gray-700 text-white py-2">
          <CardTitle className="text-sm font-bold">CLIENTE</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="md:col-span-2">
            <Label htmlFor="client_search">Buscar Cliente</Label>
            <div className="flex gap-2">
              <Input
                id="client_search"
                placeholder="Digite para buscar cliente..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleClientSearch()}
              />
              <Button type="button" variant="outline" onClick={handleClientSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {showClientSearch && clients.length > 0 && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => selectClient(client)}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-medium">{client.name || client.fantasy_name}</div>
                    <div className="text-sm text-gray-500">{client.cnpj_cpf}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="client_name">Nome/Razão Social *</Label>
            <Input
              id="client_name"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              className={errors.client_name ? 'border-red-500' : ''}
            />
            {errors.client_name && <p className="text-sm text-red-500 mt-1">{errors.client_name}</p>}
          </div>
          <div>
            <Label htmlFor="client_cnpj">CNPJ</Label>
            <Input
              id="client_cnpj"
              name="client_cnpj"
              value={formData.client_cnpj}
              onChange={handleChange}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div>
            <Label htmlFor="client_phone">Telefone</Label>
            <Input
              id="client_phone"
              name="client_phone"
              value={formData.client_phone}
              onChange={handleChange}
              placeholder="(00) 0000-0000"
            />
          </div>
          <div>
            <Label htmlFor="client_mobile">Celular</Label>
            <Input
              id="client_mobile"
              name="client_mobile"
              value={formData.client_mobile}
              onChange={handleChange}
              placeholder="(00) 0 0000-0000"
            />
          </div>
          <div>
            <Label htmlFor="client_email">E-mail</Label>
            <Input
              id="client_email"
              name="client_email"
              type="email"
              value={formData.client_email}
              onChange={handleChange}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="client_contact">Contato</Label>
            <Input
              id="client_contact"
              name="client_contact"
              value={formData.client_contact}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seção Marca/Modelo */}
      <Card>
        <CardHeader className="bg-gray-700 text-white py-2">
          <CardTitle className="text-sm font-bold">MARCA/MODELO</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
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
            <Label htmlFor="line">Linha</Label>
            <Input
              id="line"
              name="line"
              value={formData.line}
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
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seção Especificações */}
      <Card>
        <CardHeader className="bg-gray-700 text-white py-2">
          <CardTitle className="text-sm font-bold">ESPECIFICAÇÕES</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div>
            <Label htmlFor="power">Potência</Label>
            <Input
              id="power"
              name="power"
              value={formData.power}
              onChange={handleChange}
              placeholder="Ex: 30 KVA / 27 KW"
            />
          </div>
          <div>
            <Label htmlFor="input_voltage">Tensão de Entrada</Label>
            <Input
              id="input_voltage"
              name="input_voltage"
              value={formData.input_voltage}
              onChange={handleChange}
              placeholder="Ex: 380V (FF/F/T) - TRIFÁSICO"
            />
          </div>
          <div>
            <Label htmlFor="output_voltage">Tensão de Saída</Label>
            <Input
              id="output_voltage"
              name="output_voltage"
              value={formData.output_voltage}
              onChange={handleChange}
              placeholder="Ex: 380V (FF/F/T) - TRIFÁSICO"
            />
          </div>
          <div>
            <Label htmlFor="battery_bank_type">Banco de Baterias</Label>
            <select
              id="battery_bank_type"
              name="battery_bank_type"
              value={formData.battery_bank_type}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              <option value="Interno">Interno</option>
              <option value="Externo">Externo</option>
            </select>
          </div>
          <div>
            <Label htmlFor="battery_quantity">Quant. Baterias</Label>
            <Input
              id="battery_quantity"
              name="battery_quantity"
              type="number"
              value={formData.battery_quantity}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="battery_voltage">Tensão Bateria</Label>
            <Input
              id="battery_voltage"
              name="battery_voltage"
              value={formData.battery_voltage}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="battery_amperage">Amperagem Bateria</Label>
            <Input
              id="battery_amperage"
              name="battery_amperage"
              value={formData.battery_amperage}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="power_supply">Alimentação</Label>
            <select
              id="power_supply"
              name="power_supply"
              value={formData.power_supply}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              <option value="Tomada">Tomada</option>
              <option value="Circuito">Circuito</option>
              <option value="Tomada e Circuito">Tomada e Circuito</option>
            </select>
          </div>
          <div>
            <Label htmlFor="nobreak_output">Saída Nobreak</Label>
            <select
              id="nobreak_output"
              name="nobreak_output"
              value={formData.nobreak_output}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              <option value="Tomada">Tomada</option>
              <option value="Circuito">Circuito</option>
              <option value="Tomada e Circuito">Tomada e Circuito</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Seção Condições Gerais de Fornecimento */}
      <Card>
        <CardHeader className="bg-gray-700 text-white py-2">
          <CardTitle className="text-sm font-bold">CONDIÇÕES GERAIS DE FORNECIMENTO</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div>
            <Label htmlFor="monitoring">Monitoração</Label>
            <Input
              id="monitoring"
              name="monitoring"
              value={formData.monitoring}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="installation_activation">Instalação e Ativação</Label>
            <Input
              id="installation_activation"
              name="installation_activation"
              value={formData.installation_activation}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seção Condições Comerciais */}
      <Card>
        <CardHeader className="bg-gray-700 text-white py-2">
          <CardTitle className="text-sm font-bold">CONDIÇÕES COMERCIAIS</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="md:col-span-2">
            <Label htmlFor="payment_terms">Condições de Pagamento</Label>
            <Input
              id="payment_terms"
              name="payment_terms"
              value={formData.payment_terms}
              onChange={handleChange}
              placeholder="Ex: 10 X CARTÃO S/J OU -10% DINHEIRO, TRANSFERÊNCIA BANCÁRIA"
            />
          </div>
          <div>
            <Label htmlFor="delivery_time">Prazo de Fab. / Entrega</Label>
            <Input
              id="delivery_time"
              name="delivery_time"
              value={formData.delivery_time}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="warranty">Garantia</Label>
            <Input
              id="warranty"
              name="warranty"
              value={formData.warranty}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="shipping_terms">Frete</Label>
            <Input
              id="shipping_terms"
              name="shipping_terms"
              value={formData.shipping_terms}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="proposal_validity">Validade da Proposta</Label>
            <Input
              id="proposal_validity"
              name="proposal_validity"
              type="date"
              value={formData.proposal_validity}
              onChange={handleChange}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="observations">Observações Adicionais (Opcional)</Label>
            <Input
              id="observations"
              name="observations"
              value={formData.observations}
              onChange={handleChange}
              placeholder="Observações adicionais se necessário"
            />
          </div>
          {formData.status === 'DISPENSADA' && (
            <div className="md:col-span-2">
              <Label htmlFor="motivo" className="text-red-600 font-semibold">Motivo da Dispensa *</Label>
              <textarea
                id="motivo"
                name="motivo"
                value={formData.motivo || ''}
                onChange={handleChange}
                placeholder="Informe o motivo pelo qual a proposta foi dispensada..."
                className="w-full border rounded-md p-2 min-h-[80px] mt-1"
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader className="bg-gray-700 text-white py-2">
          <CardTitle className="text-sm font-bold">PRODUTOS</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left text-sm font-bold">Cód. Produto</th>
                  <th className="border p-2 text-left text-sm font-bold">Desc. Produto *</th>
                  <th className="border p-2 text-center text-sm font-bold w-24">Quant.</th>
                  <th className="border p-2 text-right text-sm font-bold w-32">Preço Unid.</th>
                  <th className="border p-2 text-right text-sm font-bold w-32">Total</th>
                  <th className="border p-2 text-center text-sm font-bold w-12"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border p-2">
                      <Input
                        value={item.product_code}
                        onChange={(e) => handleItemChange(index, 'product_code', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="border p-2">
                      <Input
                        value={item.product_description}
                        onChange={(e) => handleItemChange(index, 'product_description', e.target.value)}
                        className={`h-8 text-sm ${errors[`item_${index}_description`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`item_${index}_description`] && (
                        <p className="text-xs text-red-500 mt-1">{errors[`item_${index}_description`]}</p>
                      )}
                    </td>
                    <td className="border p-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="h-8 text-sm text-center"
                      />
                    </td>
                    <td className="border p-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        className="h-8 text-sm text-right"
                      />
                    </td>
                    <td className="border p-2 text-right font-medium">
                      {formatCurrency(item.total_price)}
                    </td>
                    <td className="border p-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" className="border p-2 text-right font-bold bg-gray-100">
                    Total Geral:
                  </td>
                  <td className="border p-2 text-right font-bold bg-emerald-100 text-emerald-800">
                    {formatCurrency(formData.total_amount)}
                  </td>
                  <td className="border p-2 text-center bg-gray-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addItem}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4 text-emerald-600" />
                    </Button>
                  </td>
                </tr>
              </tfoot>
            </table>
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
          {proposal?.id ? 'Atualizar Proposta' : 'Salvar Proposta'}
        </Button>
      </div>
    </form>
  );
}

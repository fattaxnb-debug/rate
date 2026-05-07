import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { validateCNPJ, validateCPF } from '@/utils/validators.js';
import { toast } from 'sonner';

export default function ClientForm({ client, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'fisica',           // 'fisica' ou 'juridica'
    name: '',
    fantasy_name: '',
    cnpj_cpf: '',
    rg: '',
    ie: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    mobile: '',
    email: '',
    technical_contact: ''
  });

  const [errors, setErrors] = useState({});
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  // Carregar dados existentes
  useEffect(() => {
    if (client) {
      const isJuridica = client.cnpj_cpf?.replace(/[^\d]/g, '').length === 14;
      setFormData({
        type: isJuridica ? 'juridica' : 'fisica',
        name: client.name || '',
        fantasy_name: client.fantasy_name || '',
        cnpj_cpf: client.cnpj_cpf || '',
        rg: client.rg || '',
        ie: client.ie || '',
        address: client.address || '',
        number: client.number || '',
        complement: client.complement || '',
        neighborhood: client.neighborhood || '',
        city: client.city || '',
        state: client.state || '',
        zip_code: client.zip_code || '',
        phone: client.phone || '',
        mobile: client.mobile || '',
        email: client.email || '',
        technical_contact: client.technical_contact || ''
      });
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Formatação automática de CNPJ/CPF
    if (name === 'cnpj_cpf') {
      const cleaned = value.replace(/[^\d]/g, '');
      if (formData.type === 'juridica') {
        formattedValue = cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5').slice(0, 18);
      } else {
        formattedValue = cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
      }
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleTypeChange = (value) => {
    setFormData(prev => ({
      ...prev,
      type: value,
      // Limpa campos específicos ao trocar tipo
      rg: value === 'juridica' ? '' : prev.rg,
      ie: value === 'fisica' ? '' : prev.ie,
      fantasy_name: value === 'fisica' ? '' : prev.fantasy_name,
    }));
    setErrors({});
  };

  // Busca CEP (ViaCEP)
  const fetchAddressByCep = async (cep) => {
    const cleanCep = cep.replace(/[^\d]/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        address: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      }));

      toast.success('Endereço preenchido automaticamente');
    } catch (err) {
      toast.error('Erro ao consultar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  // Busca CNPJ (BrasilAPI)
  const fetchCompanyByCnpj = async (cnpj) => {
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    if (cleanCnpj.length !== 14) return;

    setLoadingCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!res.ok) throw new Error('CNPJ não encontrado');

      const data = await res.json();

      setFormData(prev => ({
        ...prev,
        name: data.razao_social || '',
        fantasy_name: data.nome_fantasia || '',
        address: data.logradouro || '',
        number: data.numero || '',
        complement: data.complemento || '',
        neighborhood: data.bairro || '',
        city: data.municipio || '',
        state: data.uf || '',
        zip_code: data.cep ? data.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : '',
        phone: data.telefone || '',
        email: data.email || '',
      }));

      toast.success('Dados da empresa carregados com sucesso!');
    } catch (err) {
      toast.error('CNPJ inválido ou não encontrado');
    } finally {
      setLoadingCnpj(false);
    }
  };

  // Debounce para CEP e CNPJ
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (formData.zip_code.replace(/[^\d]/g, '').length === 8) {
        fetchAddressByCep(formData.zip_code);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [formData.zip_code]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (formData.type === 'juridica' && formData.cnpj_cpf.replace(/[^\d]/g, '').length === 14) {
        fetchCompanyByCnpj(formData.cnpj_cpf);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [formData.cnpj_cpf, formData.type]);

  const validate = () => {
    const newErrors = {};
    const isJuridica = formData.type === 'juridica';

    if (!formData.name.trim()) newErrors.name = 'Nome/Razão Social é obrigatório';

    if (!formData.cnpj_cpf.trim()) {
      newErrors.cnpj_cpf = 'CNPJ/CPF é obrigatório';
    } else {
      const cleaned = formData.cnpj_cpf.replace(/[^\d]/g, '');
      if (isJuridica) {
        if (cleaned.length !== 14 || !validateCNPJ(cleaned)) newErrors.cnpj_cpf = 'CNPJ inválido';
      } else {
        if (cleaned.length !== 11 || !validateCPF(cleaned)) newErrors.cnpj_cpf = 'CPF inválido';
      }
    }

    if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
    if (!formData.number.trim()) newErrors.number = 'Número é obrigatório';
    if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    // Aqui você pode remover ou manter o campo 'type' conforme sua model no backend
    const payload = { ...formData };
    await onSave(payload);
  };

  const isJuridica = formData.type === 'juridica';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Tipo de Pessoa */}
        <div className="md:col-span-2">
          <Label>Tipo de Pessoa *</Label>
          <Select value={formData.type} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fisica">Pessoa Física</SelectItem>
              <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Nome / Razão Social */}
        <div>
          <Label htmlFor="name">Nome / Razão Social *</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} className={errors.name ? 'border-destructive' : ''} />
          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
        </div>

        {/* Nome Fantasia (só PJ) */}
        {isJuridica && (
          <div>
            <Label htmlFor="fantasy_name">Nome Fantasia</Label>
            <Input id="fantasy_name" name="fantasy_name" value={formData.fantasy_name} onChange={handleChange} />
          </div>
        )}

        {/* CNPJ / CPF */}
        <div>
          <Label htmlFor="cnpj_cpf">{isJuridica ? 'CNPJ' : 'CPF'} *</Label>
          <Input
            id="cnpj_cpf"
            name="cnpj_cpf"
            value={formData.cnpj_cpf}
            onChange={handleChange}
            placeholder={isJuridica ? "00.000.000/0000-00" : "000.000.000-00"}
            className={errors.cnpj_cpf ? 'border-destructive' : ''}
            disabled={loadingCnpj}
          />
          {errors.cnpj_cpf && <p className="text-sm text-destructive mt-1">{errors.cnpj_cpf}</p>}
          {loadingCnpj && <p className="text-sm text-muted-foreground mt-1">Buscando dados da empresa...</p>}
        </div>

        {/* RG (só PF) */}
        {!isJuridica && (
          <div>
            <Label htmlFor="rg">RG</Label>
            <Input id="rg" name="rg" value={formData.rg} onChange={handleChange} />
          </div>
        )}

        {/* IE (só PJ) */}
        {isJuridica && (
          <div>
            <Label htmlFor="ie">Inscrição Estadual</Label>
            <Input id="ie" name="ie" value={formData.ie} onChange={handleChange} />
          </div>
        )}

        {/* Endereço */}
        <div className="md:col-span-2">
          <Label htmlFor="address">Endereço *</Label>
          <Input id="address" name="address" value={formData.address} onChange={handleChange} className={errors.address ? 'border-destructive' : ''} />
          {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="number">Número *</Label>
            <Input id="number" name="number" value={formData.number} onChange={handleChange} className={errors.number ? 'border-destructive' : ''} />
            {errors.number && <p className="text-sm text-destructive mt-1">{errors.number}</p>}
          </div>
          <div>
            <Label htmlFor="complement">Complemento</Label>
            <Input id="complement" name="complement" value={formData.complement} onChange={handleChange} />
          </div>
        </div>

        <div>
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="city">Cidade *</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleChange} className={errors.city ? 'border-destructive' : ''} />
          {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="state">Estado *</Label>
            <Input id="state" name="state" value={formData.state} onChange={handleChange} maxLength={2} className={errors.state ? 'border-destructive' : ''} />
            {errors.state && <p className="text-sm text-destructive mt-1">{errors.state}</p>}
          </div>
          <div>
            <Label htmlFor="zip_code">CEP {loadingCep && '(buscando...)'}</Label>
            <Input
              id="zip_code"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleChange}
              placeholder="00000-000"
            />
          </div>
        </div>

        {/* Telefones, Email e Contato Técnico */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="mobile">Celular</Label>
            <Input id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} />
          </div>
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="technical_contact">Contato Técnico</Label>
          <Input id="technical_contact" name="technical_contact" value={formData.technical_contact} onChange={handleChange} />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loadingCep || loadingCnpj}>
          {loadingCep || loadingCnpj ? 'Buscando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
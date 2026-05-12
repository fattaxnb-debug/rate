# MAPEAMENTO COMPLETO DE CAMPOS DO RELATÓRIO

## FLUXO DE DADOS
Frontend (ReportEditor) → Backend (PUT) → Banco de Dados → Backend (GET) → Frontend (ReportEditor/ReportViewer)

---

## 1. CAMPOS DO FRONTEND (ReportEditor.jsx)

### FormData Inicial (linhas 48-99)
```javascript
{
  // Campos básicos
  client_id: '',
  equipment_id: '',
  technician_id: '',
  schedule_id: '',
  service_order_number: '',
  service_type: '',
  responsible_person: '',
  
  // Infraestrutura
  installation_location: '',
  installation_location_explanation: '',
  power_supply_type: '',
  breaker: '',
  
  // Cabos
  cable_entry_phase: '',
  cable_entry_neutral: '',
  cable_entry_ground: '',
  cable_exit_phase: '',
  cable_exit_neutral: '',
  
  // Bateria externa
  external_battery_positive_cable: '',
  external_battery_negative_cable: '',
  external_battery_neutral_cable: '',
  external_battery_connection: '',
  external_battery_nobreak_connection: '',
  
  // Inspeções
  external_inspection: '',
  internal_inspection: '',
  
  // Descrição técnica
  attendance_description: '',
  diagnosis: '',
  conclusion: '',
  cooled_environment: '',
  
  // Medições elétricas (JSON)
  electrical_measurements: { entrada: { tensions: {}, currents: {} }, saida: { tensions: {}, currents: {} } },
  
  // Banco de baterias (JSON)
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
  
  // Assinaturas
  technician_signature: '',
  client_signature: '',
  technician_edit_count: 0
}
```

---

## 2. CAMPOS ENVIADOS NO PAYLOAD (handleSave - linha 441-448)

```javascript
const payload = {
  ...existingReport,  // Todos os campos existentes
  ...formData,        // Sobrescreve com formData
  status: finalStatus,
  technician_edit_count: editCount,
  technician_signature: techSignatureToSave,
  client_signature: clientSignatureToSave
};
```

**Campos que podem estar faltando no payload:**
- `reported_problems`
- `identified_defects`
- `procedures_performed`
- `replaced_parts`
- `parts_request`
- `observations`

---

## 3. CAMPOS SALVOS NO BACKEND (PUT /reports/:id - linhas 124-159)

```javascript
const { 
  client_id, 
  equipment_id, 
  technician_id, 
  client_signature,
  technician_signature,
  status,
  service_type,
  cooled_environment,
  installation_location,
  installation_location_explanation,
  power_supply_type,
  breaker,
  cable_entry_phase,
  cable_entry_neutral,
  cable_entry_ground,
  cable_exit_phase,
  cable_exit_neutral,
  external_battery_positive_cable,
  external_battery_negative_cable,
  external_battery_neutral_cable,
  external_battery_connection,
  external_battery_nobreak_connection,
  electrical_measurements,
  battery_bank,
  external_inspection,
  internal_inspection,
  attendance_description,
  diagnosis,
  conclusion,
  reported_problems,
  identified_defects,
  procedures_performed,
  replaced_parts,
  parts_request,
  observations,
  responsible_person
} = req.body;
```

**Campos que o backend espera mas o formData NÃO tem:**
- `reported_problems` ❌
- `identified_defects` ❌
- `procedures_performed` ❌
- `replaced_parts` ❌
- `parts_request` ❌
- `observations` ❌

---

## 4. CAMPOS RETORNADOS PELO BACKEND (GET /reports/:id - linhas 50-67)

```javascript
// Parse campos JSON
if (report.electrical_measurements && typeof report.electrical_measurements === 'string') {
  try {
    report.electrical_measurements = JSON.parse(report.electrical_measurements);
  } catch (e) {
    report.electrical_measurements = { entrada: { tensions: {}, currents: {} }, saida: { tensions: {}, currents: {} } };
  }
}

if (report.battery_bank && typeof report.battery_bank === 'string') {
  try {
    report.battery_bank = JSON.parse(report.battery_bank);
  } catch (e) {
    report.battery_bank = {};
  }
}

// Buscar fotos da tabela report_photos
report.photos = photos;
```

---

## 5. CAMPOS CARREGADOS NO FORMDATA (initForm - linhas 152-199)

```javascript
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
```

**Campos que NÃO são carregados no formData:**
- `reported_problems` ❌
- `identified_defects` ❌
- `procedures_performed` ❌
- `replaced_parts` ❌
- `parts_request` ❌
- `observations` ❌

---

## 6. CAMPOS EXIBIDOS NO REPORTVIEWER

### Descrição Técnica (linhas 561-570)
```javascript
{report.reported_problems || ''}  // Campo existe no backend mas não no formData
{report.identified_defects || ''} // Campo existe no backend mas não no formData
{report.procedures_performed || ''} // Campo existe no backend mas não no formData
{report.replaced_parts || ''} // Campo existe no backend mas não no formData
{report.parts_request || ''} // Campo existe no backend mas não no formData
{report.observations || ''} // Campo existe no backend mas não no formData
```

---

## PROBLEMAS IDENTIFICADOS

### 1. Campos faltantes no formData do ReportEditor
O backend espera e salva os seguintes campos, mas o formData do ReportEditor NÃO os tem:
- `reported_problems`
- `identified_defects`
- `procedures_performed`
- `replaced_parts`
- `parts_request`
- `observations`

### 2. Solução necessária
Adicionar esses campos ao formData inicial do ReportEditor e carregá-los no initForm para que sejam salvos e carregados corretamente.

---

## PRÓXIMOS PASSOS
1. Adicionar campos faltantes ao formData inicial do ReportEditor
2. Adicionar campos faltantes ao initForm para carregar do backend
3. Verificar se há campos no backend que não estão sendo usados no frontend
4. Testar o fluxo completo para garantir consistência

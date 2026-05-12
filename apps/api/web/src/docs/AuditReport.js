export const AuditReport = `
# FORM COMPONENTS AUDIT REPORT
Date: 2026-04-09

## 1. ClientForm.jsx
- **Schema Fields**: id, name, cnpj_cpf, ie, address, number, complement, city, state, zip_code, phone, mobile, technical_contact, fantasy_name, neighborhood, rg, email.
- **Frontend State (Before)**: Missing fantasy_name, neighborhood, and rg.
- **Fixes Applied**: 
  - Added 'fantasy_name', 'neighborhood', and 'rg' to the formData initialization.
  - Added corresponding Input fields in the UI.
  - Ensured useEffect properly populates these fields when editing an existing client.

## 2. EquipmentForm.jsx
- **Schema Fields**: id, type, brand, model, serial_number, client_id, installation_date, power_va, voltage_in, voltage_out, voltage_battery, current_battery, battery_type, battery_quantity, current_in, current_out, certification, capacity_ah, symmetric, isolated, signalizers_quantity, ihm, localizadores, communication_cable_type, fixation, quantity.
- **Frontend State (Before)**: installation_date was sometimes failing to display due to raw ISO string formats (e.g., "2026-04-01 00:00:00.000Z") not matching the input type="date" requirement (YYYY-MM-DD).
- **Fixes Applied**: 
  - Implemented safe date parsing: \`const parsedDate = equipment.installation_date ? equipment.installation_date.split(' ')[0].split('T')[0] : '';\`
  - Added console.log inside useEffect to verify the fetched equipment object.
  - Ensured all select dropdowns handle null/undefined by defaulting to \`''\` to maintain controlled component state.

## 3. ScheduleForm.jsx
- **Schema Fields**: id, client_id, equipment_id, date_time, status, technician_id, description.
- **Frontend State (Before)**: date_time slicing was failing if PocketBase returned a space instead of a 'T' in the date string (e.g., "2026-04-01 10:00:00.000Z").
- **Fixes Applied**: 
  - Updated date parsing for datetime-local input: \`schedule.date_time.replace(' ', 'T').slice(0, 16)\`.
  - Verified Combobox mapping for client_id and equipment_id.

## 4. ReportForm.jsx & ReportEditor.jsx
- **Schema Fields**: schedule_id, client_id, equipment_id, technician_id, report_number, service_order_number, attendance_date_time, responsible_person, cooled_environment, installation_location, installation_location_explanation, power_supply_type, breaker, cable_entry_phase, etc.
- **Frontend State (Before)**: ReportForm was missing \`service_order_number\`. ReportEditor's JSON fields (electrical_measurements, battery_bank) could cause UI crashes if the DB returned an empty or partially populated object, as it overwrote the initial state structure.
- **Fixes Applied**: 
  - Added \`service_order_number\` to ReportForm.
  - Added a deep merge in ReportEditor for \`electrical_measurements\` to preserve nested structure (e.g., \`.entrada.tensions.rs\`) even if the DB record is missing those keys.
  - Added console.log inside useEffect to verify the fetched report object.

## Remaining Issues / Patterns Identified
- **Pattern**: PocketBase DateTime strings use spaces instead of 'T' by default (e.g. \`YYYY-MM-DD HH:mm:ss.SSSZ\`). Standard HTML5 date/datetime inputs require 'T' separators or strictly 'YYYY-MM-DD'.
- **Recommendation**: Always sanitize dates coming from PocketBase before feeding them into controlled inputs. Use a utility function for consistency across the application.
- **Pattern**: JSON fields in PocketBase return as-is. If a nested property is expected by the UI but wasn't saved previously, it causes undefined reading errors.
- **Recommendation**: Deep merge incoming JSON records with a default skeleton state structure.
`;
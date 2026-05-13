
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Eye, FileEdit, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { format } from 'date-fns';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/config/api.js';

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [clients, setClients] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const isGerente = currentUser?.role === 'Gerente' || currentUser?.role === 'Admin' || currentUser?.role === 'manager';

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [searchTerm, reports]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('[REPORTS FRONTEND DEBUG] API_BASE_URL:', API_BASE_URL);
      console.log('[REPORTS FRONTEND DEBUG] Token:', token ? 'Present' : 'Missing');
      console.log('[REPORTS FRONTEND DEBUG] Fetching reports from:', `${API_BASE_URL}/reports`);
      
      // Buscar relatórios
      const response = await axios.get(`${API_BASE_URL}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('[REPORTS FRONTEND DEBUG] Response:', response.data);
      const records = response.data.data || [];
      
      // Buscar clientes, equipamentos e técnicos separadamente (sem filtro de role)
      const [clientsRes, equipmentsRes, techniciansRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/clients`, { headers: { 'Authorization': `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/equipments`, { headers: { 'Authorization': `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      setClients(clientsRes.data.data || []);
      setEquipments(equipmentsRes.data.data || []);
      setTechnicians(techniciansRes.data.data || []);
      
      // Enriquecer relatórios com dados de cliente, equipamento e técnico
      const enrichedReports = records.map(report => ({
        ...report,
        client_name: clientsRes.data.data?.find(c => c.id === report.client_id)?.name || 'Cliente Inválido',
        equipment_brand: equipmentsRes.data.data?.find(e => e.id === report.equipment_id)?.brand || '',
        equipment_model: equipmentsRes.data.data?.find(e => e.id === report.equipment_id)?.model || '',
        equipment_power: equipmentsRes.data.data?.find(e => e.id === report.equipment_id)?.power || '',
        equipment_voltage: equipmentsRes.data.data?.find(e => e.id === report.equipment_id)?.voltage_type || '',
        equipment_serial: equipmentsRes.data.data?.find(e => e.id === report.equipment_id)?.serial_number || '',
        technician_name: techniciansRes.data.data?.find(t => t.id === report.technician_id)?.name || '-'
      }));
      
      // Ordenar por data de criação (mais recente primeiro)
      const sortedReports = enrichedReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setReports(sortedReports);
      setFilteredReports(sortedReports);
      setLoading(false);
    } catch (error) {
      console.error('[REPORTS FRONTEND DEBUG] Error fetching reports:', error);
      console.error('[REPORTS FRONTEND DEBUG] Error response:', error.response);
      toast.error('Erro ao carregar relatórios');
      setLoading(false);
    }
  };

  const filterReports = () => {
    if (!searchTerm.trim()) {
      setFilteredReports(reports);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = reports.filter(report => {
      return report.client_name?.toLowerCase().includes(term) ||
             report.technician_name?.toLowerCase().includes(term) ||
             (report.service_order_number && report.service_order_number.toLowerCase().includes(term)) ||
             (report.equipment_brand && report.equipment_brand.toLowerCase().includes(term)) ||
             (report.equipment_model && report.equipment_model.toLowerCase().includes(term)) ||
             (report.equipment_serial && report.equipment_serial.toLowerCase().includes(term));
    });
    setFilteredReports(filtered);
  };

  const deleteReport = async () => {
  if (!reportToDelete) return;

  try {
    const token = localStorage.getItem('auth_token');
    await axios.delete(`${API_BASE_URL}/reports/${reportToDelete.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    toast.success('Relatório excluído com sucesso');
    setDeleteDialogOpen(false);
    setReportToDelete(null);

    // Atualiza a lista
    fetchReports();
  } catch (error) {
    console.error(error);
    toast.error('Erro ao excluir relatório: ' + (error.message || 'Falha desconhecida'));
  }
};

  const isUserResponsible = (report) => {
    return report.technician_id === currentUser?.id;
  };

  const getEquipmentCount = (report) => {
    // A API do backend pode retornar equipamentos de forma diferente
    if (report.equipment_reports && Array.isArray(report.equipment_reports)) {
      return report.equipment_reports.length;
    }
    return report.equipment_id ? 1 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Relatórios - FATTAX</title>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ letterSpacing: '-0.02em' }}>Relatórios</h1>
              <p className="text-muted-foreground">Gerenciamento de relatórios técnicos</p>
            </div>
            {currentUser?.role !== 'Técnico' && (
            <Link to="/reports/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Relatório
              </Button>
            </Link>
            )}
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, O.S., equipamento ou técnico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="hidden md:block bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-100 to-gray-200">
                <TableRow>
                  <TableHead className="font-bold text-gray-900">O.S.</TableHead>
                  <TableHead className="font-bold text-gray-900">Data</TableHead>
                  <TableHead className="font-bold text-gray-900">Cliente</TableHead>
                  <TableHead className="font-bold text-gray-900">Equipamentos</TableHead>
                  <TableHead className="font-bold text-gray-900">Técnico</TableHead>
                  <TableHead className="font-bold text-gray-900">Status</TableHead>
                  <TableHead className="text-right font-bold text-gray-900">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-6xl mb-4">📄</div>
                        <p className="text-lg font-semibold">Nenhum relatório encontrado</p>
                        <p className="text-sm">Tente ajustar os filtros de busca</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => {
                    const eqCount = getEquipmentCount(report);
                    const isResponsible = isUserResponsible(report);

                    return (
                      <TableRow key={report.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                        <TableCell className="font-semibold text-primary">
                          {report.service_order_number || '-'}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {report.created_date ? format(new Date(report.created_date), 'dd/MM/yyyy') : 
                           report.created_at ? format(new Date(report.created_at), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {report.client_name || 'Cliente Inválido'}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {report.equipment_brand && report.equipment_model ? (
                            <div className="text-sm">
                              <div className="font-medium">{report.equipment_brand} - {report.equipment_model}</div>
                              {report.equipment_power && <div className="text-muted-foreground">{report.equipment_power}</div>}
                              {report.equipment_serial && <div className="text-muted-foreground">S/N: {report.equipment_serial}</div>}
                            </div>
                          ) : (
                            <Badge variant="secondary" className="font-normal">
                              1 equipamento
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-700">{report.technician_name || '-'}</TableCell>
                        <TableCell>
                          {report.status === 'finalizado' ? (
                            <Badge className="bg-green-500 hover:bg-green-600">Finalizado</Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/reports/${report.id}`)}
                              title="Visualizar"
                              className="bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {isGerente ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/reports/${report.id}/edit`)}
                                title="Editar"
                                className="bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            ) : isResponsible && report.status === 'draft' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/reports/${report.id}/edit`)}
                                title="Preencher"
                                className="bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                              >
                                <FileEdit className="h-4 w-4" />
                              </Button>
                            ) : null}

                            {isGerente && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setReportToDelete(report); setDeleteDialogOpen(true); }}
                                title="Excluir"
                                className="bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4 md:hidden">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {currentUser?.role !== 'Técnico' && (
                <Link to="/reports/new">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Relatório
                  </Button>
                </Link>
              )}
            </div>
            
            {filteredReports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-lg font-semibold">Nenhum relatório encontrado</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              (searchTerm ? filteredReports : filteredReports.slice(0, 5)).map((report) => {
                const isResponsible = isUserResponsible(report);
                return (
                  <div key={report.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate text-base">
                            {report.service_order_number || 'Sem O.S.'}
                          </h3>
                          <div className="text-sm text-gray-600 mt-2 space-y-1">
                            <div className="flex items-center">
                              <span className="font-semibold text-blue-600 w-20">Cliente:</span>
                              <span className="text-gray-900">{report.client_name || '-'}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-semibold text-blue-600 w-20">Status:</span>
                              <span className="text-gray-900">
                                {report.status === 'finalizado' ? (
                                  <Badge className="bg-green-500">Finalizado</Badge>
                                ) : (
                                  <Badge variant="secondary">Pendente</Badge>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/reports/${report.id}`)}
                            title="Visualizar"
                            className="bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                          {(isGerente || isResponsible) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/reports/${report.id}/edit`)}
                              title="Editar"
                              className="bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                              <Pencil className="h-5 w-5" />
                            </Button>
                          )}
                          {isGerente && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setReportToDelete(report); setDeleteDialogOpen(true); }}
                              title="Excluir"
                              className="bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        <Footer />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este relatório? Todas as fotos anexadas também serão deletadas. Esta ação não pode ser desfeita.
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

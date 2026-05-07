
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Eye, FileEdit } from 'lucide-react';
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

  const isGerente = currentUser?.role === 'Gerente';

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [searchTerm, reports]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const records = response.data.data || [];
      setReports(records);
      setFilteredReports(records);
      setLoading(false);
    } catch (error) {
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
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ letterSpacing: '-0.02em' }}>Relatórios</h1>
              <p className="text-muted-foreground">Gerenciamento de relatórios técnicos</p>
            </div>
            <Link to="/reports/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Relatório
              </Button>
            </Link>
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

          <div className="bg-card rounded-lg border overflow-x-auto shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>O.S.</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Equipamentos</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhum relatório encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => {
                    const eqCount = getEquipmentCount(report);
                    const isResponsible = isUserResponsible(report);

                    return (
                      <TableRow key={report.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-primary">
                          {report.service_order_number || '-'}
                        </TableCell>
                        <TableCell>
                          {report.created ? format(new Date(report.created), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {report.client_name || 'Cliente Inválido'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {eqCount} equipamento{eqCount !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.technician_name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/reports/${report.id}`)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>

                            {isGerente ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/reports/${report.id}/edit`)}
                                className="font-medium"
                              >
                                <Pencil className="mr-1 h-3 w-3" />
                                EDITAR
                              </Button>
                            ) : isResponsible && report.status === 'draft' ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => navigate(`/reports/${report.id}/edit`)}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-medium"
                              >
                                <FileEdit className="mr-1 h-3 w-3" />
                                PREENCHER
                              </Button>
                            ) : null}

                            {isGerente && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setReportToDelete(report); setDeleteDialogOpen(true); }}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4 text-destructive hover:text-destructive" />
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

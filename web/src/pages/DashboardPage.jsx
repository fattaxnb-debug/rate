

import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';

import { Helmet } from 'react-helmet';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Users, Wrench, Calendar, FileText, Plus, ShoppingCart } from 'lucide-react';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import axios from 'axios';

import { useAuth } from '@/contexts/AuthContext.jsx';

import Header from '@/components/Header.jsx';

import Footer from '@/components/Footer.jsx';

import { Skeleton } from '@/components/ui/skeleton';

import { API_BASE_URL } from '@/config/api.js';



export default function DashboardPage() {

  const { currentUser } = useAuth();

  const [stats, setStats] = useState({

    clients: 0,

    equipments: 0,

    schedules: 0,

    reports: 0,

    myReports: 0,

    allReports: 0

  });

  const [proposals, setProposals] = useState({
    abertas: 0,
    fechadas: 0,
    dispensadas: 0,
    total: 0
  });

  const [schedules, setSchedules] = useState({
    abertos: 0,
    atendendo: 0,
    concluidos: 0,
    finalizados: 0,
    total: 0
  });

  const [proposalsChart, setProposalsChart] = useState([]);

  const [schedulesByStatus, setSchedulesByStatus] = useState([]);

  const [todaySchedules, setTodaySchedules] = useState([]);

  const [loading, setLoading] = useState(true);



  const isGerente = currentUser?.role === 'Gerente' || currentUser?.role === 'Admin' || currentUser?.role === 'manager';



  useEffect(() => {

    fetchStats();

  }, [currentUser]);



  const fetchStats = async () => {

    try {

      const token = localStorage.getItem('auth_token');



      // Fetch stats from backend API

      const [clientsRes, equipmentsRes, schedulesRes, reportsRes, proposalsRes] = await Promise.all([

        axios.get(`${API_BASE_URL}/clients`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),

        axios.get(`${API_BASE_URL}/equipments`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),

        axios.get(`${API_BASE_URL}/schedules`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),

        axios.get(`${API_BASE_URL}/reports`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),

        axios.get(`${API_BASE_URL}/proposals`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ data: { data: [] } }))

      ]);



      const clients = clientsRes.data.data || [];

      const equipments = equipmentsRes.data.data || [];

      const schedules = schedulesRes.data.data || [];

      const reports = reportsRes.data.data || [];

      const proposals = proposalsRes.data.data || [];

      // Get upcoming schedules for desktop panel (próximos 5, a partir de hoje)
      const nowLocal = new Date();
      const todayLocal = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth()+1).padStart(2,'0')}-${String(nowLocal.getDate()).padStart(2,'0')}`;
      const upcomingSchedulesList = schedules
        .filter(s => s.scheduled_date >= todayLocal)
        .sort((a, b) => {
          const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time || '00:00'}`);
          const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time || '00:00'}`);
          return dateA - dateB;
        })
        .slice(0, 5);

      setTodaySchedules(upcomingSchedulesList);

      // Count proposals by status
      const abertas = proposals.filter(p => (p.status || 'ABERTA') === 'ABERTA').length;
      const fechadas = proposals.filter(p => p.status === 'FECHADA').length;
      const dispensadas = proposals.filter(p => p.status === 'DISPENSADA').length;

      // Count schedules by status (same filter as SchedulesPage)
      const abertos = schedules.filter(s => s.status?.toUpperCase() === 'ABERTO').length;
      const atendendo = schedules.filter(s => s.status?.toUpperCase() === 'EM ANDAMENTO').length;
      const concluidos = schedules.filter(s => s.status?.toUpperCase() === 'REALIZADO').length;
      const finalizados = schedules.filter(s => s.status?.toUpperCase() === 'FINALIZADO').length;



      // Filter reports by technician if not gerente

      const myReports = isGerente ? reports : reports.filter(r => r.technician_id === currentUser?.id);

      const filteredReports = isGerente ? reports : myReports;

      // Para gerente: contar todos os relatórios PENDENTE de qualquer usuário; para técnico: só os seus
      const pendingReports = isGerente
        ? reports.filter(r => (r.status || 'PENDENTE').toUpperCase() === 'PENDENTE')
        : filteredReports.filter(r => (r.status || 'PENDENTE').toUpperCase() === 'PENDENTE');



      setStats({

        clients: clients.length,

        equipments: equipments.length,

        schedules: schedules.length,

        reports: pendingReports.length,

        myReports: myReports.length,

        allReports: reports.length

      });

      setProposals({
        abertas,
        fechadas,
        dispensadas,
        total: proposals.length
      });

      setSchedules({
        abertos,
        atendendo,
        concluidos,
        finalizados,
        total: schedules.length
      });

      // Prepare proposals chart data
      setProposalsChart([
        { name: 'Abertas', value: abertas, color: '#3b82f6' },
        { name: 'Fechadas', value: fechadas, color: '#10b981' },
        { name: 'Dispensadas', value: dispensadas, color: '#f59e0b' }
      ]);



      // Process schedule status chart data

      const statusCounts = {

        'Aberto': 0,

        'Em Andamento': 0,

        'Realizado': 0,

        'Finalizado': 0

      };



      const byStatus = schedulesRes.data.data?.byStatus || [];

      byStatus.forEach(item => {

        if (statusCounts.hasOwnProperty(item.status)) {

          statusCounts[item.status] = item.count;

        }

      });



      const chartData = Object.entries(statusCounts).map(([status, count]) => ({

        status,

        count

      }));



      setSchedulesByStatus(chartData);

      setLoading(false);

    } catch (error) {

      console.error('Error fetching stats:', error);

      setLoading(false);

    }

  };



  if (loading) {

    return (

      <div className="min-h-screen flex flex-col">

        <Header />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">

            {[1, 2, 3, 4, 5].map(i => (

              <Card key={i} className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-0 shadow-xl">

                <CardHeader className="flex flex-row items-center justify-between pb-3">

                  <Skeleton className="h-4 w-28" />

                  <Skeleton className="h-8 w-8 rounded-lg" />

                </CardHeader>

                <CardContent>

                  <Skeleton className="h-10 w-20" />

                </CardContent>

              </Card>

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

        <title>Dashboard - FATTAX</title>

        <meta name="description" content="Painel de controle do sistema FATTAX com visão geral de clientes, equipamentos, agendamentos e relatórios" />

      </Helmet>



      <div className="min-h-screen flex flex-col">

        <Header />



        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">

          <div className="mb-8">

            <h1 className="text-3xl font-bold mb-2" style={{ letterSpacing: '-0.02em' }}>

              Olá, {currentUser?.name}

            </h1>

            <p className="text-muted-foreground">

              {isGerente ? 'Visão geral de todo o sistema' : 'Visão geral das suas atividades'}

            </p>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">

            <Link to="/clients">
              <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 border-0 shadow-xl cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold text-white/90">Total de Clientes</CardTitle>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-bold text-white">{stats.clients}</div>
                    <div className="text-xs text-white/70">cadastrados</div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/equipments">
              <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 border-0 shadow-xl cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold text-white/90">Total de Equipamentos</CardTitle>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Wrench className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-bold text-white">{stats.equipments}</div>
                    <div className="text-xs text-white/70">registrados</div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/schedules">
              <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 border-0 shadow-xl cursor-pointer min-h-[140px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3">
                  <CardTitle className="text-base font-semibold text-white">
                    {isGerente ? 'Agendamentos' : 'Meus Agendamentos'}
                  </CardTitle>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-baseline gap-2 mb-3">
                    <div className="text-5xl font-bold text-white">{schedules.total}</div>
                    <div className="text-sm text-white/80 font-medium">total</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex flex-col items-center bg-white/15 rounded-lg px-2 py-2">
                      <span className="text-2xl font-bold text-white">{schedules.abertos}</span>
                      <span className="text-xs text-white/90 font-medium whitespace-nowrap">abertos</span>
                    </div>
                    <div className="flex flex-col items-center bg-white/15 rounded-lg px-2 py-2">
                      <span className="text-2xl font-bold text-white">{schedules.atendendo}</span>
                      <span className="text-xs text-white/90 font-medium whitespace-nowrap">atendendo</span>
                    </div>
                    <div className="flex flex-col items-center bg-white/15 rounded-lg px-2 py-2">
                      <span className="text-2xl font-bold text-white">{schedules.concluidos}</span>
                      <span className="text-xs text-white/90 font-medium whitespace-nowrap">concluídos</span>
                    </div>
                    <div className="flex flex-col items-center bg-white/15 rounded-lg px-2 py-2">
                      <span className="text-2xl font-bold text-white">{schedules.finalizados}</span>
                      <span className="text-xs text-white/90 font-medium whitespace-nowrap">finalizados</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/reports">
              <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 border-0 shadow-xl cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold text-white/90">
                    {isGerente ? 'Relatórios Pendentes' : 'Meus Relatórios'}
                  </CardTitle>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-bold text-white">{stats.reports}</div>
                    <div className="text-xs text-white/70">pendentes</div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/proposals">
              <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 border-0 shadow-xl cursor-pointer min-h-[140px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3">
                  <CardTitle className="text-base font-semibold text-white">Propostas</CardTitle>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-baseline gap-2 mb-3">
                    <div className="text-5xl font-bold text-white">{proposals.total}</div>
                    <div className="text-sm text-white/80 font-medium">total</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center bg-white/15 rounded-lg px-2 py-2">
                      <span className="text-2xl font-bold text-white">{proposals.abertas}</span>
                      <span className="text-xs text-white/90 font-medium whitespace-nowrap">abertas</span>
                    </div>
                    <div className="flex flex-col items-center bg-white/15 rounded-lg px-2 py-2">
                      <span className="text-2xl font-bold text-white">{proposals.fechadas}</span>
                      <span className="text-xs text-white/90 font-medium whitespace-nowrap">fechadas</span>
                    </div>
                    <div className="flex flex-col items-center bg-white/15 rounded-lg px-2 py-2">
                      <span className="text-2xl font-bold text-white">{proposals.dispensadas}</span>
                      <span className="text-xs text-white/90 font-medium whitespace-nowrap">dispensadas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-white/90">
                  Total de Relatórios
                </CardTitle>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-bold text-white">{stats.allReports}</div>
                  <div className="text-xs text-white/70">total</div>
                </div>
              </CardContent>
            </Card>

          </div>



          {/* Desktop: Layout profissional com painel Hoje e gráficos */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 mb-8">
            {/* Painel Hoje - Próximos Agendamentos */}
            <Card className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Próximos Agendamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaySchedules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum agendamento para hoje</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaySchedules.map(schedule => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{schedule.client_name}</p>
                            <p className="text-sm text-gray-500">
                              {(() => {
                                if (!schedule.scheduled_date) return '--/--/----';
                                const [y, m, d] = schedule.scheduled_date.split('-');
                                return `${d}/${m}/${y} ${schedule.scheduled_time || '--:--'}`;
                              })()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            schedule.status === 'Aberto' ? 'bg-green-100 text-green-700' :
                            schedule.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700' :
                            schedule.status === 'Realizado' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {schedule.status || 'Aberto'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo do Dia */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  Resumo do Dia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Próximos Agendamentos</p>
                  <p className="text-3xl font-bold text-blue-600">{todaySchedules.length}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Relatórios Pendentes</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.reports}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Propostas Abertas</p>
                  <p className="text-3xl font-bold text-emerald-600">{proposals.abertas}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop: Gráficos */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de Propostas */}
            <Card className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-pink-600" />
                  Propostas por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={proposalsChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {proposalsChart.map((entry, index) => (
                        <rect key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Agendamentos por Status */}
            <Card className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  Agendamentos por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={schedulesByStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Mobile: Ações Rápidas (mantido igual) */}
          <div className="lg:hidden grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            <Card>

              <CardHeader>

                <CardTitle>Ações Rápidas</CardTitle>

              </CardHeader>

              <CardContent className="space-y-4">

                <Link to="/clients">

                  <Button className="w-full justify-start" variant="outline">

                    <Users className="mr-2 h-4 w-4" />

                    Acessar Clientes

                  </Button>

                </Link>

                <Link to="/equipments">

                  <Button className="w-full justify-start" variant="outline">

                    <Wrench className="mr-2 h-4 w-4" />

                    Acessar Equipamentos

                  </Button>

                </Link>

                <Link to="/schedules">

                  <Button className="w-full justify-start" variant="outline">

                    <Calendar className="mr-2 h-4 w-4" />

                    Acessar Agendamentos

                  </Button>

                </Link>

                {currentUser?.role !== 'Técnico' && currentUser?.role !== 'technician' && (
                <Link to="/reports/new">

                  <Button className="w-full justify-start">

                    <Plus className="mr-2 h-4 w-4" />

                    Novo Relatório

                  </Button>

                </Link>
                )}

              </CardContent>

            </Card>

          </div>

        </main>



        <Footer />

      </div>

    </>

  );

}


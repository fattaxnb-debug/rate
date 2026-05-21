

import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';

import { Helmet } from 'react-helmet';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Users, Wrench, Calendar, FileText, Plus } from 'lucide-react';

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

  const [schedulesByStatus, setSchedulesByStatus] = useState([]);

  const [loading, setLoading] = useState(true);



  const isGerente = currentUser?.role === 'Gerente' || currentUser?.role === 'Admin';



  useEffect(() => {

    fetchStats();

  }, [currentUser]);



  const fetchStats = async () => {

    try {

      const token = localStorage.getItem('auth_token');



      // Fetch stats from backend API

      const [clientsRes, equipmentsRes, schedulesRes, reportsRes] = await Promise.all([

        axios.get(`${API_BASE_URL}/clients`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),

        axios.get(`${API_BASE_URL}/equipments`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),

        axios.get(`${API_BASE_URL}/schedules`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),

        axios.get(`${API_BASE_URL}/reports`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ data: { data: [] } }))

      ]);



      const clients = clientsRes.data.data || [];

      const equipments = equipmentsRes.data.data || [];

      const schedules = schedulesRes.data.data || [];

      const reports = reportsRes.data.data || [];



      // Filter reports by technician if not gerente

      const myReports = isGerente ? reports : reports.filter(r => r.technician_id === currentUser?.id);

      const filteredReports = isGerente ? reports : myReports;

      // Count only pending reports (not completed/finalized)

      const pendingReports = filteredReports.filter(r => r.status !== 'Finalizado' && r.status !== 'Concluído' && r.status !== 'completed');



      setStats({

        clients: clients.length,

        equipments: equipments.length,

        schedules: schedules.length,

        reports: pendingReports.length,

        myReports: myReports.length,

        allReports: reports.length

      });



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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">

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



          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">

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
              <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 border-0 shadow-xl cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold text-white/90">
                    {isGerente ? 'Total de Agendamentos' : 'Meus Agendamentos'}
                  </CardTitle>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-bold text-white">{stats.schedules}</div>
                    <div className="text-xs text-white/70">agendados</div>
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



          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

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

                {currentUser?.role !== 'Técnico' && (
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


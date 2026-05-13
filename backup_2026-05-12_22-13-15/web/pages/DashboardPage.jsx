

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



  const isGerente = currentUser?.role === 'manager' || currentUser?.role === 'Gerente';



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

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">

            {[1, 2, 3, 4, 5].map(i => (

              <Card key={i}>

                <CardHeader>

                  <Skeleton className="h-4 w-24" />

                </CardHeader>

                <CardContent>

                  <Skeleton className="h-8 w-16" />

                </CardContent>

              </Card>

            ))}

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">

            <Card>

              <CardHeader>

                <Skeleton className="h-4 w-32" />

              </CardHeader>

              <CardContent>

                <Skeleton className="h-8 w-16" />

              </CardContent>

            </Card>

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



        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="mb-8">

            <h1 className="text-3xl font-bold mb-2" style={{ letterSpacing: '-0.02em' }}>

              Olá, {currentUser?.name}

            </h1>

            <p className="text-muted-foreground">

              {isGerente ? 'Visão geral de todo o sistema' : 'Visão geral das suas atividades'}

            </p>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">

            <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">

              <CardHeader className="flex flex-row items-center justify-between pb-2">

                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total de Clientes</CardTitle>

                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />

              </CardHeader>

              <CardContent>

                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.clients}</div>

              </CardContent>

            </Card>



            <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">

              <CardHeader className="flex flex-row items-center justify-between pb-2">

                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total de Equipamentos</CardTitle>

                <Wrench className="h-4 w-4 text-purple-600 dark:text-purple-400" />

              </CardHeader>

              <CardContent>

                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.equipments}</div>

              </CardContent>

            </Card>



            <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">

              <CardHeader className="flex flex-row items-center justify-between pb-2">

                <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">

                  {isGerente ? 'Total de Agendamentos' : 'Meus Agendamentos'}

                </CardTitle>

                <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />

              </CardHeader>

              <CardContent>

                <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.schedules}</div>

              </CardContent>

            </Card>



            <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">

              <CardHeader className="flex flex-row items-center justify-between pb-2">

                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">

                  {isGerente ? 'Total de Relatórios (Geral)' : 'Meus Relatórios'}

                </CardTitle>

                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />

              </CardHeader>

              <CardContent>

                <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.reports}</div>

              </CardContent>

            </Card>



            <Card className="hover:shadow-lg transition-all duration-200 border-primary/20">

              <CardHeader className="flex flex-row items-center justify-between pb-2">

                <CardTitle className="text-sm font-medium text-primary">

                  Total de Relatórios

                </CardTitle>

                <FileText className="h-4 w-4 text-primary" />

              </CardHeader>

              <CardContent>

                <div className="text-3xl font-bold text-primary">{stats.myReports}</div>

              </CardContent>

            </Card>

          </div>



          {/* Second row for the new general reports card */}

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">

            <Card className="hover:shadow-lg transition-all duration-200">

              <CardHeader className="flex flex-row items-center justify-between pb-2">

                <CardTitle className="text-sm font-medium text-muted-foreground">

                  Total de Relatórios (Geral)

                </CardTitle>

                <FileText className="h-4 w-4 text-muted-foreground" />

              </CardHeader>

              <CardContent>

                <div className="text-3xl font-bold">{stats.allReports}</div>

              </CardContent>

            </Card>

          </div>



          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            <Card>

              <CardHeader>

                <CardTitle>Agendamentos por Status</CardTitle>

              </CardHeader>

              <CardContent>

                <ResponsiveContainer width="100%" height={300}>

                  <BarChart data={schedulesByStatus}>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />

                    <XAxis dataKey="status" axisLine={false} tickLine={false} />

                    <YAxis axisLine={false} tickLine={false} />

                    <Tooltip 

                      cursor={{fill: 'hsl(var(--muted))'}}

                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}

                    />

                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />

                  </BarChart>

                </ResponsiveContainer>

              </CardContent>

            </Card>



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


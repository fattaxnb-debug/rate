import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Zap, Shield, FileText, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

export default function HomePage() {
  const { isAuthenticated, initialLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, initialLoading, navigate]);

  if (initialLoading) return null;

  return (
    <>
      <Helmet>
        <title>FATTAX - Soluções em Energia e Manutenção de Equipamentos Elétricos</title>
        <meta name="description" content="FATTAX oferece soluções completas em manutenção de equipamentos elétricos, nobreaks, estabilizadores e transformadores com relatórios técnicos profissionais" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <section className="relative min-h-[90dvh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1662079040393-ba2e48d38918"
              alt="Electrical equipment and power systems"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight text-balance" style={{ letterSpacing: '-0.02em' }}>
                Soluções profissionais em energia e manutenção elétrica
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-prose">
                Gestão completa de equipamentos elétricos com relatórios técnicos detalhados, agendamentos e controle de manutenção preventiva e corretiva.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/login">
                  <Button size="lg" className="text-lg px-8 py-6">
                    Acessar sistema
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white">
                    Criar conta
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance" style={{ letterSpacing: '-0.02em' }}>
                Sobre a FATTAX
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Especializada em manutenção e gestão de equipamentos elétricos, oferecemos soluções completas para empresas que buscam confiabilidade e eficiência energética.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-4 rounded-2xl">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Equipamentos especializados</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Manutenção de nobreaks, estabilizadores, transformadores, IT médico e monitores de bateria.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-4 rounded-2xl">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Relatórios técnicos completos</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Documentação detalhada com medições elétricas, inspeções e diagnósticos profissionais.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-4 rounded-2xl">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Gestão de agendamentos</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Controle total de manutenções preventivas e corretivas com equipe técnica especializada.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-4 rounded-2xl">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Controle de clientes</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Cadastro completo de clientes e equipamentos com histórico de atendimentos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-3xl p-8 md:p-12 border border-border/50 shadow-sm">
                <h3 className="text-2xl font-bold mb-8">Principais funcionalidades</h3>
                <ul className="space-y-5">
                  <li className="flex items-center space-x-4">
                    <div className="h-2.5 w-2.5 bg-primary rounded-full"></div>
                    <span className="font-medium">Cadastro de clientes e equipamentos</span>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="h-2.5 w-2.5 bg-primary rounded-full"></div>
                    <span className="font-medium">Agendamento de manutenções</span>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="h-2.5 w-2.5 bg-primary rounded-full"></div>
                    <span className="font-medium">Relatórios técnicos com fotos e assinaturas</span>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="h-2.5 w-2.5 bg-primary rounded-full"></div>
                    <span className="font-medium">Medições elétricas detalhadas</span>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="h-2.5 w-2.5 bg-primary rounded-full"></div>
                    <span className="font-medium">Controle de banco de baterias</span>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="h-2.5 w-2.5 bg-primary rounded-full"></div>
                    <span className="font-medium">Geração de PDF profissional</span>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="h-2.5 w-2.5 bg-primary rounded-full"></div>
                    <span className="font-medium">Controle de acesso por função</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance" style={{ letterSpacing: '-0.02em' }}>
              Pronto para começar?
            </h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed opacity-90">
              Acesse o sistema e comece a gerenciar seus equipamentos e relatórios técnicos de forma profissional.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/login">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  Fazer login
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground">
                  Criar conta
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
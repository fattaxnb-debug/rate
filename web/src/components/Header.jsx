import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Menu, X, LogOut, User, Settings, LayoutDashboard, Users, Wrench, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { API_BASE_URL } from '@/config/api.js';
import axios from 'axios';

export default function Header() {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      fetchSettings();
    }
  }, [isAuthenticated, currentUser]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/settings/user/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSettings(response.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    setLogoutDialogOpen(false);
    logout();
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/clients', label: 'Clientes', icon: Users },
    { path: '/equipments', label: 'Equipamentos', icon: Wrench },
    { path: '/schedules', label: 'Agendamentos', icon: Calendar },
    { path: '/reports', label: 'Relatórios', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            {settings?.company_logo ? (
              <img 
                src={`${API_BASE_URL}/uploads/${settings.company_logo}`} 
                alt="Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  console.error('Error loading logo');
                  e.target.style.display = 'none';
                  const textSpan = e.target.parentElement.querySelector('span');
                  if (textSpan) textSpan.style.display = 'block';
                }}
              />
            ) : null}
            <span className="text-2xl font-bold text-primary" style={{ letterSpacing: '-0.02em', display: settings?.company_logo ? 'none' : 'block' }}>FATTAX</span>
          </Link>

          {isAuthenticated && (
            <>
              <nav className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        isActive(link.path)
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden md:flex">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{currentUser?.name}</p>
                        <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                        <p className="text-xs text-primary font-semibold mt-1">{currentUser?.role}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer w-full flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)} className="text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 bg-gradient-to-br from-slate-50 to-slate-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileOpen(false)}
                      className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 shadow-md transition-all"
                    >
                      <X className="h-5 w-5 text-slate-600" />
                    </Button>
                    <nav className="flex flex-col space-y-3 mt-8">
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm">{currentUser?.name}</p>
                            <p className="text-white/70 text-xs">{currentUser?.email}</p>
                          </div>
                        </div>
                        <div className="bg-white/20 rounded-lg px-3 py-1.5">
                          <p className="text-white text-xs font-medium">{currentUser?.role}</p>
                        </div>
                      </div>

                      {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                              isActive(link.path)
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-lg'
                                : 'bg-white text-foreground/80 border-slate-200 hover:border-blue-300 hover:shadow-md hover:text-foreground'
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${isActive(link.path) ? 'text-white' : 'text-blue-500'}`} />
                            {link.label}
                          </Link>
                        );
                      })}

                      <div className="pt-4 mt-auto space-y-2">
                        <Link to="/settings" onClick={() => setMobileOpen(false)}>
                          <Button variant="outline" className="w-full justify-start gap-2 bg-white border-slate-200 hover:border-blue-300 hover:shadow-md h-12">
                            <Settings className="h-5 w-5 text-blue-500" />
                            Configurações
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          onClick={() => { setMobileOpen(false); setLogoutDialogOpen(true); }} 
                          className="w-full justify-start gap-2 bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-12"
                        >
                          <LogOut className="h-5 w-5" />
                          Sair
                        </Button>
                      </div>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button>Cadastro</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar saída</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair do sistema?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
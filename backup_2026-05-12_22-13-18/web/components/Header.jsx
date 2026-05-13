import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Menu, X, LogOut, User, Settings } from 'lucide-react';
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
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/clients', label: 'Clientes' },
    { path: '/equipments', label: 'Equipamentos' },
    { path: '/schedules', label: 'Agendamentos' },
    { path: '/reports', label: 'Relatórios' },
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
              />
            ) : (
              <span className="text-2xl font-bold text-primary" style={{ letterSpacing: '-0.02em' }}>FATTAX</span>
            )}
          </Link>

          {isAuthenticated && (
            <>
              <nav className="hidden md:flex items-center space-x-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive(link.path) ? 'text-primary' : 'text-foreground/60'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
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
                  <SheetContent side="right">
                    <nav className="flex flex-col space-y-4 mt-8">
                      {navLinks.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setMobileOpen(false)}
                          className={`text-sm font-medium transition-colors hover:text-primary ${
                            isActive(link.path) ? 'text-primary' : 'text-foreground/60'
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                      <div className="pt-4 border-t mt-auto">
                        <p className="text-sm font-medium mb-1">{currentUser?.name}</p>
                        <p className="text-xs text-muted-foreground mb-1">{currentUser?.email}</p>
                        <p className="text-xs text-primary font-semibold mb-4">{currentUser?.role}</p>
                        <Link to="/settings" onClick={() => setMobileOpen(false)}>
                          <Button variant="outline" className="w-full mb-2">
                            <Settings className="mr-2 h-4 w-4" />
                            Configurações
                          </Button>
                        </Link>
                        <Button variant="outline" onClick={() => { setMobileOpen(false); setLogoutDialogOpen(true); }} className="w-full text-destructive hover:text-destructive">
                          <LogOut className="mr-2 h-4 w-4" />
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
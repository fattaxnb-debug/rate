import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>Página não encontrada - FATTAX</title>
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <AlertTriangle className="h-24 w-24 text-muted-foreground mb-8" />
        <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ letterSpacing: '-0.02em' }}>404</h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">Página não encontrada</h2>
        <p className="text-muted-foreground max-w-md mb-8 text-lg">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link to="/">
          <Button size="lg">Voltar para o início</Button>
        </Link>
      </div>
    </>
  );
}
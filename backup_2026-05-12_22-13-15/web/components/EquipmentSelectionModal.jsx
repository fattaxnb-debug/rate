import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils.js';
import { CheckCircle2, MonitorSmartphone } from 'lucide-react';

export default function EquipmentSelectionModal({ isOpen, onClose, equipments, includedIds, onSelect }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ letterSpacing: '-0.02em' }}>Selecionar Equipamento</DialogTitle>
          <DialogDescription>
            Escolha o próximo equipamento do cliente para incluir no relatório.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {equipments.map(eq => {
              const isIncluded = includedIds.includes(eq.id);
              return (
                <div 
                  key={eq.id}
                  onClick={() => !isIncluded && onSelect(eq)}
                  className={cn(
                    "p-5 border rounded-xl flex flex-col relative transition-all duration-200",
                    isIncluded 
                      ? "opacity-60 bg-muted cursor-not-allowed border-muted-foreground/20" 
                      : "bg-card text-card-foreground hover:border-primary hover:shadow-md cursor-pointer hover:-translate-y-1"
                  )}
                >
                  {isIncluded && (
                    <div className="absolute top-3 right-3 text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <MonitorSmartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold leading-none">{eq.type}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{eq.voltage_type || 'Tensão não definida'}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm mt-auto">
                    <p><span className="font-medium text-foreground/70">Marca/Modelo:</span> {eq.brand} {eq.model}</p>
                    <p><span className="font-medium text-foreground/70">S/N:</span> {eq.serial_number}</p>
                    <p><span className="font-medium text-foreground/70">Potência:</span> {eq.power_va ? `${eq.power_va} VA` : '-'}</p>
                  </div>
                  {isIncluded && (
                    <div className="mt-4 pt-3 border-t text-xs font-medium text-primary text-center">
                      EQUIPAMENTO JÁ INCLUÍDO
                    </div>
                  )}
                </div>
              );
            })}
            {equipments.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-12 flex flex-col items-center">
                <MonitorSmartphone className="h-12 w-12 mb-4 opacity-20" />
                <p>Nenhum equipamento encontrado para este cliente.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, AlertCircle, FileSpreadsheet, X, CheckCircle2, Search } from 'lucide-react';
import { parseExcelFile } from '@/utils/excelUtils.js';
import axios from 'axios';
import { toast } from 'sonner';
import { useSearch } from '@/hooks/useSearch.js';
import { API_BASE_URL } from '@/config/api.js';

export default function ImportClientsDialog({ open, onOpenChange, onSuccess }) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const { searchTerm, setSearchTerm, filteredItems: filteredRows } = useSearch(rows, [
    'mappedData.name',
    'mappedData.cnpj_cpf',
    'mappedData.email'
  ]);

  const resetState = () => {
    setFile(null);
    setRows([]);
    setSearchTerm('');
    setIsProcessing(false);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen && !isImporting) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const processedData = await parseExcelFile(selectedFile);
      const rowsWithId = processedData.map((row, index) => ({
        id: index,
        ...row
      }));
      setRows(rowsWithId);
    } catch (error) {
      toast.error(error.message);
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    const rowsToImport = rows.filter(r => r.isValid);
    
    if (rowsToImport.length === 0) {
      toast.warning('Nenhuma linha válida para importação.');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const token = localStorage.getItem('auth_token');

    for (const row of rowsToImport) {
      try {
        await axios.post(`${API_BASE_URL}/clients`, row.mappedData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        successCount++;
      } catch (error) {
        console.error('Import error for row:', row.mappedData, error);
        errorCount++;
      }
    }

    setIsImporting(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} clientes importados com sucesso!`);
    }
    
    if (errorCount > 0) {
      toast.error(`Falha ao importar ${errorCount} clientes. Verifique os dados.`);
    }

    if (successCount > 0) {
      onSuccess();
      handleOpenChange(false);
    }
  };

  const validCount = rows.filter(r => r.isValid).length;
  const invalidCount = rows.filter(r => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha Excel (.xlsx) com os dados dos clientes para importação em lote.
          </DialogDescription>
        </DialogHeader>

        {!file && !isProcessing && (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-lg bg-muted/30">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Selecione o arquivo Excel</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
              A planilha deve conter a coluna Nome ou Razão Social. Outros campos são opcionais e não impedem a importação.
            </p>
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Procurar Arquivo
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Processando arquivo...</p>
          </div>
        )}

        {file && !isProcessing && (
          <div className="flex flex-col flex-1 overflow-hidden space-y-4">
            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border">
              <div className="flex items-center space-x-4">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <p className="text-sm font-medium">
                  {validCount} válidos, {invalidCount} com erros (nome vazio)
                </p>
                <Button variant="ghost" size="icon" onClick={resetState} title="Remover arquivo" disabled={isImporting}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar pré-visualização por nome, CPF/CNPJ ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum cliente encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => (
                      <TableRow 
                        key={row.id} 
                        className={
                          row.isValid 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20' 
                            : 'bg-destructive/10 dark:bg-destructive/20'
                        }
                      >
                        <TableCell className="whitespace-nowrap font-medium text-xs">
                          {row.type}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate" title={row.mappedData.name}>
                          {row.mappedData.name || '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {row.mappedData.cnpj_cpf || '-'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={row.mappedData.email}>
                          {row.mappedData.email || '-'}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {row.isValid ? (
                            <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              <span className="font-medium text-xs uppercase tracking-wider">✓ Válido</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-destructive">
                              <AlertCircle className="mr-2 h-4 w-4 shrink-0" />
                              <span className="font-medium text-xs">
                                {row.errors[0]}
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="mt-6 border-t pt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isImporting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || isProcessing || isImporting || validCount === 0}
          >
            {isImporting ? 'Importando...' : `Importar Válidos (${validCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
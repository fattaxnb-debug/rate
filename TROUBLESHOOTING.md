# Troubleshooting - Solução para Erro 500 e Listas Não Carregando

## Cenário 1: Múltiplos Processos Node.js (ENOBUFS)

### Problema Raiz
**ENOBUFS** - Esgotamento de buffers de rede devido a múltiplas instâncias do backend rodando simultaneamente na porta 3001.

### Sintomas
- Todas as rotas da API retornam 500 Internal Server Error
- Listas (clientes, equipamentos, agendamentos) não carregam no frontend
- Erros de proxy no frontend: `AggregateError [ENOBUFS]`

### Solução

#### Passo 1: Matar todos os processos Node.js
```powershell
taskkill /F /IM node.exe
```

#### Passo 2: Reiniciar backend
```powershell
cd d:\TIAGO\@RAT\apps\api
npm start
```

#### Passo 3: Reiniciar frontend
```powershell
cd d:\TIAGO\@RAT\apps\web
npm run dev
```

---

## Cenário 2: Código Corrompido Após Atualização

### Problema Raiz
Código do backend foi alterado incorretamente e as rotas pararam de funcionar.

### Sintomas
- Listas (clientes, equipamentos, agendamentos) não carregam no frontend
- Erros específicos nas rotas da API

### Solução

#### Passo 1: Restaurar código para estado original
```powershell
cd d:\TIAGO\@RAT\apps\api\src
git checkout .
```

#### Passo 2: Reiniciar backend
```powershell
cd d:\TIAGO\@RAT\apps\api
npm start
```

#### Passo 3: Reiniciar frontend
```powershell
cd d:\TIAGO\@RAT\apps\web
npm run dev
```

---

## Verificação
- Backend deve rodar na porta 3001
- Frontend deve rodar na porta 3000
- Acesse http://localhost:3000 e verifique se as listas funcionam

## Causa dos Problemas

### Cenário 1 (ENOBUFS)
Múltiplas instâncias do Node.js ficaram rodando simultaneamente, causando esgotamento de recursos de rede. Isso geralmente acontece quando o backend/frontend são reiniciados múltiplas vezes sem matar os processos anteriores.

### Cenário 2 (Código Corrompido)
Alterações no código do backend quebraram as rotas ou a lógica de negócio.

## Prevenção
- Sempre que reiniciar o backend, certifique-se de reiniciar o frontend também
- Se as portas 3000 ou 3001 estiverem ocupadas, mate os processos nessas portas antes de reiniciar
- Faça commits frequentes para poder reverter alterações problemáticas

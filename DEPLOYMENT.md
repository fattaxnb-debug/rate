# Instruções de Implantação no Hostinger

## Estrutura do Projeto
- **Backend (Node.js/Express):** `apps/api/`
- **Frontend (React/Vite):** `apps/web/`

## Pré-requisitos
- Node.js 18.x ou superior
- Banco de dados MySQL
- Repositório Git configurado: https://github.com/fattaxnb-debug/rate.git

## Variáveis de Ambiente
Configure as seguintes variáveis de ambiente no Hostinger:
```
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

## Implantação no Hostinger

### 1. Importar Repositório
1. Acesse o painel do Hostinger
2. Vá em "Hospedagem" → "Gerenciar"
3. Clique em "Implantar seu web app em Node.js"
4. Selecione "Importar repositório Git"
5. Continue com GitHub
6. Selecione o repositório: `fattaxnb-debug/rate`
7. Selecione a branch: `main`

### 2. Configurar o Projeto
- **Diretório raiz:** Deixe como padrão
- **Comando de início:** `cd apps/api && npm start`
- **Versão do Node.js:** 18.x ou superior

### 3. Configurar Variáveis de Ambiente
Adicione as variáveis de ambiente listadas acima na seção "Variáveis de ambiente" do Hostinger.

### 4. Configurar Banco de Dados
1. Crie um banco de dados MySQL no Hostinger
2. Importe o schema usando o arquivo SQL fornecido
3. Configure as variáveis de ambiente do banco de dados

### 5. Deploy do Frontend
O frontend precisa ser construído e servido separadamente. Opções:
1. **Subir o frontend em um serviço de hosting estático** (Vercel, Netlify, GitHub Pages)
2. **Configurar o backend para servir os arquivos estáticos do frontend**

## Scripts Úteis
- `cd apps/api && npm start` - Iniciar backend
- `cd apps/web && npm run build` - Construir frontend para produção
- `cd apps/web && npm run preview` - Visualizar build de produção

## Notas Importantes
- O projeto usa portas diferentes: Backend (3001), Frontend (3000)
- Configure as portas corretamente no firewall do Hostinger
- O upload de fotos requer que a pasta `uploads/` tenha permissões de escrita
- As configurações da empresa (logo) são armazenadas no banco de dados na tabela `company_settings`

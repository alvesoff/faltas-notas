# Sistema de Gestão Educacional - Relatórios

Sistema web para visualização e gestão de relatórios de notas e faltas escolares, desenvolvido com Next.js 14 e integração com MySQL.

## 🚀 Funcionalidades

- **Relatórios de Faltas**: Visualização detalhada das faltas dos alunos
- **Relatórios de Notas**: Acompanhamento do desempenho acadêmico
- **Filtros Avançados**: Filtros por ano letivo, bimestre, turma, disciplina e aluno
- **Exportação Excel**: Download dos relatórios em formato Excel
- **Interface Responsiva**: Design moderno e adaptável para diferentes dispositivos
- **Paginação**: Navegação eficiente através de grandes volumes de dados
- **Estatísticas**: Cards com informações resumidas dos dados

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Estilização**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: MySQL
- **Exportação**: XLSX (SheetJS)
- **Ícones**: Lucide React
- **Deploy**: Vercel

## 📋 Pré-requisitos

- Node.js 18+ 
- NPM ou Yarn
- Acesso ao banco MySQL

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd sistema-gestao-educacional
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto:
```env
MYSQL_HOST=mysql.apoioaospais.com.br
MYSQL_PORT=3306
MYSQL_DATABASE=AC_55998546000175
MYSQL_USER=BK55998546000175
MYSQL_PASSWORD=165399227306525
```

4. Execute o projeto em desenvolvimento:
```bash
npm run dev
```

5. Acesse `http://localhost:3000`

## 🚀 Deploy na Vercel

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente no painel da Vercel:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
3. Deploy automático será realizado

## 📊 Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas principais:

- **NotasFaltas**: Registros de notas e faltas dos alunos
- **Alunos**: Informações dos estudantes
- **Turmas**: Dados das turmas
- **Disciplina1**: Disciplinas oferecidas

## 🎯 Funcionalidades Detalhadas

### Filtros Disponíveis
- **Tipo de Relatório**: Faltas ou Notas
- **Ano Letivo**: Seleção do ano acadêmico
- **Bimestre**: Filtro por período específico
- **Turma**: Seleção por turma
- **Disciplina**: Filtro por matéria
- **Busca por Aluno**: Pesquisa por nome ou matrícula

### Visualização de Dados
- Tabela responsiva com ordenação por colunas
- Paginação para navegação eficiente
- Status visual para identificar situações críticas
- Percentual de faltas calculado automaticamente

### Exportação
- Download em formato Excel (.xlsx)
- Dados formatados e organizados
- Nome do arquivo com timestamp

## 🔒 Segurança

- Conexão SSL com o banco de dados
- Validação de parâmetros nas APIs
- Tratamento de erros robusto
- Timeout configurado para conexões

## 📱 Responsividade

O sistema é totalmente responsivo, adaptando-se a:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎨 Interface

- Design moderno com Tailwind CSS
- Cores consistentes e acessíveis
- Ícones intuitivos (Lucide React)
- Feedback visual para ações do usuário

## 📈 Performance

- Paginação para otimizar carregamento
- Queries otimizadas no banco
- Cache de conexões MySQL
- Componentes React otimizados

## 🐛 Tratamento de Erros

- Logs detalhados no servidor
- Mensagens amigáveis para o usuário
- Fallbacks para falhas de conexão
- Validação de dados de entrada

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ para gestão educacional eficiente**
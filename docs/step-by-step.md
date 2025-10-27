# Sistema de Gestão Educacional - Documentação de Desenvolvimento

## Visão Geral
Sistema completo para gestão de notas e faltas escolares, desenvolvido com Next.js 14, TypeScript, Tailwind CSS e MySQL.

## Estrutura do Projeto

### 1. Configuração Base
- **package.json**: Configuração das dependências do projeto
- **next.config.js**: Configuração do Next.js para produção
- **tsconfig.json**: Configuração do TypeScript
- **tailwind.config.js**: Configuração do Tailwind CSS
- **postcss.config.js**: Configuração do PostCSS
- **.env.local**: Variáveis de ambiente para conexão MySQL
- **vercel.json**: Configuração para deploy na Vercel

### 2. Estrutura de Arquivos

#### `/lib/database.ts`
**Função**: Gerenciamento da conexão com MySQL
- Pool de conexões para otimização
- Funções para executar queries
- Tratamento de erros de conexão

#### `/app/api/relatorios/route.ts`
**Função**: API principal para buscar relatórios
- Endpoint GET para consultas de notas e faltas
- Filtros por ano letivo, bimestre, turma, disciplina
- **IMPORTANTE**: Para relatórios de "Faltas Resumidas" usa tabela `Frequencia` (dados reais de presença diária)
- Para relatórios de "Faltas Detalhadas" usa tabela `NotasFaltas` (dados consolidados por disciplina)
- Cálculo de percentual de faltas baseado em dias únicos com ausência
- Junção de tabelas: Frequencia/NotasFaltas, Alunos, Turmas, Classe1

**Mudança Crítica Implementada (2025-01-07)**:
- Relatórios "resumidas" agora usam tabela `Frequencia` ao invés de `NotasFaltas`
- Contagem de DIAS com falta (não aulas perdidas) para maior precisão
- Status baseado em número de dias: ≥25 dias = "Atenção", ≥15 dias = "Observação"
- Exemplo: OTÁVIO ALVES DOS SANTOS - 27 dias com falta (antes mostrava apenas 2 dias)

**Correção da API de Exportação (2025-01-07)**:
- Corrigida inconsistência entre API de relatórios e API de exportação
- API de exportação agora usa a mesma lógica da API de relatórios
- Faltas resumidas agora usam tabela `Frequencia` corretamente
- Filtros de data corrigidos para usar campos corretos (f.data ao invés de nf.DtInclusao)
- GROUP BY corrigido para incluir todos os campos não agregados
- Lógica de filtro de disciplina melhorada para maior consistência
- Exportação agora funciona com qualquer combinação de filtros aplicados

#### `/app/api/filtros/route.ts`
**Função**: API para carregar opções de filtros
- Anos letivos disponíveis
- Turmas por ano
- Disciplinas por ano
- Bimestres

#### `/app/api/export/route.ts`
**Função**: API para exportação Excel
- Geração de arquivos XLSX
- Mesmos filtros da API de relatórios
- Download direto do arquivo

#### `/components/Filtros.tsx`
**Função**: Componente de filtros avançados
- Filtros dinâmicos carregados via API
- Busca por nome/matrícula do aluno
- Seleção de tipo de relatório (faltas/notas)
- Interface responsiva

#### `/components/TabelaRelatorios.tsx`
**Função**: Componente de exibição de dados
- Tabela responsiva com paginação
- Ordenação por colunas
- Indicadores visuais para status
- Estados de loading e sem dados

#### `/app/page.tsx`
**Função**: Página principal da aplicação
- Integração dos componentes
- Gerenciamento de estado
- Cálculo de estatísticas
- Função de exportação

#### `/app/layout.tsx`
**Função**: Layout base da aplicação
- Estrutura HTML principal
- Importação de estilos globais
- Metadados da página

#### `/app/globals.css`
**Função**: Estilos globais
- Configuração do Tailwind CSS
- Estilos customizados para tabelas
- Tema claro/escuro

## Funcionalidades Implementadas

### 1. Consulta de Dados
- ✅ Conexão com MySQL
- ✅ Consultas otimizadas com JOINs
- ✅ Filtros avançados
- ✅ Paginação e ordenação

### 2. Interface de Usuário
- ✅ Design responsivo
- ✅ Filtros dinâmicos
- ✅ Tabelas interativas
- ✅ Indicadores visuais

### 3. Exportação
- ✅ Geração de arquivos Excel
- ✅ Mesmos filtros da consulta
- ✅ Download automático

### 4. Estatísticas
- ✅ Total de alunos
- ✅ Total de faltas
- ✅ Média de notas
- ✅ Alunos com faltas excessivas

## Estrutura do Banco de Dados

### Tabelas Principais
- **Alunos**: Dados dos estudantes
- **NotasFaltas**: Notas e faltas por bimestre
- **Turmas**: Informações das turmas
- **Disciplina1**: Disciplinas disponíveis

### Relacionamentos
- NotasFaltas.Mat → Alunos.Mat
- NotasFaltas.AnoLetivo + NotasFaltas.Mat → Turmas
- NotasFaltas.Disc → Disciplina1.Codigo

## Testes e Otimizações

### Build de Produção
- ✅ Build executado com sucesso
- ✅ Páginas estáticas otimizadas
- ✅ APIs configuradas como dinâmicas
- ✅ Chunks otimizados (87.3 kB total)

### Configurações para Vercel
- ✅ Timeout de 30s para APIs
- ✅ Variáveis de ambiente configuradas
- ✅ Next.js 14 otimizado

## Próximos Passos Sugeridos

1. **Testes de Carga**: Testar com grande volume de dados
2. **Cache**: Implementar cache para consultas frequentes
3. **Autenticação**: Adicionar sistema de login
4. **Relatórios Avançados**: Gráficos e dashboards
5. **Backup**: Sistema de backup automático

## Segurança

- ✅ Variáveis de ambiente para credenciais
- ✅ Queries parametrizadas (SQL injection protection)
- ✅ Validação de entrada
- ✅ Tratamento de erros

## Performance

- ✅ Pool de conexões MySQL
- ✅ Paginação para grandes datasets
- ✅ Lazy loading de componentes
- ✅ Otimização de bundle

O sistema está pronto para produção e deploy na Vercel.
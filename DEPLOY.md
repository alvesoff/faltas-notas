# 🚀 Guia de Deploy - Sistema de Gestão Educacional

## 📋 Pré-requisitos

1. **Conta no Vercel** (ou outro provedor de hospedagem)
2. **Banco de dados MySQL** acessível pela internet
3. **Domínio personalizado** (opcional)

## 🔧 Configuração para Produção

### 1. **Variáveis de Ambiente**

No seu provedor de hospedagem (Vercel, Netlify, etc.), configure as seguintes variáveis:

```env
MYSQL_HOST=seu_host_mysql
MYSQL_PORT=3306
MYSQL_DATABASE=nome_do_banco
MYSQL_USER=usuario_mysql
MYSQL_PASSWORD=senha_mysql
ADMIN_USERNAME=seu_usuario_admin
ADMIN_PASSWORD=sua_senha_admin
JWT_SECRET=sua_chave_secreta_jwt
```

### 2. **Deploy no Vercel**

#### Via GitHub (Recomendado):
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel
3. O deploy será automático a cada push

#### Via CLI:
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

### 3. **Configuração de Domínio Personalizado**

#### No Vercel:
1. Vá em **Settings** > **Domains**
2. Adicione seu domínio: `ed.sistemabr.site`
3. Configure os DNS conforme instruções

#### Configuração DNS:
```
Tipo: CNAME
Nome: ed
Valor: cname.vercel-dns.com
```

### 4. **Testando as APIs**

Após o deploy, teste as rotas:

- ✅ `https://ed.sistemabr.site/api/export`
- ✅ `https://ed.sistemabr.site/api/relatorios`
- ✅ `https://ed.sistemabr.site/api/filtros`

## 🔍 Troubleshooting

### Problema: API não funciona em produção

**Possíveis causas:**

1. **Variáveis de ambiente não configuradas**
   - Verifique se todas as variáveis estão definidas no painel do provedor

2. **Banco de dados inacessível**
   - Teste a conexão com o banco
   - Verifique firewall/whitelist de IPs

3. **Timeout nas funções**
   - Aumente o `maxDuration` no `vercel.json`
   - Otimize as queries SQL

4. **Problemas de CORS**
   - Configure headers CORS nas APIs se necessário

### Comandos de Debug:

```bash
# Ver logs do Vercel
vercel logs

# Testar localmente com variáveis de produção
vercel dev

# Build local para testar
npm run build
npm start
```

## 📊 Monitoramento

- **Logs**: Acesse os logs no painel do Vercel
- **Performance**: Monitore o tempo de resposta das APIs
- **Erros**: Configure alertas para erros 500

## 🔒 Segurança

1. **Nunca commite o arquivo `.env`** (já está no .gitignore)
2. **Use senhas fortes** para banco de dados
3. **Configure HTTPS** (automático no Vercel)
4. **Monitore acessos** às APIs

## 📞 Suporte

Se a API ainda não funcionar:

1. Verifique os logs de erro
2. Teste a conexão com o banco
3. Confirme se as variáveis estão corretas
4. Teste as rotas individualmente

---

**Exemplo de teste da API:**

```bash
curl -X POST https://ed.sistemabr.site/api/export \
  -H "Content-Type: application/json" \
  -d '{"tipo":"faltas","tipoFalta":"resumidas","anoLetivo":"2025"}'
```
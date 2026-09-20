# Como testar a aplicação no Netlify

Toda a estrutura do projeto está pronta. Agora você tem duas opções para testar a interface de verdade:

## Opção 1: Rodar localmente (5 minutos)

**1. Clone o repositório**
```bash
git clone https://github.com/nandoinmerge/ON.git
cd ON
```

**2. Instale as dependências**
```bash
npm install
```

**3. Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite `.env` e preencha:
```
SUPABASE_URL=https://xgysgiokejgjzmrslsil.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneXNnaW9rZWpnanptcnNsc2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NjI4NjgsImV4cCI6MjEwNTQzODg2OH0.ZZisGS7aBI3s8ij5ok1OYX0DZz-xyczlgN-hPUsl7vo
```

**4. Inicie o servidor**
```bash
npm run dev
```

Abre automaticamente em **http://localhost:5173**

---

## Opção 2: Deploy no Netlify (automático)

**1. Prepare o repositório**
Já está tudo pronto no GitHub: https://github.com/nandoinmerge/ON

**2. Vá para https://app.netlify.com**
- Clique em "Add new site" → "Import an existing project"
- Selecione "GitHub" e autorize
- Busque o repositório "nandoinmerge/ON"

**3. Configure o build**
Netlify auto-detects Vite. Deixe os defaults:
- **Build command**: `npm run build`
- **Publish directory**: `dist`

**4. Variáveis de ambiente**
Na página de deploy, vá para **Settings → Environment variables** e adicione:
```
SUPABASE_URL=https://xgysgiokejgjzmrslsil.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneXNnaW9rZWpnanptcnNsc2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NjI4NjgsImV4cCI6MjEwNTQzODg2OH0.ZZisGS7aBI3s8ij5ok1OYX0DZz-xyczlgN-hPUsl7vo
```

**5. Deploy**
Clique em "Deploy site". Netlify faz tudo automaticamente. Sua aplicação estará online em `https://seu-nome-site.netlify.app`

---

## O que você pode testar agora

✅ **Signup** → cria conta no Supabase Auth  
✅ **Login** → entra na área autenticada  
✅ **Logout** → sai da sessão  
✅ **Recuperar senha** → envia link  
✅ **Dashboard** → mostra organizações do usuário  

---

## O que fazer agora

1. **Teste localmente primeiro** (Opção 1), confirme que tudo funciona
2. **Faça um teste de fluxo completo**:
   - Signup com um novo e-mail
   - Confirmar e-mail (instruções foram enviadas ao seu e-mail de teste)
   - Login com essa conta
   - Ver o dashboard vazio (sem organização ainda)

3. **Crie a organização piloto ON Digital** (instrução abaixo)

4. **Depois, faça deploy no Netlify** (Opção 2)

---

## Criar a organização piloto ON Digital

Após fazer login na aplicação, abra o **console do navegador** (F12) e rode:

```javascript
// Isso chama a função SQL que você criou no banco
const response = await fetch('https://xgysgiokejgjzmrslsil.supabase.co/rest/v1/rpc/create_organization_with_owner', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('sb-xgysgiokejgjzmrslsil-auth-token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    org_name: 'ON Digital',
    org_slug: 'on-digital',
    owner_full_name: 'Seu nome',
    owner_email: 'seu@email.com'
  })
});
```

Depois, recarregue a página. A organização deve aparecer no dashboard.

---

## Próximos passos após testar

Quando você confirmar que tudo funciona localmente:

1. **Implementar clientes e projetos** (Fase 2)
2. **Adicionar páginas de listagem e edição** para clientes, projetos, tarefas
3. **Integrar com o Kanban** que validamos no design system
4. **Testes e2e** com Playwright

Nesse momento, você terá um sistema funcional que:
- Autentica usuários de verdade
- Gerencia organizações multi-tenant
- Permite que proprietários convidem membros da equipe
- Tem interface completamente tipada e testável

---

## Problemas comuns

**"SUPABASE_URL is not defined"**
→ Adicionar as variáveis ao `.env`

**"Failed to fetch from Supabase"**
→ Verificar se as chaves estão corretas em `.env`

**"CORs error"**
→ O Supabase Cloud já tem CORS configurado para localhost:5173 e Netlify

**Página branca com erro no console**
→ Abrir DevTools (F12), procurar por erros de React

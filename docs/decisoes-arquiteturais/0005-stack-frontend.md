# ADR 0005: React + TypeScript + Vite + Tailwind CSS para frontend

## Status
Implementada.

## Contexto
Era preciso escolher uma stack para a interface do usuário que fosse:
- Rápida de desenvolver
- Fácil de manter
- Adequada para um SaaS B2B interno (sem exigências de SEO complicadas)
- Type-safe (TypeScript obrigatório)

## Decisão
React + TypeScript + Vite + Tailwind CSS.

| Camada | Tecnologia | Razão |
|---|---|---|
| Linguagem | TypeScript | Type-safety em todo o código, refatorações seguras |
| Framework | React 18 | Comunidade, ecosystem, performance, dev experience |
| Build | Vite | Builds rápidos, dev server com HMR instant |
| CSS | Tailwind CSS | Utility-first, velocidade, design system integrado |
| Roteamento | React Router v6 | Padrão de facto, SSR-ready se necessário depois |
| Componentes base | Radix UI | Headless, accessibility built-in, sem bloat visual |
| Validação | Zod | Type inference, runtime validation, perfeito com TypeScript |

## Estrutura

```
apps/web/src/
  main.tsx              Entry point
  App.tsx               Router
  styles/globals.css    Tailwind + estilos
  app/
    pages/              Rotas (Login, Dashboard, etc)
    layouts/            Layouts (AuthLayout)
    components/         Componentes reutilizáveis
  hooks/                Custom hooks (depois)
  utils/                Funções auxiliares (depois)
```

## Portabilidade

Ao migrar para uma VPS:
- Todo o código frontend é estático uma vez buildado (`npm run build` gera `dist/`)
- Serve com nginx, Apache ou qualquer web server
- Não há dependência de Node.js em produção
- As chamadas ao backend vão para um serviço HTTP da sua VPS, não para Supabase

## Próximo passo

Quando estiver pronto para testar:
1. `npm install` para instalar dependências
2. `.env` preenchido com SUPABASE_URL e SUPABASE_ANON_KEY
3. `npm run dev` abre em http://localhost:5173
4. Deploy em Netlify ou Vercel com um clique (as plataformas auto-detectam Vite)

## Critério de sucesso

- Login, signup, recuperação de senha e aceitação de convite rodando no navegador
- Autenticação integrando de verdade com o Supabase
- Dashboard mostrando organizações do usuário autenticado
- Sem erros de TypeScript (`npm run type-check` passa)

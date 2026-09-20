# ON Digital Web

Frontend da aplicação, construído com React + TypeScript + Vite + Tailwind CSS.

## Estrutura

```
src/
  main.tsx           Entry point da aplicação
  App.tsx            Router principal
  styles/
    globals.css      Tailwind + estilos globais
  app/
    layouts/         Layouts (AuthLayout para área autenticada)
    pages/           Páginas (Login, Signup, Dashboard, etc)
    components/      Componentes reutilizáveis (Logo, etc)
```

## Como rodar

1. **Instale as dependências** (na raiz do projeto):
```bash
npm install
```

2. **Crie o arquivo `.env`** (copie de `.env.example` e preencha):
```bash
cp .env.example .env
```

3. **Inicie o servidor de desenvolvimento**:
```bash
npm run dev
```

O aplicativo abrirá em `http://localhost:5173`.

## Build para produção

```bash
npm run build
```

Saída: pasta `dist/` com arquivos estáticos prontos para deploy.

## Convenções

- **Imports**: usar aliases (`@/` para `apps/web/src`, `@services/` para `services`)
- **Componentes**: PascalCase, sempre `.tsx`
- **Hooks customizados**: camelCase, prefixo `use`
- **Utilitários**: camelCase, em `services/`
- **CSS**: Tailwind classes, sem CSS-in-JS

## Testes

```bash
npm run test
```

Roda testes Vitest com cobertura.

## Deploy

Quando pronto:
- **Netlify**: `npm run build` + deploy da pasta `dist/`
- **Vercel**: conectar repositório GitHub, auto-detects Vite
- **VPS própria**: `npm run build` + servir `dist/` com nginx ou similar

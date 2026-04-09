# Acciones Clientes - Dashboard Numaris

Dashboard interactivo de acciones sobre clientes CRM sin facturación reciente.

## Deploy en Vercel

### Opción 1: Desde GitHub (recomendado)

1. Crea un repositorio en GitHub y sube este proyecto:
   ```bash
   cd acciones-dashboard
   git init
   git add .
   git commit -m "Initial commit: dashboard acciones clientes"
   git remote add origin https://github.com/TU_USUARIO/acciones-dashboard.git
   git push -u origin main
   ```

2. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.

3. Haz clic en **"Add New" → "Project"**.

4. Selecciona el repositorio `acciones-dashboard`.

5. Vercel detectará automáticamente que es un proyecto Vite. Deja la configuración por defecto:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

6. Haz clic en **"Deploy"**. En ~30 segundos tendrás tu URL pública.

### Opción 2: Desde la CLI de Vercel

```bash
npm i -g vercel
cd acciones-dashboard
vercel
```

Sigue las instrucciones interactivas. Vercel detectará Vite automáticamente.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173 en tu navegador.

## Stack

- React 18
- Vite 5
- Recharts (gráficas)
- Datos embebidos (sin backend)

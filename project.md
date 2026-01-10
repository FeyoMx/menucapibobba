# 📋 Capibobba - Documentación del Proyecto

## 🚀 Resumen del Proyecto
**Capibobba** es una aplicación web de menú digital para una tienda de bubble tea que combina un menú público dinámico con un panel de administración en tiempo real. El proyecto utiliza Firebase como backend para la sincronización instantánea de datos entre el panel de admin y el menú público.

## 🏗️ Arquitectura del Sistema

### Frontend
- **Tecnologías**: HTML5, CSS3, Vanilla JavaScript (ES6+ Modules)
- **Patrón**: Cliente-servidor con sincronización en tiempo real
- **Arquitectura**: SPA (Single Page Application) con dos interfaces independientes

### Backend
- **Base de datos**: Firebase Firestore (NoSQL en tiempo real)
- **Autenticación**: Firebase Authentication
- **Hosting**: GitHub Pages con despliegue automático

## 📁 Estructura de Archivos

```
menucapibobba/
├── 📄 Frontend Principal
│   ├── index.html                    # Menú público para clientes
│   ├── script.js                     # Lógica del menú (1,500+ líneas)
│   └── styles.css                    # Estilos del menú (1,200+ líneas)
│
├── ⚙️ Panel de Administración
│   ├── admin.html                    # Interface de administración
│   ├── admin-script.js               # Lógica CRUD y autenticación
│   └── admin-styles.css              # Estilos del panel admin
│
├── 🔧 Configuración y Optimización
│   ├── .htaccess                     # Configuración Apache (cache, compresión)
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service Worker para cache
│   ├── robots.txt                    # SEO y crawling
│   ├── sitemap.xml                   # Mapa del sitio
│   ├── meta-pixel-config.js          # Configuración de Meta Pixel (hardcodeado, público)
│   └── meta-pixel-config.example.js  # Plantilla de configuración de Meta Pixel
│
├── 📋 Documentación y Legal
│   ├── README.md                     # Documentación principal
│   ├── 404.html                      # Página de error personalizada
│   ├── politica-de-privacidad.html   # Política de privacidad
│   └── terminos-de-uso.html          # Términos de uso
│
├── 🔐 Configuración Firebase
│   └── firebase-config.example.js    # Plantilla de configuración
│
└── 🚀 Despliegue
    └── .github/workflows/            # GitHub Actions para CI/CD
```

## 🎯 Funcionalidades Principales

### 👥 Menú Público (index.html)
- **Carga dinámica** desde Firestore
- **Carrito de compras** con persistencia local
- **Personalización de productos** (toppings, sabores)
- **Integración WhatsApp** para pedidos
- **Modo oscuro/claro** automático
- **Design responsive** optimizado para móviles
- **PWA** con Service Worker
- **Meta Pixel (Facebook Pixel)** para tracking de conversiones

### 🛠️ Panel de Administración (admin.html)
- **Autenticación segura** con Firebase Auth
- **CRUD completo** de productos
- **Gestión por categorías**:
  - Frappés base agua
  - Frappés base leche
  - Bebidas calientes
  - Toppings
  - Especialidades (Chamoyadas, Yogurtadas)
  - Promociones
  - Postres & Snacks (CapiGofre)
- **Actualización en tiempo real**
- **Importación/Exportación** de datos JSON
- **Interface intuitiva** con validación

## 🔄 Flujo de Datos

```
[Admin Panel] → [Firebase Firestore] → [Menú Público]
     ↓                    ↓                    ↓
Autenticación      Base de Datos         Listeners en
Firebase Auth      en Tiempo Real       Tiempo Real
```

## 📊 Estructura de Datos (Firestore)

```javascript
// Colección: menus/{menuId}/products/{productId}
{
  name: "Frappé de Fresa",
  description: "Delicioso frappé con sabor a fresa",
  price: 45.00,
  image: "https://ejemplo.com/imagen.jpg",
  type: "water-based-frappe", // water-based-frappe, milk-based-frappe, hot-drink, desserts, etc.
  available: true,
  category: "waterFrappes",
  toppings?: ["boba", "jelly"] // Para productos especiales (Chamoyada, Yogurtada, CapiGofre)
}
```

## 🎨 Sistema de Diseño

### Paleta de Colores
- **Primario**: Rosa (#FF69B4)
- **Fondo claro**: Gradiente pastel (#FFE1E6 → #F3E8FF)
- **Fondo oscuro**: Gradiente azul-gris (#2C3E50 → #34495E)
- **Acentos**: Amarillo, azul cielo, lavanda

### Tipografía
- **Primaria**: Nunito (400, 600, 700, 800, 900)
- **Decorativa**: Balsamiq Sans (700) para títulos

### Componentes UI
- **Botones**: Estilo kawaii con hover effects
- **Cards**: Sombras suaves, bordes redondeados
- **Modales**: Overlay con animaciones
- **Carrito**: Flotante con badge de contador

## 🔧 Configuraciones Técnicas

### Performance
- **Lazy loading** de imágenes
- **Service Worker** con cache estratégico
- **CSS crítico** inline
- **Preload/Prefetch** de recursos críticos (fonts, LCP image)
- **Compresión GZIP** configurada
- **Font-display: swap** para evitar FOIT (Flash of Invisible Text)
- **Dimensiones de imagen** definidas para prevenir CLS (Cumulative Layout Shift)
- **CSS síncrono** para evitar FOUC (Flash of Unstyled Content)

### SEO
- **Meta tags** completos (Open Graph, Twitter Cards)
- **Canonical URL** definida para evitar contenido duplicado
- **Title optimizado** (50-60 caracteres) para mejor CTR
- **Structured data** (JSON-LD): Restaurant + BreadcrumbList
- **Sitemap XML** generado
- **Robots.txt** configurado
- **Meta description** optimizada (150-160 caracteres)

### PWA
- **Manifest** completo
- **Service Worker** funcional
- **Instalable** en dispositivos móviles

### Meta Pixel (Facebook Pixel)
- **Tracking de conversiones** para campañas de Facebook/Instagram
- **Eventos estándar** implementados:
  - `PageView` - Vista de página (automático)
  - `AddToCart` - Agregar productos al carrito
  - `InitiateCheckout` - Iniciar pedido vía WhatsApp
  - `Contact` - Contacto por WhatsApp
- **Configuración modular** en archivo separado
- **Debug mode** disponible para desarrollo
- **Verificable** con Meta Pixel Helper (extensión Chrome)

## 🔐 Seguridad

### Autenticación
- **Firebase Auth** con email/password
- **Protección de rutas** admin
- **Validación** de permisos

### Configuración
- **Variables sensibles** en GitHub Secrets
- **Firebase config** no versionado
- **HTTPS** enforced

## 🚀 Despliegue

### GitHub Actions Workflow
```yaml
# Despliegue automático a GitHub Pages
# Inyección de secrets de Firebase únicamente
# Meta Pixel hardcodeado (público)
```

### Variables de Entorno (GitHub Secrets)

**Firebase:**
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

**Meta Pixel:**
- ✅ **Hardcodeado** en `meta-pixel-config.js` (público como Google Analytics)
- No requiere GitHub Secrets
- Pixel ID versionado en el repositorio: `1495356471713675`

## 📱 Responsive Design

### Breakpoints
- **Móvil**: < 768px (prioridad)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Optimizaciones Móviles
- **Touch gestures** optimizados
- **Viewport** configurado
- **Elementos** con tamaño mínimo táctil
- **Navegación** simplificada

## 🛠️ Herramientas de Desarrollo

### Recomendadas
- **VS Code** con Live Server
- **Firebase CLI** para testing local
- **GitHub Desktop** para control de versiones

### Testing
- **Responsive design** tools
- **Lighthouse** para performance
- **Firebase Emulator** para desarrollo

## 🔄 Flujo de Trabajo

### Desarrollo Local
1. Clonar repositorio
2. Configurar `firebase-config.js`
3. Usar Live Server (VS Code)
4. Desarrollar y probar

### Despliegue
1. Push a `main` branch
2. GitHub Actions ejecuta workflow
3. Despliegue automático a GitHub Pages
4. Dominio personalizado: `https://capibobba.store/`
5. GitHub Pages (backup): `https://feyomx.github.io/menucapibobba/`

## 📋 Estados del Proyecto

### ✅ Implementado
- [x] Menú dinámico con Firebase
- [x] Panel de administración completo
- [x] Carrito de compras funcional
- [x] Integración WhatsApp
- [x] PWA con Service Worker
- [x] Responsive design
- [x] Modo oscuro/claro
- [x] SEO optimizado
- [x] Despliegue automático
- [x] Optimización de Core Web Vitals (LCP, CLS, FCP)
- [x] Prevención de layout shifts con dimensiones de imagen
- [x] Preload de recursos críticos (logo LCP, fuentes, stylesheet principal)
- [x] SEO avanzado con canonical URL y breadcrumbs
- [x] Title tag optimizado para mejor CTR en buscadores
- [x] Nueva categoría de Postres & Snacks
- [x] CapiGofre con personalización (Cama: Chocolate/Lechera, Toppings: Nuez/Mazapán/Granillo)
- [x] Modal de personalización para CapiGofre similar a Chamoyada/Yogurtada
- [x] Meta Pixel (Facebook Pixel) con tracking completo de eventos:
  - [x] PageView automático
  - [x] AddToCart (agregar productos al carrito)
  - [x] InitiateCheckout (iniciar pedido por WhatsApp)
  - [x] Contact (contacto vía WhatsApp desde footer y carrito)

### 🔄 Posibles Mejoras Futuras
- [ ] Notificaciones push
- [ ] Sistema de pedidos más avanzado
- [ ] Analytics de ventas
- [ ] Multi-idioma
- [ ] Integración con payment gateways
- [ ] Dashboard de métricas
- [ ] Chat en vivo
- [ ] Sistema de inventario

## 🐛 Puntos de Atención

### Conocidos
- **Módulos ES6**: Requiere servidor local (no file://)
- **Firebase config**: Debe configurarse por ambiente
- **Cache**: Service Worker puede requerir hard refresh en desarrollo

### Monitoreo
- **Firebase usage**: Vigilar quotas de Firestore
- **Performance**: Lighthouse scores regulares
- **Errores**: Console logs en producción

## 👥 Roles y Permisos

### Usuario Final
- **Visualización** del menú
- **Interacción** con carrito
- **Pedidos** vía WhatsApp

### Administrador
- **Autenticación** requerida
- **CRUD** completo de productos
- **Gestión** de categorías
- **Exportación** de datos

## 📞 Contacto y Soporte

### URL del Proyecto
- **Producción**: https://capibobba.store/
- **Admin Panel**: https://capibobba.store/admin.html
- **GitHub Pages (legacy)**: https://feyomx.github.io/menucapibobba/

### Documentación Técnica
- Ver `README.md` para setup detallado
- Consultar comentarios en código fuente
- Firebase Console para gestión de backend

---

## 📈 Historial de Optimizaciones SEO

### 26 de Enero de 2025 - Mejoras SEO Avanzadas
**Implementaciones:**
1. ✅ **Sitemap.xml actualizado**
   - Corregidas fechas a formato ISO 8601 (YYYY-MM-DD)
   - Actualización de lastmod a fecha actual (2025-01-26)
   - Validación de estructura XML correcta

2. ✅ **Accesibilidad mejorada**
   - Añadidos atributos `aria-label` descriptivos a iconos sociales del footer
   - Implementado `role="img"` en iconos de Font Awesome
   - Mejora en la navegación por lectores de pantalla

3. ✅ **FAQ Schema (JSON-LD) implementado**
   - Añadidas 6 preguntas frecuentes optimizadas para rich snippets
   - Temas cubiertos: ordenar, tipos de bebidas, horarios, personalización, entregas, pagos
   - Estructura Schema.org FAQPage completa
   - Mejora potencial en CTR de búsqueda con rich results

4. ✅ **Meta Pixel verificado y optimizado**
   - Confirmada configuración correcta en `meta-pixel-config.js`
   - Pixel ID: 1495356471713675
   - Eventos personalizados para Capibobba funcionando
   - Tracking de conversiones activo

**Impacto esperado:**
- **SEO Score**: 94/100 → 98/100
- **Rich Snippets**: Elegibilidad para aparecer en FAQ de Google
- **Accesibilidad**: Mejora en score WCAG 2.1 AA
- **Conversiones**: Mejor tracking con Meta Pixel optimizado

**Archivos modificados:**
- `sitemap.xml` - Fechas actualizadas
- `index.html` - FAQ Schema + aria-labels mejorados

---

## 🔧 Configuración de Firebase para Dominio Personalizado

### Autorizar capibobba.store en Firebase Authentication

**Problema común:** Error `auth/requests-from-referer-<domain>-are-blocked`

**Solución:**
1. Acceder a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar el proyecto
3. Ir a **Authentication** → **Settings** → **Authorized domains**
4. Agregar los siguientes dominios:
   - `capibobba.store`
   - `www.capibobba.store` (si aplica)
   - `localhost` (desarrollo)
   - `feyomx.github.io` (backup)

**Verificación:**
- Esperar 1-2 minutos después de agregar dominios
- Limpiar caché del navegador (Ctrl + Shift + Delete)
- Hard refresh (Ctrl + Shift + R)
- Intentar login nuevamente en admin panel

---

*Este proyecto demuestra un desarrollo fullstack moderno con tecnologías web nativas, enfocado en performance, UX y mantenibilidad.*
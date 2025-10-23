# 📊 Guía de Configuración de Meta Pixel (Facebook Pixel)

## 🎯 ¿Qué es Meta Pixel?

Meta Pixel (anteriormente conocido como Facebook Pixel) es una herramienta de análisis que te permite medir la efectividad de tus campañas publicitarias en Facebook e Instagram mediante el seguimiento de las acciones que realizan los usuarios en tu sitio web.

## ✨ Beneficios para Capibobba

1. **📈 Seguimiento de conversiones**: Saber cuántas personas hacen pedidos después de ver tus anuncios
2. **🎯 Optimización de anuncios**: Facebook optimiza automáticamente tus anuncios para obtener más conversiones
3. **👥 Crear audiencias personalizadas**: Remarketing a personas que visitaron tu sitio
4. **📊 Métricas detalladas**: Ver qué productos agregan al carrito, cuántos inician pedidos, etc.

## 🚀 Pasos de Configuración

### 1️⃣ Crear tu Meta Pixel

#### Opción A: Ya tienes una cuenta de Facebook Business

1. Ve a **Facebook Business Manager**: [business.facebook.com](https://business.facebook.com)
2. En el menú lateral, haz clic en **"Todas las herramientas"**
3. Selecciona **"Events Manager"** (Administrador de eventos)
4. Haz clic en **"Conectar fuentes de datos"**
5. Selecciona **"Web"** como fuente de datos
6. Haz clic en **"Conectar"**
7. Nombra tu pixel (ej: "Capibobba - Menú Digital")
8. Haz clic en **"Crear pixel"**
9. **Copia tu Pixel ID** (15 dígitos) - lo necesitarás en el paso 2

#### Opción B: No tienes cuenta de Facebook Business

1. Crea una cuenta en **Meta Business Suite**: [business.facebook.com](https://business.facebook.com)
2. Completa la información de tu negocio
3. Sigue los pasos de la Opción A arriba

### 2️⃣ Configurar el Pixel ID en GitHub Secrets

**⚠️ IMPORTANTE**: El archivo `meta-pixel-config.js` no está versionado (está en `.gitignore`) por seguridad. En su lugar, usa **GitHub Secrets** para configurar el Pixel ID.

#### Pasos para configurar el Secret:

1. **Ve a tu repositorio en GitHub**:
   - URL: `https://github.com/TU_USUARIO/menucapibobba`

2. **Accede a Settings > Secrets and variables > Actions**:
   - Haz clic en la pestaña **"Settings"** del repositorio
   - En el menú lateral, haz clic en **"Secrets and variables"** → **"Actions"**

3. **Crea un nuevo Repository Secret**:
   - Haz clic en **"New repository secret"**
   - **Name**: `META_PIXEL_ID`
   - **Secret**: Pega tu Pixel ID (ej: `1495356471713675`)
   - Haz clic en **"Add secret"**

4. **Actualizar el noscript tag en index.html**:
   - Abre `index.html` en tu editor
   - Busca la línea 156 (noscript tag)
   - Reemplaza `YOUR_PIXEL_ID` con tu Pixel ID real:
   ```html
   <!-- Noscript fallback para Meta Pixel -->
   <noscript>
     <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id=1495356471713675&ev=PageView&noscript=1" />
   </noscript>
   ```

5. **Haz commit y push**:
   ```bash
   git add index.html
   git commit -m "fix: Actualizar Pixel ID en noscript tag"
   git push origin main
   ```

6. **El despliegue automático generará el archivo**:
   - GitHub Actions detectará el push
   - Ejecutará el workflow `.github/workflows/deploy.yml`
   - Generará `meta-pixel-config.js` usando el Secret `META_PIXEL_ID`
   - Desplegará todo a GitHub Pages

#### Para desarrollo local (opcional):

Si quieres probar localmente:

1. Copia el archivo de ejemplo:
   ```bash
   cp meta-pixel-config.example.js meta-pixel-config.js
   ```

2. Abre `meta-pixel-config.js` y configura tu Pixel ID:
   ```javascript
   const metaPixelConfig = {
     pixelId: '1495356471713675',  // ⬅️ TU PIXEL ID
     enabled: true,
     debug: true  // Activa debug para ver logs
   };
   ```

3. **NO hagas commit** de `meta-pixel-config.js` (ya está en `.gitignore`)

### 3️⃣ Verificar la Instalación

#### A. Usando Meta Pixel Helper (Recomendado)

1. **Instala la extensión** "Meta Pixel Helper" en Google Chrome:
   - Ve a [Chrome Web Store](https://chrome.google.com/webstore)
   - Busca "Meta Pixel Helper" o "Facebook Pixel Helper"
   - Haz clic en **"Agregar a Chrome"**
   - Haz clic en **"Agregar extensión"**

2. **Verifica tu sitio**:
   - Abre tu sitio web: `https://feyomx.github.io/menucapibobba/`
   - Haz clic en el ícono de Meta Pixel Helper en la barra de herramientas
   - Deberías ver tu Pixel ID con un ícono **verde** ✅
   - Si ves errores rojos ❌, revisa tu configuración

3. **Prueba los eventos**:
   - **PageView**: Debería dispararse automáticamente al cargar la página
   - **AddToCart**: Agrega un producto al carrito
   - **InitiateCheckout**: Haz clic en "Realizar Pedido por WhatsApp"
   - **Contact**: Haz clic en el botón de WhatsApp del footer

#### B. Usando Events Manager

1. Ve a **Facebook Events Manager**
2. Selecciona tu Pixel
3. Haz clic en la pestaña **"Probar eventos"** (Test Events)
4. Abre tu sitio web en otra pestaña
5. Realiza acciones (agregar al carrito, iniciar pedido)
6. Ve al Events Manager - deberías ver los eventos aparecer en tiempo real

### 5️⃣ Modo Debug (Opcional)

Si quieres ver logs detallados en la consola del navegador:

1. Abre `meta-pixel-config.js`
2. Cambia `debug: false` a `debug: true`:
   ```javascript
   debug: true,  // Mostrar logs en consola
   ```
3. Abre la consola del navegador (F12)
4. Verás mensajes como:
   ```
   ✅ Meta Pixel inicializado: 123456789012345
   📊 Meta Pixel Event: AddToCart {content_name: "Frappé de Fresa", ...}
   ```

## 🔍 Eventos Implementados

El sitio de Capibobba rastrea automáticamente los siguientes eventos:

### 1. **PageView** 🌐
- **Cuándo se dispara**: Automáticamente cuando alguien visita el sitio
- **Propósito**: Contar visitantes únicos
- **Parámetros**: Ninguno

### 2. **AddToCart** 🛒
- **Cuándo se dispara**: Cuando un usuario agrega un producto al carrito
- **Propósito**: Medir interés en productos específicos
- **Parámetros**:
  - `content_name`: Nombre del producto
  - `content_category`: Categoría del producto
  - `content_ids`: ID del producto
  - `value`: Precio del producto
  - `currency`: MXN

### 3. **InitiateCheckout** 💬
- **Cuándo se dispara**: Cuando un usuario hace clic en "Realizar Pedido por WhatsApp"
- **Propósito**: Medir cuántas personas inician el proceso de compra
- **Parámetros**:
  - `content_ids`: IDs de todos los productos en el carrito
  - `contents`: Array con detalles de cada producto
  - `value`: Valor total del carrito
  - `currency`: MXN
  - `num_items`: Cantidad de productos

### 4. **Contact** 📱
- **Cuándo se dispara**: Cuando un usuario hace clic en el botón de WhatsApp
- **Propósito**: Medir el interés en contactar directamente
- **Parámetros**:
  - `contact_type`: "whatsapp"
  - `source`: "cart" o "footer"

## 📊 Cómo Usar los Datos

### En Facebook Ads Manager

1. **Crear audiencias personalizadas**:
   - Ve a Audiences > Create Audience > Custom Audience
   - Selecciona "Website Traffic"
   - Crea audiencias basadas en eventos (ej: personas que agregaron al carrito pero no compraron)

2. **Optimizar campañas**:
   - Al crear un anuncio, en "Optimization & Delivery"
   - Selecciona el evento que quieres optimizar (ej: "InitiateCheckout")
   - Facebook mostrará tus anuncios a personas más propensas a completar esa acción

3. **Crear audiencias similares (Lookalike)**:
   - Crea una audiencia de tus mejores clientes (quienes completaron InitiateCheckout)
   - Genera una Lookalike Audience para encontrar personas similares

### Métricas Importantes

En Events Manager podrás ver:
- **Total de eventos** por tipo
- **Tasa de conversión**: PageView → AddToCart → InitiateCheckout
- **Productos más populares** (los que más se agregan al carrito)
- **Valor promedio del carrito**
- **Embudo de conversión** completo

## 🔒 Seguridad y Privacidad

### Buenas Prácticas

1. **No rastrear información sensible**: El pixel NO debe enviar:
   - Datos personales (nombres, emails, teléfonos)
   - Información financiera
   - Contraseñas

2. **Política de privacidad**: Actualiza tu política de privacidad para mencionar:
   - Uso de Meta Pixel
   - Tracking de comportamiento
   - Cómo los usuarios pueden optar por no participar

3. **GDPR/Regulaciones**: Si tienes usuarios de Europa:
   - Implementa un banner de cookies
   - Obtén consentimiento antes de activar el pixel
   - Permite a usuarios optar por no participar

### Deshabilitar el Pixel Temporalmente

Si necesitas desactivar el tracking:

1. Abre `meta-pixel-config.js`
2. Cambia `enabled: true` a `enabled: false`:
   ```javascript
   enabled: false,  // Deshabilitar el pixel
   ```

## 🐛 Solución de Problemas

### ❌ El Pixel no se detecta

**Posibles causas:**
- Pixel ID incorrecto o no configurado
- El archivo `meta-pixel-config.js` no se carga
- Bloqueadores de anuncios activos

**Soluciones:**
1. Verifica que el Pixel ID sea correcto (15 dígitos)
2. Abre la consola del navegador (F12) y busca errores
3. Desactiva temporalmente bloqueadores de anuncios
4. Habilita `debug: true` para ver logs

### ❌ Los eventos no se disparan

**Posibles causas:**
- JavaScript deshabilitado
- Errores en el código
- Pixel no inicializado correctamente

**Soluciones:**
1. Verifica en la consola si hay errores JavaScript
2. Asegúrate de que `meta-pixel-config.js` se carga antes de `script.js`
3. Revisa que `window.metaPixel` esté disponible en la consola

### ⚠️ Eventos duplicados

**Posibles causas:**
- Múltiples instalaciones del pixel
- El pixel se inicializa dos veces

**Soluciones:**
1. Verifica que solo hay un `<script src="meta-pixel-config.js">` en el HTML
2. Meta Pixel Helper mostrará advertencias si hay duplicados

### 🔴 Error 403 o bloqueado

**Posibles causas:**
- Bloqueadores de anuncios (AdBlock, uBlock, etc.)
- Restricciones de red/empresa

**Soluciones:**
1. Prueba en navegación privada sin extensiones
2. Prueba desde otra red (datos móviles)
3. Los eventos se seguirán rastreando para usuarios sin bloqueadores

## 🎓 Recursos Adicionales

### Documentación Oficial
- [Meta Pixel - Documentación](https://developers.facebook.com/docs/meta-pixel/)
- [Events Manager](https://www.facebook.com/events_manager2)
- [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/)

### Tutoriales
- [Guía de Meta Pixel 2025](https://www.facebook.com/business/help/952192354843755)
- [Optimización de conversiones](https://www.facebook.com/business/learn/facebook-ads-pixel)

### Soporte
- [Centro de ayuda de Meta Business](https://www.facebook.com/business/help)
- [Comunidad de Meta Business](https://www.facebook.com/business/groups)

## 📞 Soporte del Proyecto

Si tienes problemas con la implementación del Meta Pixel en Capibobba:

1. Revisa esta guía completa
2. Verifica la configuración paso a paso
3. Activa el modo debug para ver logs detallados
4. Consulta la documentación oficial de Meta

---

**✨ ¡Listo!** Una vez configurado, podrás medir y optimizar tus campañas publicitarias con datos reales de comportamiento de usuarios en tu sitio web.

*Última actualización: Enero 2025*

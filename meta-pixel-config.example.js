/**
 * META PIXEL CONFIGURATION - EXAMPLE FILE
 * ========================================
 *
 * Este es un archivo de ejemplo para la configuración del Meta Pixel.
 * Copia este archivo como 'meta-pixel-config.js' y configura tu Pixel ID.
 *
 * PASOS PARA CONFIGURAR:
 * 1. Copia este archivo: cp meta-pixel-config.example.js meta-pixel-config.js
 * 2. Abre meta-pixel-config.js
 * 3. Reemplaza 'YOUR_PIXEL_ID_HERE' con tu Pixel ID real de 15 dígitos
 * 4. Guarda los cambios
 *
 * CÓMO OBTENER TU PIXEL ID:
 * 1. Ve a Facebook Business Manager (business.facebook.com)
 * 2. Abre Events Manager
 * 3. Selecciona tu Pixel o crea uno nuevo
 * 4. Copia el Pixel ID (15 dígitos)
 *
 * VERIFICACIÓN:
 * 1. Instala la extensión "Meta Pixel Helper" en Chrome
 * 2. Abre tu sitio web
 * 3. Verifica que el pixel se detecte correctamente
 *
 * @version 1.0.0
 */

// REEMPLAZA 'YOUR_PIXEL_ID_HERE' CON TU PIXEL ID REAL
const metaPixelConfig = {
  pixelId: 'YOUR_PIXEL_ID_HERE', // ⚠️ CAMBIAR ESTO
  enabled: true,
  debug: false
};

// NO MODIFIQUES EL CÓDIGO DEBAJO DE ESTA LÍNEA
// (a menos que sepas lo que estás haciendo)

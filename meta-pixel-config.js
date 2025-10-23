/**
 * META PIXEL CONFIGURATION
 * ========================
 *
 * Este archivo contiene la configuración del Meta Pixel (Facebook Pixel)
 * para rastrear eventos y conversiones en el sitio web.
 *
 * IMPORTANTE:
 * - Reemplaza 'YOUR_PIXEL_ID_HERE' con tu Pixel ID real de 15 dígitos
 * - Obtén tu Pixel ID desde Facebook Business Manager > Events Manager
 * - Para producción, usa GitHub Secrets para proteger el Pixel ID
 *
 * @version 1.0.0
 * @author Capibobba Dev Team
 */

// Configuración del Meta Pixel
const metaPixelConfig = {
  // Pixel ID de Capibobba
  pixelId: '1495356471713675',

  // Habilitar/deshabilitar el pixel (útil para desarrollo)
  enabled: true,

  // Configuración de debug (mostrar logs en consola)
  debug: false,

  // Configuración avanzada
  advanced: {
    // Automatic Advanced Matching (opcional)
    // Mejora el matching de usuarios con datos hasheados
    autoConfig: true,

    // Eventos personalizados para Capibobba
    customEvents: {
      viewMenu: 'ViewMenu',
      selectCategory: 'SelectCategory',
      viewProduct: 'ViewContent',
      addToCart: 'AddToCart',
      removeFromCart: 'RemoveFromCart',
      initiateCheckout: 'InitiateCheckout',
      contactWhatsApp: 'Contact'
    }
  }
};

/**
 * Inicializa el Meta Pixel
 * Carga el script de Facebook y configura el pixel
 */
function initMetaPixel() {
  // Verificar si el pixel está habilitado
  if (!metaPixelConfig.enabled) {
    if (metaPixelConfig.debug) {
      console.log('Meta Pixel está deshabilitado');
    }
    return;
  }

  // Verificar si el Pixel ID está configurado
  if (metaPixelConfig.pixelId === 'YOUR_PIXEL_ID_HERE') {
    console.warn('⚠️ Meta Pixel: Configura tu Pixel ID en meta-pixel-config.js');
    return;
  }

  // Base code de Meta Pixel (Facebook Pixel)
  !function(f,b,e,v,n,t,s) {
    if(f.fbq) return;
    n=f.fbq=function(){
      n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)
    };
    if(!f._fbq) f._fbq=n;
    n.push=n;
    n.loaded=!0;
    n.version='2.0';
    n.queue=[];
    t=b.createElement(e);
    t.async=!0;
    t.src=v;
    s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  // Inicializar el pixel con el ID configurado
  fbq('init', metaPixelConfig.pixelId);

  // Track automático de PageView
  fbq('track', 'PageView');

  if (metaPixelConfig.debug) {
    console.log('✅ Meta Pixel inicializado:', metaPixelConfig.pixelId);
  }
}

/**
 * Rastrea un evento estándar de Meta Pixel
 *
 * @param {string} eventName - Nombre del evento (ej: 'ViewContent', 'AddToCart')
 * @param {object} params - Parámetros del evento (opcional)
 */
function trackMetaEvent(eventName, params = {}) {
  if (!metaPixelConfig.enabled || typeof fbq === 'undefined') {
    return;
  }

  try {
    fbq('track', eventName, params);

    if (metaPixelConfig.debug) {
      console.log(`📊 Meta Pixel Event: ${eventName}`, params);
    }
  } catch (error) {
    console.error('Error al rastrear evento de Meta Pixel:', error);
  }
}

/**
 * Rastrea un evento personalizado de Meta Pixel
 *
 * @param {string} eventName - Nombre del evento personalizado
 * @param {object} params - Parámetros del evento (opcional)
 */
function trackCustomMetaEvent(eventName, params = {}) {
  if (!metaPixelConfig.enabled || typeof fbq === 'undefined') {
    return;
  }

  try {
    fbq('trackCustom', eventName, params);

    if (metaPixelConfig.debug) {
      console.log(`📊 Meta Pixel Custom Event: ${eventName}`, params);
    }
  } catch (error) {
    console.error('Error al rastrear evento personalizado:', error);
  }
}

/**
 * FUNCIONES DE TRACKING ESPECÍFICAS PARA CAPIBOBBA
 */

/**
 * Rastrea cuando un usuario ve un producto
 *
 * @param {object} product - Objeto del producto
 */
function trackProductView(product) {
  if (!product) return;

  trackMetaEvent('ViewContent', {
    content_name: product.name,
    content_category: product.category || product.type,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: 'MXN'
  });
}

/**
 * Rastrea cuando un usuario agrega un producto al carrito
 *
 * @param {object} product - Objeto del producto
 * @param {number} quantity - Cantidad agregada (default: 1)
 */
function trackAddToCart(product, quantity = 1) {
  if (!product) return;

  trackMetaEvent('AddToCart', {
    content_name: product.name,
    content_category: product.category || product.type,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price * quantity,
    currency: 'MXN',
    quantity: quantity
  });
}

/**
 * Rastrea cuando un usuario inicia el proceso de checkout (WhatsApp)
 *
 * @param {array} cartItems - Array de productos en el carrito
 * @param {number} totalValue - Valor total del pedido
 */
function trackInitiateCheckout(cartItems, totalValue) {
  if (!cartItems || cartItems.length === 0) return;

  const contentIds = cartItems.map(item => item.id || item.name);
  const contents = cartItems.map(item => ({
    id: item.id || item.name,
    quantity: item.quantity || 1,
    item_price: item.price
  }));

  trackMetaEvent('InitiateCheckout', {
    content_ids: contentIds,
    contents: contents,
    content_type: 'product',
    value: totalValue,
    currency: 'MXN',
    num_items: cartItems.length
  });
}

/**
 * Rastrea cuando un usuario hace contacto vía WhatsApp
 *
 * @param {string} source - Origen del contacto (ej: 'cart', 'header', 'footer')
 */
function trackWhatsAppContact(source = 'unknown') {
  trackMetaEvent('Contact', {
    contact_type: 'whatsapp',
    source: source
  });
}

/**
 * Rastrea cuando un usuario selecciona una categoría
 *
 * @param {string} categoryName - Nombre de la categoría
 */
function trackCategorySelection(categoryName) {
  trackCustomMetaEvent('SelectCategory', {
    category_name: categoryName
  });
}

// Inicializar el pixel cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMetaPixel);
} else {
  initMetaPixel();
}

// Exportar funciones para uso global
window.metaPixel = {
  track: trackMetaEvent,
  trackCustom: trackCustomMetaEvent,
  trackProductView,
  trackAddToCart,
  trackInitiateCheckout,
  trackWhatsAppContact,
  trackCategorySelection
};

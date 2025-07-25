💖 Menú Capibobba - Menú Digital con Panel de Administración en Tiempo Real 🧋

Este proyecto es un menú digital dinámico e interactivo para "Capibobba", una tienda de bebidas estilo Bubble Tea. La aplicación está dividida en dos partes principales: un **menú público** para los clientes y un **panel de administración** protegido para el dueño del negocio.

La principal característica es su capacidad de **actualización en tiempo real**. Cualquier cambio que el administrador realice en el panel (añadir un producto, cambiar un precio, etc.) se refleja instantáneamente en el menú de todos los clientes, sin necesidad de que recarguen la página. Esto se logra utilizando **Firebase** como backend.

✨ Características Principales

### 👩‍🍳 Panel de Administración (`admin.html`)
- **Autenticación Segura:** Acceso protegido mediante **Firebase Authentication**.
- **Gestión de Productos (CRUD):** Permite crear, leer, actualizar y eliminar productos fácilmente.
- **Navegación por Categorías:** Interfaz organizada para gestionar diferentes categorías de productos (Frappés, Bebidas Calientes, Toppings, etc.).
- **Actualizaciones en Tiempo Real:** Los cambios guardados se envían a **Firestore** y se reflejan inmediatamente en el menú público.
- **Importación/Exportación de Datos:** Funcionalidad para crear copias de seguridad del menú en un archivo JSON local.

### 😋 Menú para Clientes (`index.html`)
- **Diseño Kawaii y Atractivo:** Una interfaz vibrante y tierna con animaciones que reflejan la marca "Capibobba".
- **Menú Dinámico desde Firebase:** Carga todos los productos directamente desde Firestore, asegurando que el menú esté siempre actualizado.
- **Modo Claro/Oscuro Automático:** Se adapta al tema del sistema del usuario para una mejor experiencia visual.
- **Personalización de Bebidas:** Modales interactivos para que los clientes añadan toppings o personalicen bebidas especiales como la Chamoyada.
- **Carrito de Compras Flotante:** Un carrito de compras intuitivo que permite a los usuarios añadir, ver y eliminar productos, mostrando el total acumulado.
- **Pedido Directo por WhatsApp:** Genera automáticamente un mensaje de WhatsApp pre-llenado con el detalle del pedido, listo para ser enviado.
- **Diseño Responsivo:** Optimizado para una perfecta visualización y usabilidad en dispositivos móviles.

---

### 🛠️ Pila Tecnológica (Tech Stack)
- **Frontend:** HTML5, CSS3 (Flexbox, Grid), JavaScript (ES6+ Modules).
- **Backend:** **Firebase**
    - **Firestore:** Base de datos NoSQL en tiempo real para almacenar y sincronizar los datos del menú.
    - **Firebase Authentication:** Para proteger el panel de administración.
- **Frameworks:** ¡Ninguno! Este proyecto fue construido con **Vanilla JS** para demostrar un sólido dominio de las tecnologías web fundamentales.

---

### 🚀 Cómo Configurar y Ejecutar el Proyecto

1.  **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/tu-repositorio.git
    ```

2.  **Crear un Proyecto en Firebase:**
    - Ve a la Consola de Firebase y crea un nuevo proyecto.
    - En tu proyecto, ve a la sección **Build** y activa:
        - **Firestore Database:** Créala en modo de producción.
        - **Authentication:** Activa el proveedor de **Email/Contraseña**.
    - Crea un usuario administrador en la pestaña de `Users` de Authentication. Necesitarás este email y contraseña para acceder al panel.

3.  **Obtener la Configuración de Firebase:**
    - En la configuración de tu proyecto de Firebase (`Project Settings`), crea una nueva aplicación web (icono `</>`).
    - Copia el objeto de configuración `firebaseConfig`.

4.  **Configurar el Proyecto Localmente:**
    - En la raíz de tu proyecto, encontrarás un archivo llamado `firebase-config.example.js`.
    - **Renombra** ese archivo a `firebase-config.js`.
    - Abre el nuevo `firebase-config.js` y pega el objeto `firebaseConfig` que copiaste de tu consola de Firebase.
    ```javascript
    // firebase-config.js
    export const firebaseConfig = {
        apiKey: "TU_API_KEY_AQUI",
        authDomain: "TU_PROJECT_ID.firebaseapp.com",
        // ... y el resto de tus claves
    };
    ```

5.  **Ejecutar el Proyecto:**
    - Debido al uso de Módulos de JavaScript (`import`/`export`), no puedes abrir los archivos `index.html` y `admin.html` directamente en el navegador desde el sistema de archivos (`file://...`).
    - Debes servirlos a través de un servidor local. La forma más fácil es usar la extensión **Live Server** en Visual Studio Code. Haz clic derecho en `index.html` o `admin.html` y selecciona "Open with Live Server".

6.  **Acceder al Panel de Administración:**
    - Navega a `admin.html`. Se te pedirá que inicies sesión en la consola de Firebase primero.
    - Una vez que hayas iniciado sesión en Firebase en tu navegador, refresca la página `admin.html` y tendrás acceso al panel.

---

### 📂 Estructura del Proyecto

```
/
├── index.html              # Menú público para clientes.
├── script.js               # Lógica del menú público (carga de datos, carrito, WhatsApp).
├── styles.css              # Estilos para el menú público.
|
├── admin.html              # Panel de administración.
├── admin-script.js         # Lógica del panel (CRUD con Firestore, auth).
├── admin-styles.css        # Estilos para el panel de administración.
|
└── firebase-config.js      # Configuración centralizada de Firebase (¡IMPORTANTE!).
```

---
¡Esperamos que disfrutes usando y personalizando el Menú Capibobba tanto como nosotros disfrutamos creándolo! 💖

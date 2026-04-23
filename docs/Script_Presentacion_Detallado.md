# Guion Técnico Detallado - Presentación de Avance 2
**Proyecto:** Marketplace Escolar ITSUR

Este documento contiene el "Script" palabra por palabra para las secciones más técnicas de la presentación, asegurando que cada integrante explique los flujos y diagramas con precisión.

---

## 🎙️ Jovanny Lobato (JLG) - Apertura y Sincronización Real-Time

**Slide 2 (Introducción):** 
> "Buenos días. Nuestro proyecto, el Marketplace Escolar, nace de la necesidad de formalizar el intercambio de productos académicos en el ITSUR. Pero más allá de ser un catálogo móvil, lo que hoy les presentamos es un ecosistema reactivo. Nuestra visión es fomentar la economía circular institucional, permitiendo que un libro o herramienta que ya no usas, llegue a manos de otro estudiante de forma inmediata."

**Slide 8 (Arquitectura y Tiempo Real):**
> **(Acción: Mostrar Diagrama de Sincronización)**
> "Aquí pueden ver el motor de nuestra app. A diferencia de las aplicaciones tradicionales que requieren 'refrescar' para ver cambios, nosotros implementamos **Listeners de Firestore (`onSnapshot`)**. 
>
> Explico el flujo: Cuando un 'Usuario A' marca un producto como vendido, el servidor de Firebase detecta el cambio en el documento y dispara una señal automática a todos los 'Usuarios B' suscritos. En milisegundos, la interfaz de todos los compradores se actualiza sola. Esto no solo da una sensación prémium, sino que evita transacciones duplicadas por información desactualizada."

---

## 🎙️ Angel Ivan Rocha (AIRM) - Gestión de Ciclo de Vida (CRUD)

**Slide 5 (Gestión de Productos):**
> "Mi parte en el desarrollo se enfocó en el ciclo de vida del producto. Hemos logrado un **CRUD completo**. Esto significa que el vendedor tiene control absoluto: puede crear su oferta, leer cómo se ve para los demás, editar detalles si se equivocó y, por seguridad, eliminarla permanentemente. 
>
> Un detalle técnico importante es que hemos implementado **diálogos de confirmación multiplataforma**. No importa si usas el buscador en la web de tu PC o en la app de tu Android; la experiencia de confirmación y seguridad es consistente y segura."

---

## 🎙️ Caleb Zacarias (CZG) - Ingeniería Multimedia (El Viaje de la Imagen)

**Slide 6 (Multimedia):**
> **(Acción: Mostrar Diagrama del Viaje de la Imagen)**
> "Muchos se preguntan: ¿Qué pasa desde que doy clic en la cámara hasta que la foto aparece en el Home? Este es el flujo técnico que diseñamos:
>
> 1. **Selección:** Primero, el `Image Picker` captura la imagen en crudo.
> 2. **Optimización Crucial:** Aquí es donde innovamos. No subimos fotos de 5 megas. Usamos un `Manipulator` que, por código, redimensiona la imagen a **800 píxeles de ancho** y aplica una **compresión del 70%**. 
> 3. **Base64:** El resultado lo convertimos en un string `Base64`. ¿Por qué? Porque al guardarlo directamente en el documento de Firestore, eliminamos la latencia de descargar archivos de servidores externos. 
>
> El resultado final es una carga visual inmediata tanto en el muro principal como en el detalle del producto, optimizando el uso de datos del estudiante."

---

## 🎙️ Jovani Zavala (JZG) - Búsqueda Inteligente y UX

**Slide 7 (Búsqueda e Interfaz):**
> "Para que un marketplace con cientos de productos sea útil, la búsqueda debe ser ultra eficiente. Implementamos dos optimizaciones clave:
>
> 1. **Debounce de 300 milisegundos:** Esto significa que si el usuario escribe rápido, la app espera esos milisegundos a que termine antes de filtrar. Así evitamos procesar cada letra y logramos que la interfaz nunca se sienta lenta.
> 2. **Normalización de Texto:** Nuestro motor limpia la búsqueda; quita acentos, ignora mayúsculas y espacios extra. Si buscas 'CÁLCULO' con acento o 'calculo' sin él, el resultado será el mismo.
>
> Además, combinamos esto con **Filtros por Categorías**, permitiendo que el usuario encuentre lo que necesita en menos de tres clics."

---

## 💡 Tips para el momento de preguntas (Q&A)

*   **Si preguntan por el almacenamiento:** "Usamos Base64 optimizado porque los documentos de Firestore permiten hasta 1MB, y nuestras fotos optimizadas pesan menos de 100KB. Es un balance perfecto entre velocidad y almacenamiento."
*   **Si preguntan por la escalabilidad:** "La estructura por capas que usamos (Services -> Context -> UI) permite que en el futuro podamos migrar a una base de datos más grande sin cambiar el diseño de la aplicación."

---

# Estructura Maestra de Presentación (2do Avance) - Marketplace ITSUR
**Equipo:** Jovani Zavala, Angel Rocha, Caleb Zacarias, Jovanny Lobato.

Esta versión integra los detalles técnicos del módulo de gestión de productos, multimedia y búsqueda en tiempo real dentro de la estructura formal solicitado.

---

## Diapositiva 1: Portada
*   **Proyecto:** Marketplace Escolar
*   **Integrantes:** 
    *   Jovani Zavala Guerrero (JZG)
    *   Angel Ivan Rocha Martinez (AIRM)
    *   Caleb Zacarias Garcia (CZG)
    *   Jovanny Lobato Garcia (JLG)
*   **Materia:** Taller de Investigación II
*   **Avance:** Segundo Avance (Semana 12)

---

## Diapositiva 2: Introducción y Propósito
*   **Speaker: Jovanny Lobato (JLG)**
*   **Contenido:**
    *   Objetivo: Plataforma para fomentar la **Economía Circular** dentro del ITSUR.
    *   Solución: Un ecosistema digital centralizado, seguro y eficiente.
    *   **Punto Clave:** "Ayudando a la economía circular dentro de la institución."

---

## Diapositiva 3: Metodología y Fase Actual
*   **Speaker: Jovani Zavala (JZG)**
*   **Contenido:**
    *   Enfoque mixto: Cualitativo (Diseño) y Cuantitativo (Requerimientos).
    *   **Fase 3 (Desarrollo):** Estamos integrando lógica de negocio con persistencia en la nube.
    *   Arquitectura basada en el patrón por capas para escalabilidad.

---

## Diapositiva 4: Actividades Realizadas (Semana 1-12)
*   **Speaker: Angel Ivan Rocha (AIRM)**
*   **Estatus:**
    *   ✅ **Diseño NoSQL:** 100%
    *   ✅ **Gestión de Productos (CRUD):** 100% (Completado esta semana).
    *   ✅ **Integración Multimedia:** 100% (Optimización de carga).
    *   ✅ **Búsqueda y Sync en Tiempo Real:** 100% (Funcionalidad avanzada).

---

## Diapositiva 5: Desarrollo Técnico - Gestión de Productos (CRUD)
*   **Speaker: Angel Ivan Rocha (AIRM)**
*   **Detalle:**
    *   Explicación de cómo el usuario puede: Publicar, Leer, Editar y Eliminar sus artículos.
    *   Manejo de estados: `active` -> `sold` -> `completed`.
    *   **Seguridad:** Validación de propiedad para edición y diálogos de confirmación multiplataforma.

---

## Diapositiva 6: Desarrollo Técnico - Multimedia y Optimización
*   **Speaker: Caleb Zacarias (CZG)**
*   **El "Viaje de la Imagen":**
    1. **Clic:** Selección mediante `expo-image-picker`.
    2. **Proceso:** `ImageManipulator` redimensiona a 800px y comprime al 70% (eficiencia).
    3. **Persistencia:** Conversión a **Base64** para almacenamiento directo en Firestore.
    4. **Resultado:** Carga instantánea sin latencia de descarga de servidores externos.
*   *(Mostrar Diagrama A de la guía técnica)*

---

## Diapositiva 7: Desarrollo Técnico - Búsqueda y Reactividad
*   **Speaker: Jovani Zavala (JZG)**
*   **Innovación:**
    *   **Debounce (300ms):** Búsqueda fluida sin degradar el rendimiento del dispositivo.
    *   **Normalización:** Búsqueda inteligente que ignora acentos y mayúsculas.
    *   **Sincronización:** Uso de `onSnapshot` para que los cambios se vean en todos los usuarios sin recargar.

---

## Diapositiva 8: Arquitectura de Datos y Tiempo Real
*   **Speaker: Jovanny Lobato (JLG)**
*   **Contenido:**
    *   Modelo de datos en Firestore.
    *   Explicación del flujo de sincronización: Un cambio en el vendedor se refleja en milisegundos en el comprador.
*   *(Mostrar Diagrama B de la guía técnica)*

---

## Diapositiva 9: Evidencias de Avance (Capturas Reales)
*   **Contenido Visual:**
    *   Captura 1: Formulario de venta con previsualización de imagen.
    *   Captura 2: Resultados del buscador filtrados por categoría.
    *   Captura 3: Consola de Firebase con documentos `products`.

---

## Diapositiva 10: Dificultades y Retos Superados
*   **Reto:** Curva de aprendizaje en la sincronización reactiva de estados con Firebase.
*   **Reto:** Optimización de imágenes en web móvil (bypass de selectores nativos).
*   **Solución:** Investigación profunda en documentación de Expo y refactorización de servicios a listeners en tiempo real.

---

## Diapositiva 11: Próximos Pasos e Inicio de Pruebas
*   Periodo de pruebas unitarias y de usabilidad (Semana 13).
*   Documentación de resultados finales en el informe escrito.

---

## Diapositiva 12: Cierre y Preguntas
*   Agradecimiento y espacio para dudas de los evaluadores.

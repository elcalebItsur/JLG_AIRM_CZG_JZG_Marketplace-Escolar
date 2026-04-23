# Capítulo 5: Metodología

La presente investigación tiene como objetivo el diseño y desarrollo de una plataforma web tipo marketplace escolar para el Instituto Tecnológico Superior del Sur de Guanajuato (ITSUR). Para lograr este propósito, se ha estructurado un diseño metodológico que orienta el proceso de investigación y desarrollo del software, describiendo el lugar de implementación, las etapas realizadas y la forma en que se ejecutaron.

## 5.1 Tipo de investigación
La investigación desarrollada es de tipo **aplicada** y **descriptiva**. Es aplicada porque busca resolver un problema práctico y específico: la informalidad y falta de centralización en la compra-venta de productos académicos en el ITSUR, mediante la creación de un producto tecnológico (Marketplace Escolar). Es descriptiva porque detalla las características, necesidades y comportamientos de los estudiantes y docentes respecto al intercambio de bienes escolares, sirviendo como base para el diseño del sistema.

## 5.2 Enfoque de la investigación
Se empleó un enfoque **mixto** (cuantitativo y cualitativo).
*   **Cuantitativo:** Utilizado durante la fase de levantamiento de requerimientos mediante la aplicación de encuestas, lo que permitió medir la frecuencia de transacciones, los métodos preferidos por los estudiantes y el nivel de aceptación de una nueva plataforma.
*   **Cualitativo:** Aplicado en el análisis de las necesidades específicas de los usuarios, la evaluación de la usabilidad de las interfaces y la selección de las tecnologías más adecuadas (React Native, Firebase) para resolver el problema planteado.

## 5.3 Diseño de la investigación
El diseño de la investigación es **no experimental y transversal** en su fase de diagnóstico, ya que se recolectaron los datos de los usuarios en un solo momento sin manipular variables, con el único fin de describir el contexto actual del problema. Posteriormente, adopta un diseño de **desarrollo tecnológico** basado en iteraciones, propio de la ingeniería de software, donde se construye, prueba y refina el sistema a través de diferentes fases.

## 5.4 Población y muestra
*   **Población:** La comunidad estudiantil y docente del Instituto Tecnológico Superior del Sur de Guanajuato (ITSUR).
*   **Muestra:** Se determinó una muestra representativa de estudiantes de diferentes semestres y carreras para la aplicación de encuestas de levantamiento de requerimientos y para las posteriores pruebas de usabilidad del prototipo.

## 5.5 Técnicas e instrumentos de recolección de datos
*   **Encuestas estructuradas:** Cuestionarios digitales (vía Google Forms) dirigidos a la comunidad del ITSUR para identificar los canales actuales de compra-venta, los problemas más frecuentes y las características deseadas en la nueva plataforma.
*   **Observación directa:** Análisis de los grupos de redes sociales donde actualmente se llevan a cabo las transacciones para identificar carencias de estructura y trazabilidad.

### 5.5.1 Herramientas Tecnológicas de Desarrollo
Para la implementación técnica, se seleccionaron herramientas que permiten un desarrollo ágil y multiplataforma:
*   **Framework:** React Native con Expo para asegurar la portabilidad entre sistemas operativos iOS y Android, además de permitir despliegues web rápidos.
*   **Backend as a Service (BaaS):** Google Firebase, específicamente **Cloud Firestore** para la gestión de datos persistentes y reactivos, y **Firebase Authentication** para la seguridad de acceso institucional.
*   **Herramientas de Diseño:** Figma para el prototipado de interfaces (UI) y flujos de experiencia de usuario (UX).

## 5.6 Procedimiento (Fases de la investigación)
La ejecución del proyecto se estructuró en cinco fases fundamentales, alineadas estrechamente con el cronograma de actividades:

*   **Fase 1: Investigación:** (Semanas 1-3) - Levantamiento de requerimientos mediante encuestas y su posterior análisis para definir los requerimientos funcionales y no funcionales del sistema.
*   **Fase 2: Diseño Técnico:** (Semanas 4-9) - Diseño de la arquitectura de la base de datos NoSQL y prototipado UI/UX en capas para asegurar la escalabilidad.
*   **Fase 3: Desarrollo Tecnológico:** (Semanas 9-12) - Esta fase se centró en la codificación de los módulos core mediante un **Patrón de Arquitectura por Capas** (Components, Services, Context hooks).
    *   **Integración de CRUD:** Implementación de las funciones de Creación, Lectura, Actualización y Eliminación de productos, permitiendo al usuario una gestión autónoma de sus activos.
    *   **Servicio Multimedia Avanzado:** Implementación de un middleware de procesamiento de imágenes que utiliza `expo-image-manipulator` para redimensionar y comprimir fotos antes de su conversión a **Base64**, optimizando el almacenamiento en Firestore.
    *   **Motor de Búsqueda y Reactividad:** Desarrollo de algoritmos de filtrado asíncronos con lógica de **Debounce** (300ms) y normalización de texto. Integración de oyentes en tiempo real (`onSnapshot`) para asegurar que la información sea siempre coherente entre todos los usuarios conectados.
*   **Fase 4: Evaluación:** (Semanas 13-14) - Ejecución de pruebas unitarias y de usabilidad. Se utiliza la retroalimentación cualitativa para el refinamiento de flujos críticos (vender, comprar, buscar).
*   **Fase 5: Cierre:** (Semana 15) - Preparación del Build Final y entrega del reporte técnico final detallando los resultados obtenidos.

## 5.7 Análisis de datos
El análisis de los datos se divide en dos vertientes:
1.  **Análisis de requerimientos:** Los datos cuantitativos obtenidos de las encuestas se tabularon y graficaron para identificar las tendencias de consumo y las funcionalidades prioritarias (ej. métodos de filtrado, chat integrado).
2.  **Validación de Rendimiento y Usabilidad:** Durante la Fase 4, se analizan los reportes de errores (bugs) y la latencia del sistema bajo carga de imágenes. Evaluamos cualitativamente la eficacia de la sincronización en tiempo real para determinar si se cumplen los estándares mínimos de un marketplace profesional para la comunidad del ITSUR.

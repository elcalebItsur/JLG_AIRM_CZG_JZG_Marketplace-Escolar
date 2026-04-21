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
*   **Población:** La población objeto de estudio está conformada por la comunidad estudiantil y docente del Instituto Tecnológico Superior del Sur de Guanajuato (ITSUR).
*   **Muestra:** Se determinó una muestra representativa de estudiantes de diferentes semestres y carreras para la aplicación de encuestas de levantamiento de requerimientos y para las posteriores pruebas de usabilidad del prototipo. *(Nota para los alumnos: Es recomendable especificar aquí el número exacto de personas encuestadas si cuentan con el dato).*

## 5.5 Técnicas e instrumentos de recolección de datos
*   **Encuestas estructuradas:** Se utilizaron cuestionarios digitales (vía Google Forms) dirigidos a la comunidad del ITSUR para identificar los canales actuales de compra-venta, los problemas más frecuentes y las características deseadas en la nueva plataforma.
*   **Observación directa:** Análisis de los grupos de Facebook, WhatsApp y otras redes sociales donde actualmente se llevan a cabo las transacciones, para identificar carencias de estructura y trazabilidad.

## 5.6 Procedimiento (Fases de la investigación)
La ejecución del proyecto se estructuró en cinco fases fundamentales, alineadas estrechamente con el cronograma de actividades:

*   **Fase 1: Investigación:** Comprendió el levantamiento de requerimientos mediante encuestas y su posterior análisis. A partir de los resultados, se definieron los requerimientos funcionales y no funcionales del sistema (Semanas 1-3).
*   **Fase 2: Diseño Técnico:** Involucró el diseño de la arquitectura de la base de datos (Semanas 4-5) y el diseño de las interfaces de usuario (UI) con React (Semanas 6-9), definiendo una arquitectura en capas para asegurar la escalabilidad. Además, se realizó el prototipado UI/UX.
*   **Fase 3: Desarrollo (Fase Actual):** Consiste en la implementación del patrón por capas y la integración de las tecnologías principales: React Native en el frontend y Firebase en el backend. Actualmente, se ha completado la codificación del módulo central de gestión de productos (publicación, edición, categorización) (Semanas 7-12) y se encuentra en proceso la integración de servicios multimedia y de búsqueda.
*   **Fase 4: Evaluación (Próxima a iniciar):** Contempla la ejecución de pruebas unitarias y de usabilidad del sistema. Se documentarán los resultados en bitácoras y repositorios para proceder al refinamiento del sistema (Semanas 13-14).
*   **Fase 5: Cierre:** Preparación del "Build Final" de la aplicación y el lanzamiento de la plataforma, acompañado de la entrega del reporte técnico final (Semana 15).

## 5.7 Análisis de datos (propuesto)
El análisis de los datos se divide en dos vertientes:
1.  **Análisis de requerimientos:** Los datos cuantitativos obtenidos de las encuestas se tabularon y graficaron para identificar las tendencias de consumo y las funcionalidades prioritarias (ej. métodos de filtrado, chat integrado).
2.  **Análisis de pruebas del sistema:** Durante la Fase 4, los resultados de las pruebas de usabilidad y los reportes de errores (bugs) generados durante la interacción con el prototipo serán documentados y analizados cualitativamente. Se evaluará el rendimiento de la aplicación para determinar si se cumplen los objetivos técnicos planteados inicialmente, aplicando los ajustes necesarios para el lanzamiento final.

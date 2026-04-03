# Metodología: Marketplace Escolar ITSUR (Flujo Vertical)

Esta versión es **vertical** y muestra que la **Documentación** es un proceso continuo en cada etapa, tal como pediste. 

---

### 📊 Diagrama de Procesos con Documentación Integrada
Copia este código y pégalo en [Mermaid Live Editor](https://mermaid.live/).

```mermaid
graph TD
    subgraph "Fase 1: INVESTIGACIÓN"
    A[Encuestas y Análisis] --> B[Definición de Requerimientos]
    B --> Doc1[<b>Entregable:</b><br/>Documento de Requerimientos]
    end

    Doc1 --> C

    subgraph "Fase 2: DISEÑO TÉCNICO"
    C[Arquitectura en Capas] --> D[Prototipado UI/UX]
    D --> Doc2[<b>Entregable:</b><br/>Especificación de Diseño]
    end

    Doc2 --> E

    subgraph "Fase 3: DESARROLLO (Actual)"
    E[Integración React Native/Firebase] --> F[Codificación de Módulos Core]
    F --> Doc3[<b>Entregable:</b><br/>Bitácora y Repositorio]
    end

    Doc3 --> G

    subgraph "Fase 4: EVALUACIÓN"
    G[Pruebas con Comunidad ITSUR] --> H[Refinamiento del Sistema]
    H --> Doc4[<b>Entregable:</b><br/>Reporte de Validación]
    end

    Doc4 --> I

    subgraph "Fase 5: CIERRE"
    I[Preparación de Build Final] --> J[Lanzamiento de Plataforma]
    J --> Doc5[<b>Entregable:</b><br/>Memoria Técnica Final]
    end

    %% Estilos Profesionales
    style Doc1 fill:#fff9c4,stroke:#fbc02d,stroke-dasharray: 5 5
    style Doc2 fill:#fff9c4,stroke:#fbc02d,stroke-dasharray: 5 5
    style Doc3 fill:#fff9c4,stroke:#fbc02d,stroke-dasharray: 5 5
    style Doc4 fill:#fff9c4,stroke:#fbc02d,stroke-dasharray: 5 5
    style Doc5 fill:#fff9c4,stroke:#fbc02d,stroke-dasharray: 5 5
    style E fill:#e1f5fe,stroke:#01579b,stroke-width:3px
```

---

### 💡 Guion para tu presentación (Enfoque Documental)
Para que se vea muy profesional el jueves, menciona esto:

*   **"Metodología Documentada":** "Nuestra metodología no deja los papeles para el final. Como ven en el diagrama, cada fase cierra con un entregable documental que garantiza la trazabilidad del proyecto".
*   **"Validación por Etapas":** "Esto nos permite que, por ejemplo, antes de programar en la Fase 3, ya tengamos un documento de diseño aprobado en la Fase 2".
*   **"Estado Real":** "Actualmente estamos en la **Fase 3**, trabajando simultáneamente en el código (React Native/Firebase) y en nuestra bitácora de avances técnicos".

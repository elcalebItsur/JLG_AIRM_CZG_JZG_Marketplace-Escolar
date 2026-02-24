# INSTITUTO TECNOLÓGICO SUPERIOR DE URUAPAN
## Departamento de Sistemas y Computación
### Informe de Residencias Profesionales — Semana 6
**Proyecto:** Marketplace Escolar ITSUR  
**Fecha:** Febrero 2026  
**Equipo:** JLG, AIRM, CZG, JZG

---

## 1. Introducción

El presente informe documenta los avances del proyecto de residencias profesionales correspondientes a la semana 6, el cual consiste en el desarrollo de una plataforma de comercio electrónico estudiantil denominada **"Marketplace Escolar ITSUR"**. Dicha plataforma tiene como propósito facilitar la compra y venta de artículos entre la comunidad estudiantil del Instituto Tecnológico Superior de Uruapan, proporcionando un entorno digital seguro, accesible y adaptado al contexto institucional.

En esta entrega se presentan los resultados del levantamiento de requerimientos mediante encuesta, el diseño de la arquitectura de base de datos, los avances del diseño de interfaz de usuario (UI) implementados con React Native / Expo, y los elementos formales del informe de residencias.

---

## 2. Planteamiento del Problema

Actualmente, los estudiantes del ITSUR no cuentan con una plataforma oficial y estructurada para realizar intercambios comerciales dentro de la institución. La compraventa de artículos como apuntes, libros, materiales de papelería, dispositivos electrónicos y uniformes se realiza de manera informal, principalmente a través de grupos de WhatsApp o redes sociales sin ningún tipo de control, seguridad ni trazabilidad.

Esta situación genera los siguientes problemas:
- **Falta de seguridad**: No existe verificación de identidad entre comprador y vendedor.
- **Desconfianza**: Los usuarios no cuentan con mecanismos de calificación o reputación.
- **Fragmentación**: Los anuncios están dispersos en múltiples plataformas y grupos.
- **Exclusión**: No todos los estudiantes tienen acceso o conocen los grupos de intercambio.

---

## 3. Justificación

El desarrollo de un Marketplace Escolar centralizado y oficial representa una solución directa a la problemática identificada. La plataforma permitirá:

- **Centralizar** todos los anuncios en un solo lugar de fácil acceso.
- **Autenticar** a los usuarios mediante su correo institucional (`@itsur.edu.mx`), garantizando que solo miembros de la comunidad participen.
- **Profesionalizar** el proceso de compraventa estudiantil con categorías, imágenes y descripciones claras.
- **Ofrecer control administrativo** para moderar publicaciones y gestionar usuarios.

Académicamente, el proyecto permite aplicar competencias de desarrollo de software multiplataforma, arquitectura de sistemas, gestión de bases de datos en tiempo real y diseño UX/UI, en un contexto real y de impacto directo para la comunidad.

---

## 4. Alcance

**Incluye:**
- Registro e inicio de sesión con correo institucional ITSUR.
- Publicación de productos con nombre, descripción, precio, categoría e imagen.
- Visualización de catálogo general de productos activos.
- Panel de "Mis publicaciones" por usuario.
- Panel de administración para moderación.
- Plataforma multiplataforma (Web + Móvil) mediante React Native / Expo.
- Almacenamiento en Firebase (Auth + Firestore + Storage).

**No incluye (versión actual):**
- Pasarela de pago integrada (pagos se coordinan externamente).
- Sistema de mensajería en tiempo real entre usuarios.
- Funcionalidades de calificación o reseñas.

---

## 5. Objetivo General y Objetivos Específicos

### Objetivo General
Desarrollar una plataforma digital de compraventa estudiantil para la comunidad del ITSUR, que garantice seguridad mediante autenticación institucional, accesibilidad multiplataforma y una experiencia de usuario intuitiva.

### Objetivos Específicos
1. Diseñar e implementar un sistema de autenticación basado en correo institucional `@itsur.edu.mx`.
2. Implementar la capa de datos en Firebase Firestore para el almacenamiento de productos y usuarios en tiempo real.
3. Desarrollar las interfaces de usuario con React Native (Expo) para las plataformas Web y Móvil.
4. Implementar una arquitectura en capas (Layered Architecture) que separe la lógica de UI, negocio y acceso a datos.
5. Desarrollar un panel de administración para la moderación de publicaciones y gestión de usuarios.
6. Validar los requerimientos del sistema mediante encuesta aplicada a estudiantes de la institución.

---

## 6. Levantamiento de Requerimientos y Análisis del Sistema

### 6.1 Metodología de Levantamiento
Se diseñó y aplicó una encuesta dirigida a estudiantes del ITSUR con el objetivo de validar la necesidad de la plataforma e identificar los requerimientos funcionales y no funcionales del sistema.

**Hallazgos clave de la encuesta:**
- **+80%** de los encuestados afirmó haber comprado o vendido artículos a compañeros durante su trayectoria escolar.
- **+70%** indicó haber tenido problemas con informalidad, desconfianza o falta de seguridad en estas transacciones.
- **+75%** expresó interés en utilizar una plataforma oficial de intercambio escolar si existiera.
- Las categorías más demandadas fueron: Libros/Apuntes, Electrónicos y Material de papelería.

> **Vinculación con el diseño:** Estos resultados justifican directamente las tres decisiones de diseño principales del sistema: (1) la autenticación por correo institucional como mecanismo de confianza, (2) el sistema de categorías de productos, y (3) la priorización de la version web como plataforma de acceso principal.

---

### 6.2 Requerimientos Funcionales

| ID  | Requerimiento |
|-----|--------------|
| RF01 | El sistema deberá permitir el registro de usuarios únicamente con correo `@itsur.edu.mx`. |
| RF02 | El sistema deberá autenticar a los usuarios con correo y contraseña. |
| RF03 | El sistema deberá permitir publicar productos con: nombre, descripción, precio, categoría e imagen. |
| RF04 | El sistema deberá mostrar un catálogo de todos los productos activos. |
| RF05 | El sistema deberá permitir al usuario ver el detalle de un producto individual. |
| RF06 | El sistema deberá permitir al usuario gestionar (ver y eliminar) sus propias publicaciones. |
| RF07 | El sistema deberá contar con un panel de administración para usuarios con rol `admin`. |
| RF08 | El sistema deberá asignar automáticamente el rol de administrador al correo del docente/admin. |
| RF09 | El sistema deberá mantener la sesión del usuario activa entre reinicios de la app. |

### 6.3 Requerimientos No Funcionales

| ID  | Requerimiento |
|-----|--------------|
| RNF01 | La plataforma deberá ser compatible con navegadores web y dispositivos móviles (iOS/Android). |
| RNF02 | El tiempo de respuesta en operaciones de lectura no deberá exceder los 3 segundos. |
| RNF03 | Las credenciales de acceso a servicios externos (Firebase) deberán almacenarse en variables de entorno. |
| RNF04 | El sistema deberá utilizar HTTPS para todas las comunicaciones. |
| RNF05 | El código fuente deberá seguir la arquitectura en capas definida en el diseño. |

---

## 7. Diseño de la Arquitectura de Base de Datos

### 7.1 Motor de Base de Datos
Se utiliza **Firebase Firestore**, una base de datos NoSQL orientada a documentos, que ofrece sincronización en tiempo real, escalabilidad automática y acceso sin servidor.

### 7.2 Colecciones (Entidades Principales)

#### `users` — Usuarios del sistema
```
users/
  └── {uid}/                      ← ID generado por Firebase Auth
        ├── id: string
        ├── displayName: string
        ├── email: string
        ├── role: 'student' | 'teacher' | 'admin'
        └── createdAt: string (ISO 8601)
```

#### `products` — Publicaciones de productos
```
products/
  └── {productId}/                ← ID autogenerado por Firestore
        ├── id: string
        ├── title: string
        ├── description: string
        ├── price: number
        ├── category: string      ← 'libros', 'electronica', 'ropa', etc.
        ├── images: string[]      ← URLs en Firebase Storage
        ├── sellerId: string      ← Referencia al uid del vendedor
        ├── sellerName: string
        ├── status: 'active' | 'sold' | 'deleted'
        └── createdAt: string (ISO 8601)
```

### 7.3 Diagrama Entidad-Relación (Simplificado)

```
┌─────────────────────────────┐          ┌──────────────────────────────┐
│           USERS              │          │           PRODUCTS            │
├─────────────────────────────┤          ├──────────────────────────────┤
│ PK  id (uid)                │ 1    N   │ PK  id                       │
│     displayName             │──────────│     title                    │
│     email                   │          │     description              │
│     role                    │          │     price                    │
│     createdAt               │          │     category                 │
└─────────────────────────────┘          │     images[]                 │
                                         │ FK  sellerId → users.id      │
                                         │     sellerName               │
                                         │     status                   │
                                         │     createdAt                │
                                         └──────────────────────────────┘

                              ┌──────────────────────────────┐
                              │       FIREBASE STORAGE       │
                              ├──────────────────────────────┤
                              │  /products/{timestamp}.jpg   │
                              │  (Referenciado por images[]) │
                              └──────────────────────────────┘
```

### 7.4 Reglas de Seguridad (Firestore)
En modo de desarrollo se utiliza "Modo de Prueba". Para producción se definirán reglas que garanticen:
- Solo el propietario (`sellerId == auth.uid`) puede modificar/eliminar su producto.
- Solo usuarios autenticados pueden publicar.
- Los usuarios con rol `admin` pueden leer y modificar cualquier documento.

---

## 8. Avances del Diseño de Interfaz (UI con React Native / Expo)

### 8.1 Tecnologías de Interfaz
- **Framework:** React Native con Expo SDK 52
- **Enrutamiento:** Expo Router (basado en archivos, similar a Next.js)
- **Plataformas:** Web (navegador) + iOS/Android (Expo Go)

### 8.2 Pantallas Implementadas

| Pantalla | Descripción |
|----------|-------------|
| **Login** | Formulario de inicio de sesión con validación de correo institucional. |
| **Registro** | Formulario de registro con nombre, correo y contraseña. Asigna rol automáticamente. |
| **Home / Catálogo** | Grid de tarjetas de productos con imagen, nombre y precio. |
| **Detalle de Producto** | Vista completa del producto con descripción, precio y datos del vendedor. |
| **Publicar Producto** | Formulario para crear nuevas publicaciones con selección de imagen. |
| **Mis Publicaciones** | Lista de productos del usuario autenticado. |
| **Perfil** | Información del usuario y accesos a secciones. |
| **Panel Admin** | Dashboard de administración (acceso restringido por rol). |

### 8.3 Sistema de Diseño
Se implementó un sistema de diseño con tokens centralizados:
- **Colores:** Paleta institucional definida en `src/theme/colors.ts`.
- **Tipografía:** Escala de texto definida en `src/theme/typography.ts`.
- **Componentes:** `ProductCard`, `ScreenWrapper` reutilizables.

### 8.4 Flujo General de la Plataforma

```
┌──────────────┐     No autenticado      ┌──────────────┐
│   App Start   │────────────────────────►│  Login/Reg.  │
└──────────────┘                         └──────┬───────┘
                                                │ Autenticado
                                                ▼
                                     ┌─────────────────────┐
                                     │    Tab Navigation   │
                                     │  Home│Publish│Profile│
                                     └──┬────────────────┬─┘
                                        │                │
                              ┌─────────▼──────┐  ┌─────▼───────────┐
                              │ Product Detail  │  │ Mis Publicaciones│
                              └────────────────┘  └─────────────────┘
                                                          │ (Si rol=admin)
                                                   ┌──────▼──────────┐
                                                   │ Admin Dashboard │
                                                   └─────────────────┘
```

---

## 9. Arquitectura del Sistema (Layered Architecture)

El proyecto implementa una **Arquitectura en Capas (Layered Architecture)** con 4 capas bien definidas:

| Capa | Carpeta | Responsabilidad |
|------|---------|----------------|
| **Presentación (UI)** | `src/app/`, `src/components/` | Pantallas y componentes visuales |
| **Estado Global** | `src/context/` | Gestión de estado con React Context API |
| **Servicios / Negocio** | `src/services/` | Comunicación con Firebase (Auth, Firestore, Storage) |
| **Modelos / Tipos** | `src/types/` | Definición de entidades con TypeScript |

---

## 10. Conclusiones

- La encuesta aplicada validó la necesidad del sistema e identificó las categorías y funcionalidades prioritarias.
- La arquitectura de base de datos NoSQL con Firebase Firestore es adecuada para el volumen de datos esperado y la necesidad de sincronización en tiempo real.
- Se completó el ciclo de Fases 1 a 5, teniendo operativas las funcionalidades de autenticación, gestión de productos e integración con Firebase.
- Los datos de la encuesta se vincularon directamente con las decisiones de diseño de interfaz y estructura de datos.

---

## 11. Próximos Pasos (Semana 7 en adelante)

- Implementar función de edición/eliminación de publicaciones propias.
- Implementar búsqueda y filtrado de productos por categoría.
- Configurar reglas de seguridad de Firestore para producción.
- Iniciar pruebas unitarias de los servicios de autenticación y productos.
- Preparar el build de producción para despliegue.

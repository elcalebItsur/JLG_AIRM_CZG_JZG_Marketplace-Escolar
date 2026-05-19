# Campus Marketplace 🎓🛒


<p align="center">
  <img src="https://img.shields.io/badge/React_Native-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-54.0.33-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-12.9.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 📝 Descripción

**Campus Marketplace** es una plataforma móvil y web multiplataforma (PWA) de comercio seguro y exclusivo diseñada para estudiantes, profesores y personal administrativo del **Instituto Tecnológico Superior del Sur de Guanajuato (ITSUR)**. 

Desarrollada bajo estándares modernos utilizando **React Native**, **Expo Router v6** y **Firebase**, la aplicación permite a la comunidad escolar publicar, buscar, comprar y vender artículos de manera interna y confiable, garantizando la seguridad mediante autenticación restringida a dominios de correo institucionales y un chat en tiempo real para acordar las transacciones de forma presencial dentro del campus.

---

## ✨ Características Principales

### 🔒 Autenticación Institucional Restringida
* **Seguridad de Dominio:** El registro está blindado mediante validación estricta de dominios institucionales (`@alumnos.itsur.edu.mx` y `@itsur.edu.mx`). No se permiten correos comerciales como Gmail o Outlook.
* **Control de Roles:** Estructura de permisos dividida en estudiantes, docentes y administradores.

### 🛍️ Marketplace Escolar Completo
* **Descubrimiento Inteligente:** Inicio interactivo con barra de búsqueda instantánea, filtros por categoría (libros, tecnología, uniformes, snacks, etc.) y estado del artículo (nuevo, usado, excelente).
* **Publicación de Artículos:** Carga interactiva de imágenes mediante cámara o galería con optimización de tamaño local, descripción detallada, fijación de precios y categorización.

### 💬 Mensajería Instantánea en Tiempo Real
* **Chat Integrado:** Sistema de chat interactivo directo para negociaciones entre comprador y vendedor dentro de la app, eliminando la necesidad de compartir números telefónicos personales.
* **Gestión de Acuerdos:** Facilita la coordinación de puntos y horarios de entrega seguros dentro de las instalaciones del ITSUR.

### 📱 Experiencia Móvil Nativa (PWA de Alta Fidelidad)
* **Diseño Responsivo Premium:** Adaptado tanto a smartphones (iOS y Android) como a navegadores web con un sistema de diseño moderno basado en colores institucionales curados y esquemas oscuros (*Dark Mode*).
* **Optimización Safe Areas:** Soporte completo para pantallas modernas con muescas o *notches* (como la Dynamic Island de iPhone) y barras de estado translúcidas de color institucional.
* **Micro-interacciones:** Respuestas hápticas nativas y micro-animaciones en botones e interacciones para elevar la experiencia táctil.

### 🛡️ Panel de Administración y Moderación
* **Control de Comunidad:** Módulo administrativo privado diseñado para auditar reportes de artículos inapropiados, administrar categorías y banear de forma inmediata a usuarios infractores para preservar la seguridad.

---

## 🛠️ Arquitectura y Tecnologías

El proyecto sigue los principios de la **Clean Architecture** (Arquitectura Limpia) y la separación de responsabilidades para asegurar un código robusto, testeable y fácil de escalar:

* **Framework Base:** [Expo (v54)](https://expo.dev/) con soporte de renderizado multiplataforma nativo y web.
* **Enrutamiento:** [Expo Router (v6)](https://docs.expo.dev/router/introduction/) implementando navegación declarativa basada en archivos (*File-based routing*).
* **Base de Datos & Backend:** [Firebase (v12)](https://firebase.google.com/) para autenticación segura de usuarios, base de datos en tiempo real mediante Firestore, almacenamiento multimedia en Cloud Storage y notificaciones en la nube.
* **Estilizado:** Custom Design System optimizado con tokens HSL para flexibilidad total y transiciones de colores fluidas.
* **Pruebas Unitarias:** [Jest](https://jestjs.io/) configurado con `jest-expo` y `ts-jest` para validación de lógica de negocio y validadores de dominio institucional.

---

## 📂 Estructura del Proyecto

```bash
Campus-Marketplace/
├── assets/                 # Recursos gráficos estáticos (banners, logos, splash screen)
├── docs/                   # Documentación adicional y diagramas de arquitectura
├── scripts/                # Scripts de automatización y post-procesamiento para web
├── src/                    # Directorio raíz del código fuente
│   ├── app/                # Sistema de enrutamiento basado en archivos (Expo Router)
│   │   ├── (tabs)/         # Navegación por pestañas principal (Inicio, Chats, Publicar, Perfil)
│   │   ├── admin/          # Vistas exclusivas para moderación y administración
│   │   ├── auth/           # Vistas de registro, inicio de sesión y recuperación de contraseña
│   │   ├── chat/           # Pantallas de salas de chat activas
│   │   ├── products/       # Pantallas de detalle de productos y edición
│   │   └── profile/        # Configuraciones de cuenta e historial personal
│   ├── components/         # Componentes visuales reutilizables y atómicos
│   ├── config/             # Configuración e inicialización de SDKs externos (Firebase, etc.)
│   ├── constants/          # Constantes globales, paletas de colores y dimensiones de diseño
│   ├── context/            # Contextos de React para estado global (AuthContext, ThemeContext)
│   ├── services/           # Capa de servicios (Lógica de llamadas a API de Firebase, Auth, etc.)
│   ├── theme/              # Ficheros de definición de temas visuales (Oscuro / Claro)
│   ├── types/              # Tipados estáticos TypeScript para modelos (User, Product, Chat, Message)
│   └── utils/              # Funciones auxiliares y algoritmos de validación de dominios
├── package.json            # Gestión de dependencias y scripts de ejecución
└── tsconfig.json           # Configuración del compilador de TypeScript
```

---

## 🚀 Guía de Instalación y Uso Local

Sigue estos pasos para levantar tu entorno de desarrollo local en minutos:

### 1. Clonar el repositorio
```bash
git clone https://github.com/elcalebItsur/Campus-Marketplace.git
cd Campus-Marketplace
```

### 2. Instalar dependencias
Se recomienda instalar las dependencias con npm:
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en la plantilla `.env.template`:
```bash
cp .env.template .env
```
Abre el archivo `.env` y rellena las credenciales de tu proyecto de Firebase:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain_aqui
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id_aqui
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket_aqui
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_id_aqui
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id_aqui
```

### 4. Iniciar el servidor de desarrollo
Inicia el entorno interactivo de Expo:
```bash
npm run start
```
Desde la consola o interfaz de Expo CLI, puedes:
* Presionar `a` para abrir en emulador de Android.
* Presionar `i` para abrir en simulador de iOS.
* Presionar `w` para compilar y abrir en tu navegador web local.

### 5. Ejecutar Pruebas Unitarias
Para correr la suite de pruebas automatizadas con Jest:
```bash
npm run test
```

---

## 🌐 Compilación y Despliegue en Vercel (Producción Web)

Este proyecto está optimizado para compilarse y exportarse de forma estática como una PWA de grado de producción, diseñada para desplegarse sin problemas en plataformas de hosting estático como **Vercel** o **Netlify**.

El script de compilación web personalizado realiza las siguientes tareas:
1. Exporta el proyecto de React Native para entorno web estático mediante Expo CLI.
2. Ejecuta un script de post-construcción (`scripts/postbuild.js`) para inyectar metadatos del Manifest PWA y configurar redirecciones de rutas SPA (`vercel.json`).

### Compilar localmente para Web:
```bash
npm run build:web
```

### Despliegue automático con Vercel:
Simplemente vincula este repositorio a tu panel de **Vercel** y la plataforma detectará la configuración de forma nativa. 
* **Framework Preset:** `Other` o `Create React App`.
* **Build Command:** `npm run build:web`
* **Output Directory:** `dist`

---

## 🤝 Contribuidores

Este proyecto fue desarrollado con dedicación por estudiantes del **ITSUR**:

* **Caleb (elcalebItsur)** — *Desarrollador Principal & Arquitectura de Software*
* **Integrantes del Equipo (FASE 1 - FASE 2)**

---

## 📄 Licencia

Este proyecto es de uso institucional educativo para el **Instituto Tecnológico Superior del Sur de Guanajuato**. Todos los derechos sobre los recursos gráficos institucionales pertenecen al ITSUR.

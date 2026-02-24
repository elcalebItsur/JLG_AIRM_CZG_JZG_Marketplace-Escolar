# Diseño de Arquitectura de Base de Datos
## ITSUR Marketplace Escolar — Especificación Final

**Motor de Base de Datos:** Firebase Firestore (NoSQL)  
**Almacenamiento de archivos:** Firebase Storage  
**Autenticación:** Firebase Authentication  
**Fecha:** Febrero 2026

---

## 1. Decisión de Arquitectura: NoSQL vs SQL

| Criterio | Firestore (NoSQL) | SQL Relacional |
|---|---|---|
| Escalabilidad | ✅ Automática | ⚠️ Manual |
| Tiempo real | ✅ Suscripciones en tiempo real | ❌ No nativo |
| Costo inicial | ✅ Gratuito (plan Spark) | ⚠️ Hosting necesario |
| Multiplatforma | ✅ SDK Web/iOS/Android | ⚠️ Requiere API REST propia |
| Mensajería en tiempo real | ✅ Ideal con listeners | ❌ Requiere WebSockets externos |

**Conclusión:** Firestore es la opción óptima dado que la app requiere sincronización en tiempo real (mensajería, catálogo), escalabilidad y no depender de infraestructura propia.

---

## 2. Colecciones Principales (Entidades)

### 2.1 `users` — Usuarios del sistema
```
users/
  └── {uid}
        ├── id: string
        ├── displayName: string
        ├── email: string               → @alumnos.itsur.edu.mx | @itsur.edu.mx
        ├── role: enum                  → 'student' | 'teacher' | 'admin'
        ├── avatarUrl: string | null
        ├── rating: number              → Promedio 0-5
        ├── ratingCount: number
        ├── isActive: boolean
        └── createdAt: Timestamp
```

### 2.2 `products` — Publicaciones de productos
```
products/
  └── {productId}
        ├── id: string
        ├── title: string
        ├── description: string
        ├── price: number
        ├── category: enum              → 'libros' | 'electronica' | 'ropa' | 'papeleria' | 'otros'
        ├── images: string[]            → URLs en Firebase Storage (máx. 5)
        ├── sellerId: string            → Ref a users/{uid}
        ├── sellerName: string          → Denormalizado
        ├── sellerRating: number        → Denormalizado
        ├── status: enum                → 'active' | 'sold' | 'reserved' | 'deleted'
        ├── condition: enum             → 'new' | 'like_new' | 'good' | 'acceptable'
        ├── location: string
        ├── viewCount: number
        ├── isFeatured: boolean
        └── createdAt: Timestamp
```

### 2.3 `chats` — Conversaciones entre usuarios
```
chats/
  └── {chatId}                          → ID = "{uid1}_{uid2}_{productId}"
        ├── productId: string
        ├── productTitle: string        → Denormalizado
        ├── participants: string[]      → [uid_comprador, uid_vendedor]
        ├── participantsMap: {uid: true}→ Para queries Firestore
        ├── lastMessage: string
        ├── lastMessageAt: Timestamp
        ├── unreadCount: {uid: number}
        └── createdAt: Timestamp
        
        └── messages/ (sub-colección)
              └── {messageId}
                    ├── senderId: string
                    ├── text: string
                    ├── imageUrl: string | null
                    ├── type: enum       → 'text' | 'image' | 'system'
                    ├── isRead: boolean
                    └── createdAt: Timestamp
```

### 2.4 `reviews` — Calificaciones y reseñas
```
reviews/
  └── {reviewId}
        ├── reviewerId: string
        ├── reviewerName: string        → Denormalizado
        ├── sellerId: string
        ├── productId: string
        ├── productTitle: string        → Denormalizado
        ├── rating: number              → 1-5 estrellas
        ├── comment: string | null
        ├── isVerified: boolean
        └── createdAt: Timestamp
```

### 2.5 `transactions` — Registro de Transacciones
```
transactions/
  └── {transactionId}
        ├── productId: string
        ├── productTitle: string        → Denormalizado
        ├── buyerId: string
        ├── buyerName: string           → Denormalizado
        ├── sellerId: string
        ├── sellerName: string          → Denormalizado
        ├── agreedPrice: number
        ├── paymentMethod: string       → 'efectivo' | 'transferencia' | 'otro'
        ├── status: enum                → 'pending' | 'completed' | 'disputed' | 'cancelled'
        ├── confirmedBySeller: boolean
        ├── confirmedByBuyer: boolean
        ├── hasReview: boolean
        └── createdAt: Timestamp
```

### 2.6 `reports` — Reportes de moderación
```
reports/
  └── {reportId}
        ├── reporterId: string
        ├── targetType: enum            → 'product' | 'user'
        ├── targetId: string
        ├── reason: enum                → 'spam' | 'fraud' | 'inappropriate' | 'other'
        ├── description: string
        ├── status: enum                → 'pending' | 'reviewed' | 'resolved'
        ├── adminNotes: string | null
        └── createdAt: Timestamp
```

### 2.7 `notifications` — Notificaciones
```
notifications/
  └── {notificationId}
        ├── userId: string
        ├── type: enum                  → 'new_message' | 'review' | 'product_sold' | 'report_resolved'
        ├── title: string
        ├── body: string
        ├── relatedId: string | null
        ├── isRead: boolean
        └── createdAt: Timestamp
```

---

## 3. Estructura en Firebase Storage

```
firebase-storage/
  ├── avatars/
  │     └── {uid}.jpg
  └── products/
        └── {productId}/
              ├── image_1_{timestamp}.jpg
              └── image_2_{timestamp}.jpg
```

---

## 4. Diagrama Entidad-Relación Completo

```
┌───────────────────┐      Publica      ┌───────────────────┐
│      USERS        │1─────────────────N│     PRODUCTS      │
├───────────────────┤                   ├───────────────────┤
│ PK id (uid)       │                   │ PK id             │
│    displayName    │                   │    title          │
│    email          │                   │    price          │
│    role           │                   │    category       │
│    rating         │                   │    images[]       │
│    isActive       │                   │ FK sellerId       │
│    createdAt      │                   │    status         │
└───────┬───────────┘                   └──┬────────────────┘
        │                                  │
        │  Participa en                    │  Es sujeto de
        ▼                                  ▼
┌───────────────────┐      Sobre     ┌───────────────────┐
│      CHATS        │N──────────────1│   TRANSACTIONS    │
├───────────────────┤                ├───────────────────┤
│ PK id             │                │ PK id             │
│    participants[] │                │ FK productId      │
│ FK productId      │                │ FK buyerId        │
│    lastMessage    │                │ FK sellerId       │
│    unreadCount{}  │                │    status         │
└───────┬───────────┘                │    hasReview      │
        │ 1:N (sub-colección)        └──────┬────────────┘
        ▼                                   │ 1:1
┌───────────────────┐            ┌──────────▼────────────┐
│    MESSAGES       │            │       REVIEWS         │
├───────────────────┤            ├───────────────────────┤
│ PK id             │            │ PK id                 │
│ FK senderId       │            │ FK reviewerId         │
│    text, type     │            │ FK sellerId           │
│    isRead         │            │ FK productId          │
└───────────────────┘            │    rating (1-5)       │
                                 └───────────────────────┘
```

---

## 5. Índices Compuestos de Firestore Requeridos

| Colección | Campo 1 | Campo 2 | Uso |
|---|---|---|---|
| `products` | `status` (==) | `createdAt` (desc) | Catálogo principal |
| `products` | `status` (==) | `category` (==) | Filtro por categoría |
| `products` | `sellerId` (==) | `createdAt` (desc) | Mis publicaciones |
| `chats` | `participantsMap.{uid}` (==) | `lastMessageAt` (desc) | Mis chats |
| `transactions` | `buyerId` (==) | `status` (==) | Mis compras |
| `reviews` | `sellerId` (==) | `createdAt` (desc) | Reseñas de vendedor |

---

## 6. Reglas de Seguridad de Firestore (Producción)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid || isAdmin();
    }

    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.sellerId || isAdmin();
    }

    match /chats/{chatId} {
      allow read, write: if request.auth.uid in resource.data.participants;
      match /messages/{messageId} {
        allow read: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }

    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.reviewerId;
      allow update: if isAdmin();
    }

    match /transactions/{transactionId} {
      allow read: if request.auth.uid == resource.data.buyerId
                  || request.auth.uid == resource.data.sellerId || isAdmin();
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.buyerId
                  || request.auth.uid == resource.data.sellerId;
    }

    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read, update: if isAdmin();
    }

    match /notifications/{notificationId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 7. Estimación de Volumen de Datos

| Colección | Docs estimados (año 1) | Tamaño promedio |
|---|---|---|
| `users` | ~500 | ~400 bytes |
| `products` | ~2,000 | ~800 bytes |
| `chats` | ~1,000 | ~300 bytes |
| `messages` | ~50,000 | ~200 bytes |
| `reviews` | ~800 | ~400 bytes |
| `transactions` | ~800 | ~500 bytes |
| `notifications` | ~10,000 | ~300 bytes |

**Total estimado:** ~20 MB → Dentro del plan gratuito de Firestore (1 GB).

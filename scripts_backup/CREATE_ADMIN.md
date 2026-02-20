# CREAR ADMIN (instrucciones seguras)

El rol `ADMIN` no debe estar disponible en el registro público. Crear administradores debe hacerse manualmente o usando un script protegido fuera del flujo público.

Opción segura (Firestore example):

1. Conectar al proyecto Firebase con `gcloud` / `firebase-tools` o acceder a la consola.
2. Insertar manualmente un documento en `users/{uid}` con `role: 'ADMIN'`.

Ejemplo con `firebase-tools` (requiere autenticación del administrador):

```bash
firebase auth:import users.json --hash-algo=SCRYPT
# o usar firebase firestore:documents create con el documento de usuario
```

Si usas Supabase, crea la fila del usuario y asigna `role = 'ADMIN'` desde la consola o API con clave de servicio.

Importante: nunca guardes credenciales de administrador en repositorios públicos.

# 🚀 Flujo de Desarrollo Simple - LABFRAY 2.0

## 📋 Estructura de Ramas

- **`master`**: Código en producción (desplegado en Railway)
- **`development`**: Rama de desarrollo principal

## 🔄 Workflow Diario

### 1. Iniciar desarrollo

```bash
# Cambiar a rama development
git checkout development

# Asegurarse de tener lo último
git pull origin development
```

### 2. Desarrollar cambios

```bash
# Hacer tus cambios en el código
# Probar que todo funcione correctamente

# Agregar cambios
git add .

# Commitear con mensaje descriptivo
git commit -m "descripción de los cambios realizados"
```

### 3. Guardar progreso (opcional)

```bash
# Subir cambios a development (backup/progreso)
git push origin development
```

### 4. Cuando esté todo listo para producción

```bash
# Cambiar a master
git checkout master

# Traer últimos cambios de master (por si acaso)
git pull origin master

# Mergear development a master
git merge development

# Subir a producción (triggerea deploy en Railway)
git push origin master
```

### 5. Limpiar y continuar

```bash
# Regresar a development para seguir trabajando
git checkout development
```

## 🎯 Comandos Rápidos

```bash
# Workflow completo en una línea (cuando esté listo para producción)
git checkout master && git pull origin master && git merge development && git push origin master && git checkout development

# Solo guardar progreso en development
git add . && git commit -m "progreso: descripción" && git push origin development
```

## ⚠️ Notas Importantes

1. **Siempre trabajar en `development`**
2. **Solo pushear a `master` cuando esté todo probado**
3. **Master triggerea deploy automático en Railway**
4. **Si algo sale mal en producción, hacer hotfix directo en master**

## 🔧 Hotfix de Emergencia

Si necesitas corregir algo urgente en producción:

```bash
# Ir directo a master
git checkout master

# Hacer la corrección rápida
# ... cambios ...

# Commitear y pushear
git add .
git commit -m "hotfix: descripción del arreglo urgente"
git push origin master

# Sincronizar con development
git checkout development
git merge master
git push origin development
```

## 📊 Verificar Estado

```bash
# Ver en qué rama estás
git branch

# Ver diferencias entre ramas
git diff master development

# Ver historial
git log --oneline -10
```

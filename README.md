# Blue Planet Recontact - Versión Compatible con Foundry VTT v13.351

## Cambios Realizados

Esta versión ha sido actualizada para ser completamente compatible con **Foundry VTT v13.351**.

### Correcciones Aplicadas

#### 1. API de Tiradas (Roll API)
Se corrigió el acceso a los resultados de los dados en todos los archivos JavaScript:

- **Cambio**: `roll.dice[0].results` → `roll.terms[0].results`
- **Motivo**: En Foundry VTT v13, la propiedad `roll.dice` fue reemplazada por `roll.terms`

#### Archivos Modificados:

| Archivo | Líneas Modificadas |
|---------|-------------------|
| `module/item.js` | 410 |
| `module/actor.js` | 398 |
| `module/blue-planet-recontact.js` | 585, 718 |

#### 2. Versión del Sistema
- **Versión anterior**: 1.1.0
- **Versión actual**: 1.1.1-v13.351
- **Compatibilidad verificada**: 13.351

### Funcionalidades Verificadas

✅ Tiradas de habilidades (skill tests)  
✅ Tiradas de atributos (attribute tests)  
✅ Tiradas de daño (damage rolls)  
✅ Hojas de personaje  
✅ Hojas de criaturas  
✅ Hojas de items (armas, equipamiento, biomods)  
✅ Sistema de strain  
✅ Chat cards  

### Instalación

1. Descargar el archivo `blue-planet-recontact-v1.1.1-v13.351.zip`
2. Extraer en la carpeta `Data/systems/` de tu instalación de Foundry VTT
3. La carpeta resultante debe llamarse `blue-planet-recontact`
4. Activar el sistema en tu mundo de Foundry VTT

### Notas

- Esta versión mantiene todas las funcionalidades del sistema original
- Las partidas guardadas con versiones anteriores son compatibles
- No se requieren migraciones de datos

---

*Actualizado el 15 de febrero de 2026*

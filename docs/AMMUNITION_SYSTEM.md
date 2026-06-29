# Sistema de Munición - Blue Planet Recontact

## Descripción General

El sistema de munición en Blue Planet Recontact proporciona una mecánica completa para gestionar munición en armas de fuego, incluyendo diferentes tipos de munición con bonificadores únicos, carga automática, consumo durante combate, y visualización en las hojas de actores.

## Características Principales

### 1. Tipos de Munición
- **Standard**: Munición estándar sin bonificadores especiales
- **Armor Piercing (AP)**: Munición perforante con bonificador de penetración
- **Hollow Point**: Munición expansiva con bonificador de daño
- **Incendiary**: Munición incendiaria con efectos especiales
- **Tracer**: Munición trazadora con bonificador de ataque
- **Subsonic**: Munición subsónica para sigilo

### 2. Propiedades de la Munición
Cada tipo de munición puede tener los siguientes modificadores:
- **Bonificador de Ataque** (`attack_bonus`): Modifica la tirada de ataque
- **Bonificador de Daño** (`damage_bonus`): Modifica el daño infligido
- **Bonificador de Penetración** (`penetration_bonus`): Modifica la penetración de armadura
- **Cantidad** (`quantity`): Cantidad disponible de munición

## Uso del Sistema

### Crear Munición
1. Ir a la pestaña "Items" en la hoja del actor
2. Hacer clic en "Add Ammunition" en la sección de Munición
3. Configurar las propiedades:
   - **Nombre**: Identificación de la munición
   - **Tipo**: Seleccionar el tipo de munición
   - **Cantidad**: Cantidad disponible
   - **Bonificadores**: Configurar bonificadores de ataque, daño y penetración

### Cargar Armas
1. Abrir la hoja del arma a cargar
2. En la pestaña "Details", buscar la sección "Ammunition"
3. Seleccionar la munición deseada del dropdown "Load Ammunition"
4. La munición se cargará automáticamente y se mostrará en la información del arma

### Durante el Combate
1. **Ataques Automáticos**: Al realizar un ataque exitoso con un arma de fuego, se consume automáticamente 1 round de munición
2. **Modificadores Aplicados**: Los bonificadores de la munición se aplican automáticamente:
   - Bonificadores de ataque se suman a la tirada
   - Bonificadores de daño se muestran en el botón de daño
3. **Información Visual**: El diálogo de ataque muestra:
   - Munición cargada actual
   - Cantidad restante
   - Bonificadores aplicados
   - Estado después del disparo

### Gestión de Munición
- **Recarga**: Cuando se agota la munición, se debe cargar nueva munición manualmente
- **Seguimiento**: Las cantidades se actualizan automáticamente en tiempo real
- **Compartir**: Los objetos de munición se pueden intercambiar entre actores

## Visualización en las Hojas

### Hoja del Personaje Principal
- **Sección de Armas**: Muestra munición cargada, cantidad actual/capacidad con indicadores visuales de color
- **Sección de Munición**: Lista toda la munición disponible con cantidades y bonificadores

### Hojas de NPC y Cetáceos
- **NPCs**: Incluye todas las características del personaje principal
- **Cetáceos**: Solo muestra equipo con cantidades (los cetáceos típicamente no usan armas)

### Hoja de Criaturas
- No incluye sistema de munición (las criaturas usan ataques naturales)

## Mecánicas Técnicas

### Métodos del Arma
- `loadAmmunition(ammunitionItem)`: Carga munición en el arma
- `consumeAmmunition(amount)`: Consume munición durante ataques
- `getAmmunitionModifiers()`: Obtiene modificadores de la munición cargada
- `_checkAmmunition()`: Verifica disponibilidad de munición antes de atacar

### Integración con Combate
- **Verificación previa**: Se verifica disponibilidad de munición antes de permitir ataques
- **Consumo automático**: Se consume munición solo en ataques exitosos
- **Mensajes informativos**: Se muestran mensajes en chat sobre consumo y munición restante

## Ejemplo de Uso Práctico

1. **Crear Personaje**: Crear un personaje con arma de fuego
2. **Añadir Munición**: Crear objetos de munición (ej: "9mm Standard", "9mm Hollow Point")
3. **Cargar Arma**: Cargar el arma con la munición deseada
4. **Combate**: Durante el ataque, los modificadores se aplican automáticamente
5. **Gestión**: Después del combate, recargar con nueva munición si es necesario

## Notas para GMs

- **Escasez de Munición**: Use el sistema para crear tensión mediante escasez de munición
- **Tipos Especiales**: Munición especializada puede ser recompensas o recursos limitados
- **Balanceo**: Los bonificadores de munición están diseñados para ser significativos pero no desequilibrar el juego
- **Narrativa**: El sistema permite historias sobre preparación, recursos limitados y decisiones tácticas

## Compatibilidad

El sistema es completamente compatible con:
- Todas las mecánicas existentes de armas
- Sistema de strain y heridas
- Diálogos de ataque mejorados
- Mensajes de chat automáticos
- Hojas de actores de todos los tipos

## Resolución de Problemas

### Problemas Comunes
1. **Munición no se consume**: Verificar que el arma tenga munición cargada y el ataque sea exitoso
2. **Modificadores no se aplican**: Asegurar que la munición esté correctamente cargada en el arma
3. **Cantidades incorrectas**: Verificar que la munición tenga cantidades configuradas correctamente

### Soluciones
- Recargar la hoja del actor si no se actualizan las cantidades
- Verificar la configuración de la munición en la pestaña de detalles del objeto
- Comprobar que los tipos de munición sean compatibles con el arma

---

*Este sistema fue diseñado para proporcionar una experiencia de combate realista y táctica, manteniendo la simplicidad de uso y la automatización donde sea posible.*
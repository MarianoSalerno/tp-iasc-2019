Instalar módulos: node i
Levantar el orquestador activo: `npm run dev 4000`
Levantar los orquestadores "suplentes": `npm run dev PUERTO_DE_NODO PUERTO_DEL_MASTER`
Ejemplo:
```
npm run dev 8000 8000 # El master activo
npm run dev 8001 8000 # Suscriptor 1
npm run dev 8002 8000 # Suscriptor 2
```

Todos los nodos deben suscribirse al master. Los orquestadores "backup" del master, también.

El master les avisará a todos los nodos cualquier novedad sobre los nodos de datos.

Los orquestadores "backup" preguntarán constantemente por la salud del master, para reemplazarlo en caso de una caída.
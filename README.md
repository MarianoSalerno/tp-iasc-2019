
# tp-iasc-2019

## Levantar el proyecto

Entrar en alguna de las carpetas (client, data, manager). Y luego:
* Asegurarse de tener una versión reciente de Node, idealmente la última estable. Pueden instalar y usar **nvm** para cambiar de versión fácilmente.
* Instalar los paquetes, con `npm install` (solo hace falta la primera vez, o si se agregan dependencias)
* Levantar el componente, con `npm run dev`

## Particiones

Se divide el espacio de las keys en particiones.

Las particiones son agrupaciones lógicas de datos. Podríamos tener, por ejemplo, 30 objetos almacenados en la Partición1, 25 en Partición2, y 40 en Partición3.

Un nodo de datos puede tener **una o más particiones**.

Por ejemplo, imaginemos que arrancamos con 12 particiones, en un solo nodo de datos.

Si esto nos "queda chico" a nivel procesamiento, podemos agregar un segundo nodo de datos, y las particiones se reparten:
* Nodo1 con 6 particiones.
* Nodo2 con las otras 6.

Si agregamos otro nodo, se las vuelven a repartir:
* Nodo1 con 4 particiones.
* Nodo2 con 4 particiones.
* Nodo3 con 4 particiones.

Otro más:
* Nodo1 con 3 particiones.
* Nodo2 con 3 particiones.
* Nodo3 con 3 particiones.
* Nodo4 con 3 particiones.

Otro más:
* Nodo1 con 3 particiones.
* Nodo2 con 3 particiones.
* Nodo3 con 2 particiones.
* Nodo4 con 2 particiones.
* Nodo5 con 2 particiones.

Y así.

Una vez configurada la cantidad de particiones, ésta **no puede variar**. Así que conviene configurar una cantidad *holgada* de las mismas.

## Función Hash

A partir de una key, devuelve un **número de partición**
Ejemplo:
miKeyMágica --> función hash --> hash a partición --> partición 4

Se usará esta función de hash:
```
function stringHash(someString) {
  var hash = 0, i, chr;
  if (someString.length === 0) return hash;
  for (i = 0; i < someString.length; i++) {
    chr   = someString.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

function hashToPartition(partitionsQuantity, key){
  return Math.abs(stringHash(key) % partitionsQuantity)
}
```

Ejemplo de uso:
`hashToPartition(16, "miKeyMágica")` --> `9`


## Nodos de Datos

Son los encargados de almacenar sus particiones, y dentro de ellas, los datos.

### Validación de key
* Ven si ellos tienen esa partición entre sus particiones. Si no la tiene, bad request. Ya que otro nodo de datos es el encargado de resolver el pedido.

### Read ( GET /data/:partition/:key )
* Valida que la key sea correcta. Si es así:
* Se fija qué valor hay almacenado en esa key dentro de esa partición.
* Si había algo, se devuelve. Si no había nada, Not Found.

### Upsert ( POST /data/:partition/ ) 
* Body:
`{ "key": ejemplo, "value": ejemplo"}`
* Valida que la key sea correcta. Si es así:
* Asigna ese valor a esa key (la pisa si es que había algo asignado).

Para todo esto, cada nodo de datos tiene que saber qué particiones tiene asignado.

¿De dónde saca esa info? Se lo dice el orquestador máster. Ver más abajo.

## Nodos Clientes

Son la cara visible para que otros nos hagan consultas. Podría haber un load balancer adelante de ellos.

En principio, entienden:
Read ( GET /data/:key )
Upsert ( POST /data ) { key: key, value: value }
Delete ( DELETE /data/:key )
valuesGreaterThan ( GET /valuesgreaterthan?query=value )
valuesSmallerThan ( GET /valuessmallerthan?query=value )

En caso de Read/Upsert/Delete lo que hacen es:
* Deducir a qué partición va ese dato.
* A partir de eso, ver qué nodo de datos es el encargado de mantener esa partición.
* Delegarle la tarea a ese nodo, y responder en función de eso.
En caso de values-Greater/smaller-Than
* Lanza una promise a todos los nodos de datos disponibles y recopila resultados

¿Cómo sabe el mappeo de **partición <-> nodo**?

Lo tiene cargado en un mapa. Del estilo:
Partición1 --> Nodo1
Partición2 --> Nodo1
Partición3 --> Nodo2
Partición4 --> Nodo2

¿De dónde saca ese mapa? Se lo dice el orquestador máster. Ver más abajo.

## Nodos Orquestadores

Son los responsables de saber el mappeo mencionado más arriba, y de avisarles a todos los clientes cualquier cambio.

¿Cómo se conocen con el resto de nodos?
* Al levantarse, se suscriben ante el orquestador master para recibir novedades.
* Dicho orquestador le manda la configuración luego de suscribirse.
* Si se detecta alguna caída de un nodo de datos, se les avisa a los nodos clientes cuál de ellos pasó a estado "unavailable" así éste no recibe más peticiones.

## Cómo configurar y levantar los nodos.

1) Instalar las dependencias (`npm i`) dentro del módulo /commons/subscriptions, ya que internamente usa axios. Y los 3 tipos de nodos dependen de subscriptions

2) Iniciar los orquestadores. Entrar a la carpeta orchestrator, y hacer lo siguiente:
`npm i`
`npm run dev 8000 8000` # Nodo con puerto 8000, indicando que el master es ese mismo puerto (así se "autoconfigura" como master)
`npm run dev 8001 8000` # Slave 1 en 8001, indicando que el master está en el 8000 (se "autoconfigura" como slave)
`npm run dev 8002 8000` # Slave 2 en 8002

3) Iniciar los nodos de datos, suscriptos al master actual. Ir a la carpeta de data-server y:
`npm i`
`npm run dev 5000 8000`
`npm run dev 5001 8000`
`npm run dev 5002 8000`

4) Iniciar los nodos client. Ir a la carpeta cliente, y:
`npm i`
`npm run dev 3000 8000`
`npm run dev 3001 8000`
`npm run dev 3002 8000`

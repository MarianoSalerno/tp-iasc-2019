const axios = require('axios');

const subscribedNodes = new Set()

function addSubscriber(subscriberPort){
	subscribedNodes.add(subscriberPort)
}

function notifyNewsToAllSubscribers(news){
	console.log("Sending news: ", news)
	subscribedNodes.forEach((node) => {
		axios.post(`http://localhost:${node}/news`, news, {timeout: 1000})
		.then((response) => {
			console.log(`News sended to ${node}!`)
		})
		.catch((error) => console.log(`Something failed sending news to ${node} on path ${path}. More info: ${error}`))
	})
}

function acceptNews(app, whatToDoWhithNewShapshot){
	app.post('/news', (req, res, next) => { 
		snapshot = req.body
		whatToDoWhithNewShapshot(snapshot)
		res.sendStatus(200)
	}) 
}

function subscribeAs(nodeType, myPort, targetPort, whatToDoWhithNewShapshot){
	axios.post(`http://localhost:${targetPort}/subscribers/${nodeType}`, {port: myPort}, {timeout: 1000})
		.then((response) => {
			console.log(`I'm subscribed to ${targetPort} as ${nodeType}!`)
			console.log("New Snapshot:", response.data)
			whatToDoWhithNewShapshot(response.data)
		})
		.catch((error) => console.log(`Something failed subscribing to ${targetPort}. More info: ${error}`))
}

function partialSubscription(nodeType){
	return (app, myPort, targetPort, whatToDoWhithNewShapshot) => {
		acceptNews(app, whatToDoWhithNewShapshot)
		subscribeAs(nodeType, myPort, targetPort, whatToDoWhithNewShapshot)
	}
}

// El objeto "publisher" solo sirve para los orquestadores por ahora.
// Más adelante podría servir para que podamos recibir novedades de varios nodos de distinto tipo, todo cruzado, pero por ahora solo queremos que el orquestador mande novedades.
exports.publisher = {
	addSubscriber: addSubscriber,
	notifyNewsToAllSubscribers: notifyNewsToAllSubscribers
}

/*
	Todos los nodos tienen que usar el objeto suscriber. Todos deben suscribirse al orquestador activo ni bien se inician.

	Primero hay que importar el paquete:
	const suscriptions = require('suscriptions');

	Después, necesitamos tener declarada alguna función para saber qué hacer cuando recibimos un snapshot actual del cluster:
	function whatToDoWithSnapshot(snapshot) { 
		código mágico para reaccionar con cada snapshot del cluster que nos llega
	}

	Luego, tenemos que poder recibir novedades, y reaccionar ante ellas. Así que tenemos que mandar:
	- app de express, para que nos cree la ruta de /news idéntica en cada nodo que quiera tener esta funcionalidad
	- nuestro puerto
	- el puerto del orquestador activo (master) en este momento
	- la función mágica creada más arriba

	Entonces, por ejemplo, un cliente comienza a aceptar novedades, y se suscribe al master, con esta línea:
	suscriptions.subscribeAsClient(app, 5000, 8000, whatToDoWithSnapshot)

	Y un nodo de datos, así:
	suscriptions.subscribeAsDataNode(app, 5000, 8000, whatToDoWithSnapshot)
*/
exports.subscriber = {
	subscribeAsOrchestrator: partialSubscription("orchestrator"),
	subscribeAsDataNode: partialSubscription("dataNode"),
	subscribeAsClient: partialSubscription("client")
}

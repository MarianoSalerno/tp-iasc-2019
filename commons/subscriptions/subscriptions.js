const axios = require('axios');

const subscribedNodes = new Map()

function initSubscriptions() {
	subscribedNodes.set("orchestrator", new Set())
	subscribedNodes.set("data", new Set())
	subscribedNodes.set("client", new Set())
	console.log("Subscriptions initialized")
}

function addSubscriber(type, subscriberPort) {
	const subscribed = subscribedNodes.get(type)
	subscribed.add(subscriberPort)
	console.log(`New subscription from ${type} node. Port: ${subscriberPort}!`)
}

function removeSubscriber(type, subscriberPort) {
	const subscribed = subscribedNodes.get(type)
	subscribed.delete(subscriberPort)
}

function notifyNewsToAllSubscribersExcept(news, excludedPort) {
	for (var [type, ports] of subscribedNodes) {
		ports.forEach((node) => {
			if (node != excludedPort) {
				postNews(node, news);
			}
		})
	}
}

function notifyNewsToAllSubscribers(news) {
	for (var [type, ports] of subscribedNodes) {
		ports.forEach((node) => {
			postNews(node, news);
		})
	}
}

function postNews(node, news) {
	axios.post(`http://localhost:${node}/news`, news, { timeout: 1000 })
		.then((response) => {
			console.log(`News sent to ${node}!`);
		})
		.catch((error) => console.log(`Something failed sending news to ${node}. More info: ${error}`));
}

function acceptNews(app, whatToDoWhithNewShapshot) {
	app.post('/news', (req, res, next) => {
		snapshot = req.body
		whatToDoWhithNewShapshot(snapshot)
		res.sendStatus(200)
	})
}

function subscribeAs(nodeType, myPort, targetPort, whatToDoWhithNewShapshot, startApplication, app) {
	axios.post(`http://localhost:${targetPort}/subscribers/${nodeType}`, { port: myPort }, { timeout: 1000 })
		.then((response) => {
			console.log(`I'm subscribed to ${targetPort} as ${nodeType}!`)
			console.log("New Snapshot:", response.data)
			whatToDoWhithNewShapshot(response.data)
			startApplication(app)
		})
		.catch((error) => console.log(`Something failed subscribing to ${targetPort}. More info: ${error}`))
}

function partialSubscription(nodeType) {
	return (app, myPort, targetPort, whatToDoWhithNewShapshot, startApplication) => {
		acceptNews(app, whatToDoWhithNewShapshot)
		subscribeAs(nodeType, myPort, targetPort, whatToDoWhithNewShapshot, startApplication, app)
	}
}

// El objeto "publisher" solo sirve para los orquestadores por ahora.
// Más adelante podría servir para que podamos recibir novedades de varios nodos de distinto tipo, todo cruzado, pero por ahora solo queremos que el orquestador mande novedades.
exports.publisher = {
	addSubscriber: addSubscriber
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
	subscribeAsDataNode: partialSubscription("data"),
	subscribeAsClient: partialSubscription("client")
}

exports.initSubscriptions = initSubscriptions
exports.notifyNewsToAllSubscribers = notifyNewsToAllSubscribers
exports.notifyNewsToAllSubscribersExcept = notifyNewsToAllSubscribersExcept
exports.subscribedNodes = subscribedNodes
exports.removeSubscriber = removeSubscriber
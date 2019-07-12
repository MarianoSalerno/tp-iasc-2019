const axios = require('axios');

const subscribedNodes = new Set()

function addSubscriber(subscriberPort){
	subscribedNodes += subscriberPort
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

function subscribeAs(nodeType, myPort, targetPort){
	axios.post(`http://localhost:${targetPort}/subscribers/${nodeType}`, {port: myPort}, {timeout: 1000})
		.then((response) => {
			console.log(`I'm subscribed to ${targetPort} as ${nodeType}!`)
		})
		.catch((error) => console.log(`Something failed subscribing to ${targetPort}. More info: ${error}`))
}

function partialSubscription(nodeType){
	return (app, myPort, targetPort, whatToDoWhithNewShapshot) => {
		acceptNews(app, whatToDoWhithNewShapshot)
		subscribeAs(nodeType, myPort, targetPort)
	}
}

exports.publisher = {
	addSubscriber: addSubscriber,
	notifyNewsToAllSubscribers: notifyNewsToAllSubscribers
}

exports.subscriber = {
	subscribeAsOrchestrator: partialSubscription("orchestrator"),
	subscribeAsDataNode: partialSubscription("dataNode"),
	subscribeAsClient: partialSubscription("client")
}



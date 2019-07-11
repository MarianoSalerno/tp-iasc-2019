const axios = require('axios');

const subscribedNodes = {
	orchestrator: new Set(),
	data: new Set(),
	client: new Set()
}

function addSubscriber(type, subscriberPort){
	console.log(`Some ${type} added with port ${subscriberPort}!`)
	subscribedNodes[type] += subscriberPort
}



function subscribeToMasterOrchestrator(myPort, masterPort){
	axios.post(`http://localhost:${masterPort}/subscribe/orchestrator`, {port: myPort})
		.then((response) => {
			console.log(`I'm subscribed to ${masterPort}!`)
			// TODO: Pedir healthchecks cada segundo al master, y reaccionar si algo sale mal!!
		})
		.catch((error) => console.log(`Something failed subscribing to ${masterPort}. More info: ${error}`))
}

exports.nodes = subscribedNodes
exports.addSubscriber = addSubscriber
exports.subscribeToMasterOrchestrator = subscribeToMasterOrchestrator

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

function configureAsMasterOrSlave(consoleParams){
	if (consoleParams.port == consoleParams.masterPort) {
		console.log("I'm the master ^_^")
	} else {
		subscribeToMasterOrchestrator(consoleParams.port, consoleParams.masterPort)
	}
}

function subscribeToMasterOrchestrator(myPort, masterPort){
	axios.post(`http://localhost:${masterPort}/subscribe/orchestrator`, {port: myPort})
		.then((response) => {
			console.log(`I'm subscribed to ${masterPort}!`)
		})
		.catch((error) => console.log(`Something failed subscribing to ${masterPort}. More info: ${error}`))
}

exports.addSubscriber = addSubscriber
exports.configureAsMasterOrSlave = configureAsMasterOrSlave

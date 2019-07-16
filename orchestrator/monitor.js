const axios = require('axios');
const subscriptions = require('subscriptions')
const cluster = require('./cluster.js')  

function checkAllNodesHealth() {
	return () => {
		for (let [type, ports] of subscriptions.subscribedNodes) {
		ports.forEach((nodePort) => {
			axios.get(`http://localhost:${nodePort}/healthcheck`, {timeout: 300})
			.then((response) => { console.log(`${type} node ${nodePort} is healthy.`) })
			.catch((error) => {
				console.log(`Something failed checking health of ${nodePort}. More info: ${error}`)
				cluster.removeSubscriber(type, nodePort)
				subscriptions.removeSubscriber(type, nodePort)
				subscriptions.notifyNewsToAllSubscribers(cluster.getSnapshot())
			})
		})
	}
}
}

function checkHealthEvery(seconds) {
	setInterval(checkAllNodesHealth(), seconds * 1000)
}

exports.checkHealthEvery = checkHealthEvery

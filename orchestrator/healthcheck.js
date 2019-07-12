const axios = require('axios');
const subscriptions = require('./subscriptions.js')  

const observedNodes = new Set()

function addObservedNode(newPort){
	console.log(`Some observed noded added with port ${subscriberPort}!`)
	observedNodes += newPort
}

function checkAllNodesHealth(reactionToNotify) {
	return () => {
		observedNodes.forEach((nodePort) => {
			axios.get(`http://localhost:${nodePort}/healthcheck`, {timeout: 300})
			.catch((error) => {
				console.log(`Something failed checking health of ${nodePort}. More info: ${error}`)
				subscriptions.notifyNewsToAllSubscribers(reactionToNotify(nodePort))
			})
		})
	}
}

function checkHealthEvery(seconds, reactionToNotify){
	setInterval(checkAllNodesHealth(reactionToNotify), seconds * 1000)
}

exports.addObservedNode = addObservedNode
exports.checkHealthEvery = checkHealthEvery

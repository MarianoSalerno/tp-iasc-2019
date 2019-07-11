const configuration = require('./conf.js')  
const consoleParams = require('./consoleParams.js')  
const subscriptions = require('./subscriptions.js')  

function snapshot(){
	return {
		nodes: {
			orchestratorNodes: {
				master: consoleParams.port,
				slaves: subscriptions.nodes.orchestratorNodes
			},
			dataNodes: subscriptions.nodes.dataNodes, // TODO: Falta mappeo de particiones a nodos
			clientNodes: subscriptions.nodes.clientNodes
		},
		dataConfiguration: {
			itemMaxSize: configuration.maxSize,
			maxStoragePerNode: configuration.maxStorage
		}
	}
}

var thisIsMaster = false

function configureAsMasterOrSlave(consoleParams){
	if (consoleParams.port == consoleParams.masterPort) {
		thisIsMaster = true
		console.log("I'm the master ^_^")
	} else {
		subscriptions.subscribeToMasterOrchestrator(consoleParams.port, consoleParams.masterPort)
	}
}

exports.thisIsMaster = thisIsMaster
exports.thisIsSlave = !thisIsMaster
exports.configureAsMasterOrSlave = configureAsMasterOrSlave
exports.snapshot = snapshot

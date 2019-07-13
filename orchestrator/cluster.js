const configuration = require('./conf.js')  
const subscriptions = require('./subscriptions.js')  
const consoleParams = require('./consoleParams.js')  

var snapshot // Si es master, lo inicializa. Si no, se suscribe y espera a que el master le diga cómo quedó configurado

function getSnapshot(){
	return snapshot
}

function setSnapshot(newSnapshot){
	snapshot = newSnapshot

}

function addDataNode(port){
	// TODO: Primero ver que no esté agregado aún. Si no está, redividir los shards, y enviar a los suscriptores el nuevo snapshot
}

var thisIsMaster = false

function initAsMaster(){
	changeToMaster()
	snapshot = {
		dataConfiguration: {
			itemMaxSize: configuration.maxSize,
			maxStoragePerNode: configuration.maxStorage
		},
		orchestrators: {
			master: consoleParams.masterPort,
			replacementsInOrder: []
		},
		shards: []
	}
	console.log("Cluster initialized. Waiting subscribers in /subscribers/:type to send news!")
}

function thisIsMaster() {
	return snapshot && snapshot.orchestrators.master == consoleParams.port
}

function changeToMaster(){
	setSnapshot.orchestrators.master = setSnapshot.orchestrators.replacementsInOrder.pop()
}

function initAsSlave(app){
	subscriptions.subscriber.subscribeAsOrchestrator(app, consoleParams.port, consoleParams.masterPort)
}

function init(app){
	consoleParams.port == consoleParams.masterPort ? initAsMaster() : initAsSlave(app)
}

exports.thisIsMaster = thisIsMaster
exports.thisIsSlave = !thisIsMaster
exports.init = init
exports.getSnapshot = getSnapshot
exports.setSnapshot = setSnapshot

exports.addDataNode = addDataNode
exports.changeToMaster = changeToMaster

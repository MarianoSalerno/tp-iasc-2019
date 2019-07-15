const configuration = require('./conf.js')  
const subscriptions = require('subscriptions')  
const consoleParams = require('console_params')
const orchestrator = require('./orchestrator.js') 

var snapshot // Si es master, lo inicializa. Si no, se suscribe y espera a que el master le diga cómo quedó configurado

function getSnapshot() {
	return snapshot
}

function setSnapshot(newSnapshot) {
	snapshot = newSnapshot
}

function addSubscriber(type, subscriberPort) {
	if(type === "orchestrator") {
		snapshot.orchestrators.replacementsInOrder.push(subscriberPort)
		return
	}

	if(type === "client") {
		snapshot.clientsConnected.push(subscriberPort)
		return
	}

	if(type === "data") {
		const shards = snapshot.shards
		const node = shards.find(element => {
			const nodePath = new String(`http://localhost:${subscriberPort}`);
			const elementPath = new String(element.path);
			return JSON.stringify(nodePath) === JSON.stringify(elementPath);
		});
		node.available = true
		return
	}
}


var thisIsMaster = false

function initAsMaster(app){
	snapshot = {
		dataConfiguration: {
			itemMaxSize: configuration.itemMaxSize,
			maxStoragePerPartition: configuration.maxStoragePerPartition
		},
		orchestrators: {
			master: consoleParams.masterPort,
			replacementsInOrder: []
		},
		shards: configuration.dataNodes,
		totalPartitions: configuration.totalPartitions,
		clientsConnected: []
	}

	console.log("Cluster initialized. Waiting subscribers in /subscribers/:type to send news!")
	startApplication()
}

function startApplication() {
	orchestrator.startApplication
}

function thisIsMaster() {
	return snapshot && snapshot.orchestrators.master == consoleParams.port
}

function changeToMaster(){
	snapshot.orchestrators.master = snapshot.orchestrators.replacementsInOrder.pop()
}

function initAsSlave(app) {
	subscriptions.subscriber.subscribeAsOrchestrator(app, consoleParams.port, consoleParams.masterPort, (newSnapshot) => {
		setSnapshot(newSnapshot)
		/* 
		TODO: Pisar el snapshot actual. Y calcular quiénes son los suscriptores.
		Así, si de repente este nodo se convierte en master, que sepa el estado actual del cluster y a quiénes avisarles de las novedades.
		*/
	}, startApplication)
}

function init(app){
	consoleParams.port == consoleParams.masterPort ? initAsMaster(app) : initAsSlave(app)
}

exports.thisIsMaster = thisIsMaster
exports.thisIsSlave = !thisIsMaster
exports.init = init
exports.getSnapshot = getSnapshot
exports.setSnapshot = setSnapshot

exports.changeToMaster = changeToMaster
exports.addSubscriber = addSubscriber
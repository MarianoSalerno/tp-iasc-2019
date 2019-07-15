const configuration = require('./conf.js')  
const subscriptions = require('subscriptions')  
const consoleParams = require('console_params') 

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
	startApplication(app)
}

function startApplication(app) {
	app.listen(consoleParams.port, () => console.log(`Orquestrator working on port: ${consoleParams.port}!`))
}

function thisIsMaster() {
	return snapshot && snapshot.orchestrators.master == consoleParams.port
}

function changeToMaster(){
	snapshot.orchestrators.master = snapshot.orchestrators.replacementsInOrder.pop()
}

function initAsSlave(app) {
	console.log("Trying to start as slave orchestrator")

	subscriptions.subscriber.subscribeAsOrchestrator(app, consoleParams.port, consoleParams.masterPort, (newSnapshot) => {
		setSnapshot(newSnapshot)
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
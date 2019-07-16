const configuration = require('./conf.js')
const subscriptions = require('subscriptions')
const consoleParams = require('console_params')
const masterMonitor = require('./master_monitor.js')
const slaveMonitor = require('./slave_monitor.js')

var snapshot // Si es master, lo inicializa. Si no, se suscribe y espera a que el master le diga cómo quedó configurado

function getSnapshot() {
	return snapshot
}

function setSnapshot(newSnapshot) {
	snapshot = newSnapshot
}

function addSubscriber(type, subscriberPort) {
	if (type === "orchestrator") {
		const priority = Math.floor((Math.random() * 100) + 1)
		snapshot.orchestrators.slaves.push({ port: subscriberPort, priority: priority })
		return
	}

	if (type === "client") {
		snapshot.clientsConnected.push(subscriberPort)
		return
	}

	if (type === "data") {
		const shards = snapshot.shards
		const node = shards.find(element =>
			parseInt(element.port) === subscriberPort
		);
		node.available = true
		return
	}
}

function removeSubscriber(type, subscriberPort) {
	if (type === "orchestrator") {
		const updatedOrchestrators = snapshot.orchestrators.slaves.filter(element => element.port != subscriberPort);
		snapshot.orchestrators.slaves = updatedOrchestrators;
		return
	}

	if (type === "client") {
		const updatedClients = snapshot.clientsConnected.filter(e => e != subscriberPort);
		snapshot.clientsConnected = updatedClients;
		return
	}

	if (type === "data") {
		const shards = snapshot.shards
		const node = shards.find(element =>
			parseInt(element.port) === subscriberPort
		);
		node.available = false
		return
	}
}

function initAsMaster(app) {
	snapshot = {
		dataConfiguration: {
			itemMaxSize: configuration.itemMaxSize,
			maxStoragePerPartition: configuration.maxStoragePerPartition
		},
		orchestrators: {
			master: consoleParams.masterPort,
			slaves: []
		},
		shards: configuration.dataNodes,
		totalPartitions: configuration.totalPartitions,
		clientsConnected: []
	}

	console.log("Cluster initialized. Waiting subscribers in /subscribers/:type to send news!")
	startApplication(app)
}

function thisIsMaster() {
	return snapshot.orchestrators.master == consoleParams.port
}

function startApplication(app) {
	app.listen(consoleParams.port, () => {
		console.log(`Orquestrator working on port: ${consoleParams.port}!`);
		if (thisIsMaster()) {
			masterMonitor.checkAllNodesHealthEvery(2)
		} else {
			slaveMonitor.checkMasterHealthEvery(2)
		}
	}
	)
}

function isThisSlaveWithHighestPriority(slavePort) {
	const slavesByPriority = snapshot.orchestrators.slaves.map(slave => slave.priority)
	const chosenSlavePriority = Math.max(...slavesByPriority)
	const slaveToBeMaster = snapshot.orchestrators.slaves.find(element => element.priority === chosenSlavePriority)
	return slaveToBeMaster.port === slavePort
}

function updateMaster(slavePort) {
	const updatedSlaves = snapshot.orchestrators.slaves.filter(element => element.port != slavePort)
	snapshot.orchestrators.slaves = updatedSlaves
	snapshot.orchestrators.master = slavePort
	console.log(`Orchestrator ${slavePort} is now master orchestrator!`)
}

function initAsSlave(app) {
	console.log("Trying to start as slave orchestrator")

	subscriptions.subscriber.subscribeAsOrchestrator(app, consoleParams.port, consoleParams.masterPort, (newSnapshot) => {
		setSnapshot(newSnapshot)
	}, startApplication)
}

function init(app) {
	subscriptions.initSubscriptions()
	consoleParams.port == consoleParams.masterPort ? initAsMaster(app) : initAsSlave(app)
}

exports.thisIsMaster = thisIsMaster
exports.thisIsSlave = !thisIsMaster
exports.init = init
exports.getSnapshot = getSnapshot
exports.setSnapshot = setSnapshot

exports.isThisSlaveWithHighestPriority = isThisSlaveWithHighestPriority
exports.updateMaster = updateMaster
exports.addSubscriber = addSubscriber
exports.removeSubscriber = removeSubscriber
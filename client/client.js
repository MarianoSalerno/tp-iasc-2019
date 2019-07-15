const config = require('console_params')  
const subscriptions = require('subscriptions') 
const express = require('express')
const bodyParser = require('body-parser')
const hash = require('./hash-function.js')
const axios = require('axios');
const app = express()
var dataNodes
var replacementOrchestrators
var totalPartitions

function findMasterOrchestrator() {
	for (let ip of replacementOrchestrators) {
		axios.post(`${ip}/subscribers/client`)
		.then((response) => {
			console.log(`Registered client node to ${ip}!`)
			dataNodes = response.data.shards
			replacementOrchestrators = response.data.orchestrators.replacementsInOrder
			totalPartitions = response.data.totalPartitions
		})
		.catch((error) => console.log(`Error: Orchestrator ${ip} response: ${error}`))
	}
}

function getDatanodePathByPartition(partition) {
	return dataNodes.filter((x) => x.partitions.from <= partition && partition <= x.partitions.to)[0]['path']
}

function getDatanodesInformation(snapshot) {
	dataNodes = snapshot.shards
	totalPartitions = snapshot.totalPartitions
	orchestrators = snapshot.orchestrators
	
	console.log(`Config updated. dataNodes: ${dataNodes}. TotalPartitions: ${totalPartitions}. Orchestrators: ${orchestrators}`)
}

app.use( bodyParser.json() );

app.get('/get/:key', (req, res, next) => {
	try {
		const key = req.params.key
		partition = hash.getPartitionFromKey(totalPartitions, key)
		datanodeIp = getDatanodePathByPartition(partition)
		console.log(`${datanodeIp}/keys/${partition}/${key}`)
		axios.get(`${datanodeIp}/keys/${partition}/${key}`)
		.then((response) => {
			console.log(`Insertion: ${response.data}`)
			res.json(response.data)
		})
		.catch((error) => {
			console.log(`ERROR: ${error}`)
			res.status(400).json(error)
		})
	} catch(e) {
		findMasterOrchestrator()
		res.status(404).json({"error": "No configuration found; trying to reconnect master orchestrator. Try again in a few seconds"})
	}
})
const upsert = (req, res, next) => {
	try {
		const key = req.params.key
		const value = req.params.value
		partition = hash.getPartitionFromKey(totalPartitions, key)
		datanodeIp = getDatanodePathByPartition(partition)
		axios.post(`${datanodeIp}/keys/${partition}`, 
			{
				"key": key,
				"value": value
			}
		)
		.then((response) => {
			console.log(`Insertion: ${response.data}`)
			res.json(response.data)
		})
		.catch((error) => {
			console.log(`ERROR: ${error}`)
			res.status(404).json({"error": `Data node storing partition ${partition} not available at the moment`})
		})
	} catch(e) {
		findMasterOrchestrator()
		res.status(404).json({"error": "No configuration found; trying to reconnect master orchestrator. Try again in a few seconds"})
	}
}

app.get('/insert/:key/:value', upsert)
app.get('/update/:key/:value', upsert)

app.get('/delete/:key', (req, res, next) => {
	try {
		const key = req.params.key
		partition = hash.getPartitionFromKey(totalPartitions, key)
		datanodeIp = getDatanodePathByPartition(partition)
		axios.delete(`${datanodeIp}/keys/${partition}/${key}`)
		.then((response) => {
			console.log(`Deletion: ${response.data}`)
			res.json(response.data)
		})
		.catch((error) => {
			console.log(`ERROR: ${error}`)
			res.json({"error": `Data node storing partition ${partition} not available at the moment`})
		})
	} catch(e) {
		console.log(`No configuration found; trying to reconnect master orchestrator`)
		findMasterOrchestrator()
	}
})

function startApplication(app) {
	app.listen(config.port, () => console.log(`Cliente levantado en el puerto: ${config.port}!`))
}

subscriptions.subscriber.subscribeAsClient(app, config.port, config.masterPort, getDatanodesInformation, startApplication)

const config = require('console_params')  
const subscriptions = require('subscriptions') 
const express = require('express')
const bodyParser = require('body-parser')
const hash = require('./hash-function.js')
const axios = require('axios');
const app = express()
var dataNodes
var orchestrators
var totalPartitions

function findMasterOrchestrator() {
	for (let ip of configuration.orchestrators) {
		axios.post(`${ip}/subscribers/client`)
		.then((response) => {
			console.log(`Registered client node to ${ip}!`)
			dataNodes = response.data.shards
			itemMaxSize = response.data.orchestrators
			totalPartitions -= response.data.totalPartitions
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
		axios.get(`${datanodeIp}/keys/${partition}/${key}`)
		.then((response) => console.log(`Value: ${response.data}`))
		.catch((error) => console.log(`ERROR: ${error}`))
	} catch(e) {
		console.log(`No configuration found; trying to reconnect master orchestrator`)
		findMasterOrchestrator()
	}
})

app.get('/insert/:key/:value', (req, res, next) => {
	try {
		const key = req.params.key
		const value = req.params.value
		partition = hash.getPartitionFromKey(totalPartitions, key)
		datanodeIp = getDatanodePathByPartition(partition)
		axios.post(`${datanodeIp}/keys`, 
			{
				'key': key,
				'value': value,
				'partition': partition
			}
		)
		.then((response) => console.log(`Insertion: ${response.data}`))
		.catch((error) => console.log(`ERROR: ${error}`))
	} catch(e) {
		console.log(`No configuration found; trying to reconnect master orchestrator`)
		findMasterOrchestrator()
	}
})

app.get('/update/:key/:value', (req, res, next) => {
	try {
		const key = req.params.key
		const value = req.params.value
		partition = hash.getPartitionFromKey(totalPartitions, key)
		datanodeIp = getDatanodePathByPartition(partition)
		axios.put(`${datanodeIp}/keys/${partition}/${key}`, 
			{
				'value': value
			}
		)
		.then((response) => console.log(`Update: ${response.data}`))
		.catch((error) => console.log(`ERROR: ${error}`))
	} catch(e) {
		console.log(`No configuration found; trying to reconnect master orchestrator`)
		findMasterOrchestrator()
	}
})

app.get('/delete/:key', (req, res, next) => {
	try {
		const key = req.params.key
		partition = hash.getPartitionFromKey(totalPartitions, key)
		datanodeIp = getDatanodePathByPartition(partition)
		axios.delete(`${datanodeIp}/keys/${partition}/${key}`)
		.then((response) => console.log(`Deletion: ${response.data}`))
		.catch((error) => console.log(`ERROR: ${error}`))
	} catch(e) {
		console.log(`No configuration found; trying to reconnect master orchestrator`)
		findMasterOrchestrator()
	}
})
subscriptions.subscriber.subscribeAsClient(app, config.port, config.masterPort, getDatanodesInformation)
app.listen(config.port, () => console.log(`Cliente levantado en el puerto: ${config.port}!`))
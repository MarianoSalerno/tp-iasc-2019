const config = require('console_params')
const subscriptions = require('subscriptions')
const express = require('express')
const bodyParser = require('body-parser')
const hash = require('./hash-function.js')
const axios = require('axios');
const app = express()
const util = require('util')
const {parse, stringify} = require('flatted/cjs');
var dataNodes
var totalPartitions

function getDatanodePortByPartition(partition, res, key) {
	const dataNode = dataNodes.filter((x) => x.partitions.from <= partition && partition <= x.partitions.to)[0]
	if (!dataNode.available) {
		const errorMessage = `Data node storing partition ${partition} is not available. Cannot make request for key: ${key}`
		console.log(errorMessage)
		res.status(400).json({ error: errorMessage })
		return "error"
	}

	return dataNode['port']
}

function getDatanodesInformation(snapshot) {
	dataNodes = snapshot.shards
	totalPartitions = snapshot.totalPartitions
	orchestrators = snapshot.orchestrators

	console.log(`Config updated. dataNodes: ${dataNodes}. TotalPartitions: ${totalPartitions}. Orchestrators: ${orchestrators}`)
}

app.use(bodyParser.json());

app.get('/data/:key', (req, res, next) => {
	const key = req.params.key
	partition = hash.getPartitionFromKey(totalPartitions, key)
	const nodePort = getDatanodePortByPartition(partition, res, key)
	if (nodePort === "error") {
		return
	}

	axios.get(`http://localhost:${nodePort}/keys/${partition}/${key}`)
		.then((response) => {
			console.log(`Query result: ${JSON.stringify(response.data)}`)
			res.json(response.data)
		})
		.catch((error) => {
			console.log(`ERROR: ${JSON.stringify(error.response.data)}`)
			res.status(400).json(error.response.data)
		})
})

const upsert = (req, res, next) => {
	const key = req.body.key
	const value = req.body.value

	if (key === undefined) {
		res.status(400).json({ "response": "Key is missing" })
		return
	}

	if (value === undefined) {
		res.status(400).json({ "response": "Value is missing" })
		return
	}

	partition = hash.getPartitionFromKey(totalPartitions, key)
	const nodePort = getDatanodePortByPartition(partition, res, key)
	if (nodePort === "error") {
		return
	}

	axios.post(`http://localhost:${nodePort}/keys/${partition}`,
		{
			"key": key,
			"value": value
		}
	)
		.then((response) => {
			console.log(`Data ${key}-${value} inserted. ${JSON.stringify(response.data)}`)
			res.json(response.data)
		})
		.catch((error) => {
			console.log(`ERROR: ${JSON.stringify(error.response.data)}`)
			res.status(400).json(error.response.data)
		})
}

app.post('/data', upsert)

app.delete('/data/:key', (req, res, next) => {
	const key = req.params.key
	partition = hash.getPartitionFromKey(totalPartitions, key)
	const nodePort = getDatanodePortByPartition(partition, res, key)
	if (nodePort === "error") {
		return
	}

	axios.delete(`http://localhost:${nodePort}/keys/${partition}/${key}`)
		.then((response) => {
			console.log(`Pair with key ${key} deleted. ${JSON.stringify(response.data)}`)
			res.json(response.data)
		})
		.catch((error) => {
			console.log(`ERROR: ${JSON.stringify(error.response.data)}`)
			res.status(400).json(error.response.data)
		})
})

function scanPromise(port, params) {
	return axios.get(`http://localhost:${port}/scan`, params)
}

app.get('/values', (req, res, next) => {
	var queryParams

	const greaterThan = req.query.greaterThan
    if (greaterThan != undefined) {
		queryParams = {params: {
			valuesGreaterThan: greaterThan
		}}
	}

    const smallerThan = req.query.smallerThan
	if (smallerThan != undefined) {
		queryParams = {params: {
			valuesSmallerThan: smallerThan
		}}
	}
	
	if(greaterThan === undefined && smallerThan === undefined) {
		res.status(400).json({ "response": "Missing query param" })
		return
	}

	const availableNodes = dataNodes.filter(node => node.available === true)
	const requests = []
	availableNodes.forEach(node => requests.push(scanPromise(node.port, queryParams)))

	Promise.all(requests)
		.then(function(responses) {
			const jsonResponse = responses.map(response => response.data)
			responses.forEach(response => console.log(jsonResponse));
			res.json(jsonResponse)
		  })
		.catch((error) => {
			console.log(`ERROR: ${util.inspect(error.response)}`)
			res.status(400).json(error.response)
		})
})

app.get('/valuesSmallerThan', (req, res, next) => {
	const key = req.query.key
})

app.get('/healthcheck', (req, res, next) => {
	res.sendStatus(200)
})

function startApplication(app) {
	app.listen(config.port, () => console.log(`Cliente levantado en el puerto: ${config.port}!`))
}

subscriptions.subscriber.subscribeAsClient(app, config.port, config.masterPort, getDatanodesInformation, startApplication)

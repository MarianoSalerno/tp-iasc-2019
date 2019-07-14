const express = require('express') 
const bodyParser = require('body-parser') 
const app = express() 

const consoleParams = require('console_params')  

const subscriptions = require('subscriptions')  
const cluster = require('./cluster.js')  

function changeMasterOrchestrator() { 
  
} 

app.use( bodyParser.json() ); 

app.get('/healthcheck',(req, res, next) => { 
	// Hoy devuelve 200, pero los orquestadores podrían tener lógica diferente de los nodos de datos para verificar que están vivos y funcionan bien
	res.sendStatus(200)
}) 

const validNodeTypes = new Set(["orchestrator", "data", "client"])
app.post('/subscribers/:type', (req, res, next) => {
	const type = req.params.type
	if (!validNodeTypes.has(type)){
		let message = `What is a ${type}? I don't know that kind of node!`
		console.log(message)
		res.status(400).json({error: message})
	} else {
		const subscriberPort = req.body.port
		//const subscriberIp = req.body.ip TODO: agregar IP
		subscriptions.publisher.addSubscriber(subscriberPort)
		// cluster.addSubscriber(subscriberPort) // TODO: Agregarlo con el tipo correcto, para que se sume al snapshot
		console.log(cluster.getSnapshot())
		console.log(`New subscription from ${type} node!`)
		res.send(cluster.getSnapshot())
	}
})
 
process.on('exit', () => {   
    changeMasterOrchestrator() 
}) 

cluster.init(app) 

app.listen(consoleParams.port, () => console.log(`Orquestrator working on port: ${consoleParams.port}!`))

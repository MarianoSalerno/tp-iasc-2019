const express = require('express') 
const bodyParser = require('body-parser') 
const app = express() 

const consoleParams = require('./consoleParams.js')  

const subscriptions = require('./subscriptions.js')  
const cluster = require('./cluster.js')  

function changeMasterOrchestrator() { 
  
} 

app.use( bodyParser.json() ); 
 
app.post('/get-conf/:node', (req, res, next) => { 
	if(cluster.thisIsSlave) { 
		res.status(400).send('Not the master orchestrator'); 
	} else {
		const node = req.params.node // TODO: Ver si hace falta diferenciar la info según quién pregunte
		res.json(cluster.snapshot()) 
	}
}) 

const validNodeTypes = new Set("orchestrator", "data", "client")
app.post('/subscribe/:type', (req, res, next) => { 
	const type = req.params.type
	if (!validNodeTypes.includes(type)){
		req.status(400).json({error: "I don't know that kind of node!"})
	} else {
		const subscriberPort = req.body.port
		subscriptions.publisher.addSubscriber(subscriberPort)
		cluster.addSubscriber()
		res.json(cluster.snapshot())
	}
}) 
 
app.post('/change-to-master',() => { 
	isMaster = true 
}) 

app.get('/healthcheck',(req, res, next) => { 
	// Hoy devuelve 200, pero los orquestadores podrían tener lógica diferente de los nodos de datos para verificar que están vivos y funcionan bien
	res.sendStatus(200)
}) 
 
process.on('exit', () => {   
    changeMasterOrchestrator() 
}) 

cluster.init() 

app.listen(consoleParams.port, () => console.log(`Orquestrator working on port: ${consoleParams.port}!`))

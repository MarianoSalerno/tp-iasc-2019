const express = require('express') 
const bodyParser = require('body-parser') 
const app = express() 

const configuration = require('./conf.js')  
const consoleParams = require('./consoleParams.js')  

const subscriptions = require('./subscriptions.js')  

let isMaster = configuration.isMaster 
 
function changeMasterOrchestrator() { 
  
} 

app.use( bodyParser.json() ); 
 
app.post('/get-conf/:node', (req, res, next) => { 
	if(isMaster) { 
		const node = req.params.node 
		let response = {} 

		if (node == 'client') { 
			response['dataNodes'] = configuration.dataNodes 
			response['maxSize'] = configuration.maxSize
		} else { 
			response['maxStorage'] = configuration.maxStorage 
		} 
		res.send(response) 
	} else { 
		res.status(400).send('Not the master orchestrator'); 
	} 
}) 

const validNodeTypes = ["orchestrator", "data", "client"]
app.post('/subscribe/:type', (req, res, next) => { 
	const type = req.params.type
	if (!validNodeTypes.includes(type)){
		req.status(400).json({error: "I don't know that kind of node!"})
	} else {
		const subscriberPort = req.body.port
		subscriptions.addSubscriber(type, subscriberPort)
		res.sendStatus(200)
	}
}) 
 
app.post('/change-to-master',() => { 
	isMaster = true 
}) 
 
process.on('exit', () => {   
    changeMasterOrchestrator() 
}) 

subscriptions.configureAsMasterOrSlave(consoleParams) 

app.listen(consoleParams.port, () => console.log(`Orquestrator working on port: ${consoleParams.port}!`))

const configuration = require('./conf.js')  
const express = require('express') 
const bodyParser = require('body-parser') 
const app = express() 
let isMaster = configuration.isMaster 
let orchestrators = configuration.orchestrators 
 
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
 
app.post('/change-to-master',() => { 
	isMaster = true 
}) 
 
process.on('exit', () => {   
    changeMasterOrchestrator() 
}) 
 
app.listen(configuration.port, () => console.log(`Cliente levantado en el puerto: ${configuration.port}!`))
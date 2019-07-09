const configuration = require('./conf.js') 
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios');
const app = express()
const map = {} // TODO: Borrar el mapa de este nodo. Solo tienen que guardarse en nodos de datos
const orchestrators = configuration.orchestrators
let ipMasterOrcherstrator

function findMasterOrchestrator() {
	for (ip of orchestrators) {
		axios.post(`${ip}/get-conf/client`)
		.then((response) => {
			console.log(response.data)
			var dataNodes = response.data.dataNodes
			var maxSize = response.data.maxSize
			ipMasterOrcherstrator = ip
		})
		.catch((error) => console.log("fallo"))
	}
}
findMasterOrchestrator()

app.use( bodyParser.json() );

app.get('/data/:key', (req, res, next) => {
	const key = req.params.key
	if (tooBig(key) || tooBig(value)) return next(new Error('key o value superan tamaño maximo'))

	// TODO: Pegarle al nodo de datos correspondiente, y si éste da 404, devolver 404 nosotros también.
	const value = map[key]
	if (value === undefined) return next(new Error('key not found'))

	res.send(value)
})

const upsert = (req, res, next) => {
	const key = req.params.key
	const value = req.body.value

	if (tooBig(key) || tooBig(value)) return next(new Error('key o value superan tamaño maximo'))

	// TODO: Pegarle al nodo de datos correspondiente
	map[key] = value
	res.send("ok")
}

app.post('/data/:key', upsert)
app.put('/data/:key', upsert)

app.listen(configuration.port, () => console.log(`Cliente levantado en el puerto: ${configuration.port}!`))

const tooBig = (keyOrValue) => keyOrValue.length > maxSize

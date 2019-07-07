const express = require('express')
const app = express()
const port = 3000
const map = {} // TODO: Borrar el mapa de este nodo. Solo tienen que guardarse en nodos de datos
const bodyParser = require('body-parser')
const maxSize = 10

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



app.listen(port, () => console.log(`Cliente levantado en el puerto: ${port}!`))

const tooBig = (keyOrValue) => keyOrValue.length > maxSize

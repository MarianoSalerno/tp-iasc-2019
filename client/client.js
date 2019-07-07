const express = require('express')
const app = express()
const port = 3000
const map = {}
const bodyParser = require('body-parser')
const maxSize = 10

app.use( bodyParser.json() );

app.get('/get/:key', (req, res, next) => {
	const key = req.params.key
	const value = map[key]

	if (tooBig(key) || tooBig(value)) return next(new Error('key o value superan tamaño maximo'))
	if (value === undefined) return next(new Error('key not found'))

	res.send(value)
})

app.post('/put/:key', (req, res, next) => {
	const key = req.params.key
	const value = req.body.value

	if (tooBig(key) || tooBig(value)) return next(new Error('key o value superan tamaño maximo'))
	map[key] = value
	res.send("ok")
})

app.listen(port, () => console.log(`Cliente levantado en el puerto: ${port}!`))

const tooBig = (keyOValue) => keyOValue.length > maxSize

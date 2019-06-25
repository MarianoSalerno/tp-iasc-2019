const express = require('express')
const app = express()
const port = 3000
const map = {}
const bodyParser = require('body-parser')

app.use( bodyParser.json() );

app.get('/get/:key', (req, res, next) => {
	const value = map[req.params.key]
	if (value === undefined) return next(new Error('key not found'))
	res.send(value)
})

app.post('/put/:key', (req, res, next) => {
	map[req.params.key] = req.body.value
	res.send("ok")
})

app.listen(port, () => console.log(`Cliente levantado en el puerto: ${port}!`))

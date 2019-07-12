const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3001
const map = {}
const maxSize = 10

app.use(bodyParser.json())

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/keys/:key', (req, res, next) =>  { 
    const key = req.params.key
    const value = map[key]
    if (value === undefined) return next(new Error('Key not found'))

    let oMyOBject = {value : value}

    res.json(oMyOBject) 
}
)

const upsert = (key, req, res, next) => {
	const value = req.body.value

    if (isTooBig(key)) return next(new Error('Key supera tamaño maximo'))
    if (isTooBig(value)) return next(new Error('Value supera tamaño maximo'))

	// TODO: Pegarle a la partición del nodo correspondiente
	map[key] = value
	res.json({ response : 'ok' })
}

const update = (req, res, next) => {
    const key = req.params.key 
    upsert(key, req, res, next)
}

const insert = (req, res, next) => {
    const key = req.body.key 
    upsert(key, req, res, next)
}

const isTooBig = (keyOrValue) => keyOrValue.length > maxSize

const delete = (req, res, next) => {
    const key = req.body.key 
    upsert(key, req, res, next)
}

app.post('/keys', insert) 
app.put('/keys/:key', update)
app.delete('/keys/:key', delete)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
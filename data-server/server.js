const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3001
const map = new Map()
const maxSize = 10

const upsert = (key, req, res, next) => {
	const value = req.body.value

    if (isTooBig(key)) return next(new Error('Key supera tamaño maximo'))
    if (isTooBig(value)) return next(new Error('Value supera tamaño maximo'))

	// TODO: Pegarle a la partición del nodo correspondiente
	map.set(key, value)
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

const remove = (req, res, next) => {
    const key = req.params.key
    const keyWasPresent = map.delete(key)
    if(!keyWasPresent) {
        res.status(400).json({"response" : "Key was not present in node"})
        return    
    }

    res.json({"response":"ok"})
}

app.use(bodyParser.json())

app.get('/keys/:key', (req, res, next) =>  { 
    const key = req.params.key
    const isKeyPresent = map.has(key)
    if (!isKeyPresent) return next(new Error('Key not found'))

    const value = map.get(key);

    let oMyOBject = { key : value}

    res.json(oMyOBject) 
}
)

app.post('/keys', insert) 
app.put('/keys/:key', update)
app.delete('/keys/:key', remove)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
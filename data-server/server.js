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

function searchForGreaterValues(valuesGreaterThan, res) {
    const result = {}

    for (var [key, value] of map) {
        console.log(key + ' = ' + value);
        if (value > valuesGreaterThan) {
            result[key] = value;
        }
    }

    res.json(result);
}

function searchForSmallerValues(valuesSmallerThan, res) {
    const result = {}

    for (var [key, value] of map) {
        console.log(key + ' = ' + value);
        if (value < valuesSmallerThan) {
            result[key] = value;
        }
    }
    
    res.json(result);
}

const searchForValues = (req, res, next) => {
    const valuesGreaterThan = req.query.valuesGreaterThan
    if(valuesGreaterThan != undefined) return searchForGreaterValues(valuesGreaterThan, res);

    const valuesSmallerThan = req.query.valuesSmallerThan
    if(valuesSmallerThan != undefined) return searchForSmallerValues(valuesSmallerThan, res);
    
    return next(new Error('Value not specified'))
}


app.use(bodyParser.json())
app.get('/scan', searchForValues)

app.get('/keys/:key', (req, res, next) =>  { 
    const key = req.params.key
    const isKeyPresent = map.has(key)
    if (!isKeyPresent) return next(new Error('Key not found'))

    const value = map.get(key)

    let oMyOBject = { key : value}

    res.json(oMyOBject) 
}
)

app.post('/keys', insert) 
app.put('/keys/:key', update)
app.delete('/keys/:key', remove)

app.listen(port, () => console.log(`Data node listening on port ${port}!`))

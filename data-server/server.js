const express = require('express')
const bodyParser = require('body-parser')
const hash = require('./hash-function.js')
const config = require('./consoleParams.js')  
const app = express()

//todo: todo esto deberia pasarse por parametro
const totalPartitions = 3
const newPartitions = new Map() //indexado por numero de particion presente --> {2, datos},{3, datos}
newPartitions.set(0, new Map())
newPartitions.set(1, new Map())
newPartitions.set(2, new Map())
const maxSizePartition = 4

function getPartition(key, next) {
    const partitionIndex = hash.getPartitionFromKey(totalPartitions, key)
    console.log("Resultado hash " + partitionIndex + ". Key " + key) //todo: borrar
    const partition = newPartitions.get(partitionIndex)
    if(partition === undefined) return next(new Error("Partition not present in this node"))

    return partition
}

const upsert = (key, req, res, next) => {
	const value = req.body.value

    if (isTooBig(key)) return next(new Error('Key supera tamaño maximo'))
    if (isTooBig(value)) return next(new Error('Value supera tamaño maximo'))

    const partition = getPartition(key, next)
    partition.set(key, value)
    
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

const isTooBig = (keyOrValue) => keyOrValue.length > 10 //todo: sacarlo de la conexion con el orquestador

const remove = (req, res, next) => {
    const key = req.params.key
    const partition = getPartition(key, next)
    const keyWasPresent = partition.delete(key)
    
    if(!keyWasPresent) {
        res.status(400).json({"response" : "Key was not present in node"})
        return    
    }

    res.json({"response":"ok"})
}

function searchForGreaterValues(valuesGreaterThan, res) {
    const result = {}

    for(var partitions of newPartitions.values()) {
        for (var [key, value] of partitions) {
            console.log(key + ' = ' + value);
            if (value > valuesGreaterThan) {
                result[key] = value;
            }
        }
    }

    res.json(result);
}

function searchForSmallerValues(valuesSmallerThan, res) {
    const result = {}

    for(var partitions of newPartitions.values()) { 
        for (var [key, value] of partitions) {
            console.log(key + ' = ' + value);
            if (value < valuesSmallerThan) {
                result[key] = value;
            }
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

    const partition = getPartition(key, next)

    const value = partition.get(key)
    console.log("Value " + value) //todo: borrar
    if (value === undefined) return next(new Error('Key not found'))

    res.json({key: value}) 
}
)

app.post('/keys', insert) 
app.put('/keys/:key', update)
app.delete('/keys/:key', remove)

function getConfigFromOrchestrator() {
}

app.listen(config.port, () => console.log(`Data node listening on port ${config.port}!`))

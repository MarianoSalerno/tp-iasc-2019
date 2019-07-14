const express = require('express')
const bodyParser = require('body-parser')
const hash = require('./hash-function.js')
const config = require('console_params') 
const subscriptions = require('subscriptions')  
const app = express()
const localIp = require('internal-ip')
const axios = require('axios')

//todo: todo esto deberia pasarse por parametro
const totalPartitions = 3
const partitions = new Map() //indexado por numero de particion presente --> {2, datos},{3, datos}
let maxSizePerPartition
let itemMaxSize

function getPartitionIndex(req, next) {
    const partitionIndexString = req.params.partition
    const partitionIndex = parseInt(partitionIndexString)
    if(!partitions.has(partitionIndex)) return next(new Error('Partition not present in node'))
    return partitionIndex
}

const upsert = (key, req, res, next) => {
    const value = req.body.value
    const partitionIndex = getPartitionIndex(req, next)

    if (isTooBig(key)) return next(new Error('Key supera tamaño maximo'))
    if (isTooBig(value)) return next(new Error('Value supera tamaño maximo'))

    const partition = partitions.get(partitionIndex)
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

const isTooBig = (keyOrValue) => keyOrValue.length > itemMaxSize

const remove = (req, res, next) => {
    const key = req.params.key
    const partitionIndex = getPartitionIndex(req, next)

    const keyWasPresent = partitions.get(partitionIndex).delete(key)
    
    if(!keyWasPresent) {
        res.status(400).json({"response" : "Key was not present in node"})
        return    
    }

    res.json({"response":"ok"})
}

function searchForGreaterValues(valuesGreaterThan, res) {
    const result = {}

    for(var partitions of partitions.values()) {
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

    for(var partitions of partitions.values()) { 
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

app.get('/keys/:partition/:key', (req, res, next) =>  { 
    const key = req.params.key
    const partitionIndex = getPartitionIndex(req, next)

    const value = partitions.get(partitionIndex).get(key)
    if (value === undefined) return next(new Error('Key not found'))

    const result = {}
    result[key] = value
    res.json(result) 
}
)

app.post('/keys/:partition', insert) 
app.put('/keys/:partition/:key', update)
app.delete('/keys/:partition/:key', remove)

app.get('/healthcheck', (req, res, next) => { 
	res.sendStatus(200)
})

function updateShards(snapshot){
    partitions.set(0, new Map())
    partitions.set(1, new Map())
    partitions.set(2, new Map())
    maxSizePerPartition = 5 
    itemMaxSize = 20 
    // TODO: Actualizar nuestros shards para tener solo lo que indique el snapshot para este nodo
}

subscriptions.subscriber.subscribeAsDataNode(app, config.port, config.masterPort, updateShards)

app.listen(config.port, () => console.log(`Data node listening on port ${config.port}!`))

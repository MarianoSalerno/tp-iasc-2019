const express = require('express')
const bodyParser = require('body-parser')
const config = require('console_params') 
const subscriptions = require('subscriptions')  
const app = express()

const partitions = new Map() //indexado por numero de particion presente --> {2, datos},{3, datos}
let maxSizePerPartition
let itemMaxSize
let partitionsFrom
let partitionsTo

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

function updateShards(snapshot) {
    itemMaxSize = snapshot.dataConfiguration.itemMaxSize
    maxSizePerPartition = snapshot.dataConfiguration.maxStoragePerNode
    const shards = snapshot.shards
    const nodePath = new String(`http://localhost:${config.port}`);
   
    const shardsForThisNode = shards.find(element => {
        const elementPath = new String(element.path);
        return JSON.stringify(nodePath) === JSON.stringify(elementPath);
    });

    if(shardsForThisNode === undefined) { console.log(`No shards found for node port ${config.port}. Fix configuration`); return new Error() } 

    partitionsFrom = shardsForThisNode.partitions.from
    partitionsTo = shardsForThisNode.partitions.to 
    
    const range = (start, stop) => Array.from({ length: (stop - start) + 1}, (_, i) => start + i );
    const partitionIndexes = range(partitionsFrom, partitionsTo)
    partitionIndexes.forEach(index => {
        if(partitions.has(index)) return;
        partitions.set(index, new Map())
    });

    console.log(`Config updated. ItemMaxSize: ${itemMaxSize}. MaxSizePerPartition: ${maxSizePerPartition}`)
    console.log(`Partitions accepted ${Array.from(partitions.keys())}`)
}

subscriptions.subscriber.subscribeAsDataNode(app, config.port, config.masterPort, updateShards)

app.listen(config.port, () => console.log(`Data node listening on port ${config.port}!`)) 
//TODO: que solo se haga si el nodo puede iniciar bien, pasarlo como callback del subscribe

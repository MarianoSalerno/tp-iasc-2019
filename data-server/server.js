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

function getPartitionIndex(req, res) {
    const partitionIndexString = req.params.partition
    const partitionIndex = parseInt(partitionIndexString)
    if(!partitions.has(partitionIndex)) {
        res.status(400).json({"response" : "Partition not present in node"})
        return -1
    }
    return partitionIndex
}

function partitionHasEnoughSpace(partition) {
    return partition.size < maxSizePerPartition
}

const upsert = (req, res, next) => {
    const key = req.body.key
    const value = req.body.value

    if(key === undefined) {
        res.status(400).json({"response" : "Key is missing"})
        return
    }

    if(value === undefined) {
        res.status(400).json({"response" : "Value is missing"})
        return
    }

    if (isTooBig(key)) {
        res.status(400).json({"response" : "Key is too large"})
        return 
    }

    if (isTooBig(value)) {
        res.status(400).json({"response" : "Value is too large"})
        return
    }

    const partitionIndex = getPartitionIndex(req, res)
    if(partitionIndex === -1) return
    const partition = partitions.get(partitionIndex)
    
    if (!partitionHasEnoughSpace(partition)) {
        res.status(400).json({"response" : `Partition ${partitionIndex} does not have enough space to store another pair.`})
        return
    }
    
    partition.set(key, value)
    console.log(`New pair inserted. Key: ${key}. Value: ${value}`)
    
	res.json({ response : 'ok' })
}

const isTooBig = (keyOrValue) => keyOrValue.length > itemMaxSize

const remove = (req, res, next) => {
    const key = req.params.key
    const partitionIndex = getPartitionIndex(req, res)
    if(partitionIndex === -1) return

    const keyWasPresent = partitions.get(partitionIndex).delete(key)
    
    if(!keyWasPresent) {
        res.status(400).json({"response" : "Key was not present in node"})
        return    
    }

    console.log(`Key-value pair removed. Key: ${key}`)

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
    
    res.status(400).json({"response" : "Value not specified"})
    return
}

app.use(bodyParser.json())
app.get('/scan', searchForValues)

app.get('/keys/:partition/:key', (req, res, next) =>  { 
    const key = req.params.key
    const partitionIndex = getPartitionIndex(req, res)
    if(partitionIndex === -1) return

    const value = partitions.get(partitionIndex).get(key)
    if (value === undefined) {
        res.status(421).json({"response" : "Key was not present in node"})
        return 
    }

    const result = {}
    result[key] = value
    res.json(result) 
}
)

app.post('/keys/:partition', upsert) 
app.delete('/keys/:partition/:key', remove)

app.get('/healthcheck', (req, res, next) => { 
	res.sendStatus(200)
})

function updateShards(snapshot) {
    itemMaxSize = snapshot.dataConfiguration.itemMaxSize
    maxSizePerPartition = snapshot.dataConfiguration.maxStoragePerPartition
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

function startApplication(app) {
    app.listen(config.port, () => console.log(`Data node listening on port ${config.port}!`)) 
}

subscriptions.subscriber.subscribeAsDataNode(app, config.port, config.masterPort, updateShards, startApplication)

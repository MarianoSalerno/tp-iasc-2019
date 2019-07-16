const axios = require('axios');
const subscriptions = require('subscriptions')
const cluster = require('./cluster.js')
const consoleParams = require('console_params') 

var interval 

function copyMasterSubscriptions() {
    subscriptions.initSubscriptions()
    const snapshot = cluster.getSnapshot()
    snapshot.shards.forEach(node => {
        if(node.available === true) { 
            subscriptions.publisher.addSubscriber("data", node.port) 
        }
    })

    snapshot.orchestrators.slaves.forEach(slave => {
        subscriptions.publisher.addSubscriber("orchestrator", slave.port)
    })

    snapshot.clientsConnected.forEach(port => {
        subscriptions.publisher.addSubscriber("client", port)
    })
}

function checkMasterHealth() {
    return () => {
        const masterPort = cluster.getSnapshot().orchestrators.master
        axios.get(`http://localhost:${masterPort}/healthcheck`, { timeout: 300 })
            .then((response) => { console.log(`Master orchestrator ${masterPort} is healthy.`) })
            .catch((error) => {
                console.log(`Something failed checking health of master orchestrator, port ${masterPort}. More info: ${error}`)
                if(cluster.isThisSlaveWithHighestPriority(consoleParams.port)) {
                    cluster.updateMaster(consoleParams.port)
                    copyMasterSubscriptions()
                    subscriptions.notifyNewsToAllSubscribers(cluster.getSnapshot())
                    stopMonitoringMaster()
                } else {
                    console.log(`This slave cannot be master because it does not have the highest priority`)
                }
            })
    }
}

function checkHealthEvery(seconds) {
    interval = setInterval(checkMasterHealth(), seconds * 1000)
}

function stopMonitoringMaster() {
    clearInterval(interval)
}

exports.checkMasterHealthEvery = checkHealthEvery
exports.dataNodes = [ 
    { 
        'path': 'http://localhost:5001', 
        'partitions': { 
            'from': 1, 
            'to': 16 
        } 
    }, 
    { 
        'path': 'http://localhost:5002', 
        'partitions': { 
            'from': 17, 
            'to': 32 
        } 
    }, 
    { 
        'path': 'http://localhost:5003', 
        'partitions': { 
            'from': 33, 
            'to': 48 
        } 
    }, 
    { 
        'path': 'http://localhost:5004', 
        'partitions': { 
            'from': 49, 
            'to': 64 
        } 
    }
] 
exports.totalPartitions = 64
exports.itemMaxSize = 20
exports.maxStoragePerPartition = 2
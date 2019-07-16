exports.dataNodes = [ 
    { 
        'port': '5001',
        'available': false, 
        'partitions': { 
            'from': 1, 
            'to': 16 
        } 
    }, 
    { 
        'port': '5002', 
        'available': false,
        'partitions': { 
            'from': 17, 
            'to': 32 
        } 
    }, 
    { 
        'port': '5003', 
        'available': false,
        'partitions': { 
            'from': 33, 
            'to': 48 
        } 
    }, 
    { 
        'port': '5004', 
        'available': false,
        'partitions': { 
            'from': 49, 
            'to': 64 
        } 
    }
]

exports.totalPartitions = 64
exports.itemMaxSize = 20
exports.maxStoragePerPartition = 2
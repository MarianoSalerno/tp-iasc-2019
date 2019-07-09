exports.port = 4000 
exports.isMaster = true 
exports.orchestrators = ['http://localhost:4001','http://localhost:4002'] //estos son sus compañeros orquestadores, en caso de caerse le tiene que transferir el master a otro. 
//client configurations 
exports.dataNodes = [ 
    { 
        'ip': '192.168.0.2', 
        'partitions': { 
            'bottom': 0, 
            'top': 15 
        } 
    }, 
    { 
        'ip': '192.168.0.3', 
        'partitions': { 
            'bottom': 16, 
            'top': 31 
        } 
    }, 
    { 
        'ip': '192.168.0.4', 
        'partitions': { 
            'bottom': 32, 
            'top': 47 
        } 
    }, 
    { 
        'ip': '192.168.0.5', 
        'partitions': { 
            'bottom': 48, 
            'top': 63 
        } 
    } 
] 
exports.maxSize = 10
//data nodes configurations 
exports.maxStorage = 5
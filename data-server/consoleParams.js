function toInteger(someString) {
	const possibleInteger = parseInt(someString)
	if (!Number.isInteger(possibleInteger))
		throw new Error("It must be a valid integer! And " + someString + " is not!")
	return possibleInteger
}

const port = toInteger(process.argv[2])
const orchestratorPort = toInteger(process.argv[3])

exports.port = port
exports.orchestratorPort = orchestratorPort
exports.orchestratorIp = function() {  
	const ip = process.argv[4]
	if(ip === undefined) return "127.0.0.1"
	return ip 
}
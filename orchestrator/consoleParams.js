function toInteger(someString) {
	const possibleInteger = parseInt(someString)
	if (!Number.isInteger(possibleInteger))
		throw new Error("It must be a valid integer! And " + someString + " is not!")
	return possibleInteger
}

const port = toInteger(process.argv[2])
const masterPort = toInteger(process.argv[3])

exports.port = port
exports.masterPort = masterPort
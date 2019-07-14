function stringHash(someString) {
    var hash = 0, i, chr;
    if (someString.length === 0) return hash;
    for (i = 0; i < someString.length; i++) {
      chr   = someString.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

exports.getPartitionFromKey =  function (partitionsQuantity, key) {
    return Math.abs(stringHash(key) % partitionsQuantity)
}
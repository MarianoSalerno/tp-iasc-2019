const express = require('express')
const app = express()
const port = 3001
const map = {}

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/keys/:key', (req, res, next) =>  { 
    const key = req.params.key
    const value = map[key]
    if (value === undefined) return next(new Error('key not found'))

    let oMyOBject = {key:'value'}

    res.json(oMyOBject) 
    }
)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
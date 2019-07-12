const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3001
const map = {}
const maxSize = 256

app.use(bodyParser.json())


app.get('/', (req, res) => res.send('Hello World!'))

app.get('/keys/:key', (req, res, next) =>  { 
    const key = req.params.key
    const value = map[key]
    if (value === undefined) return next(new Error('Key not found'))

    let oMyOBject = {key:'value'}

    res.json(oMyOBject) 
    }
)

const upsert = (req, res, next) => {
	const key = req.params.key //TODO: validar que venga el value! 
	const value = req.body.value

    if (isTooBig(key)) return next(new Error('Key supera tamaño maximo'))
    if (isTooBig(value)) return next(new Error('Value supera tamaño maximo'))

	// TODO: Pegarle a la partición del nodo correspondiente
	map[key] = value
	res.json({ response : 'ok' })
}

const isTooBig = (keyOrValue) => keyOrValue.length > maxSize

app.post('/keys/:key', upsert) //todo: pasarlo al post que venga en el body
app.put('/keys/:key', upsert)

app.get('/healthcheck',(req, res, next) => { 
	// Hoy devuelve 200, pero los nodos de datos podrían tener lógica diferente de los orquestadores para verificar que están vivos y funcionan bien
	res.sendStatus(200)
}) 

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
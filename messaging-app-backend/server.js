import express from 'express'
import mongoose from 'mongoose'
import Cors from 'cors'
import Messages from './dbMessages.js'
import multer from 'multer'
import { Readable } from 'stream'

//App Config
const app = express()
const port = process.env.PORT || 9000
const connection_url = 'mongodb://localhost:27017/chat'

//Middleware
app.use(express.json())
app.use(Cors())

//DB Config
mongoose.connect(connection_url)

let gridFSBucket
mongoose.connection.once('open', () => {
  gridFSBucket = new
    mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'images'
    })
})

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'image/png') {
      return cb(new Error('Apenas imagens PNG são permitidas'))
    }
    cb(null, true)
  }
})

//API Endpoints
app.get("/", (req, res) => res.status(200).send("Hello TheWebDev"))

app.post('/messages/new', async (req, res) => {
  try {
    const dbMessage = req.body
    Messages.create(dbMessage)
    res.status(201).send(dbMessage)
  } catch (error) {
    res.status(500).send(error)
  }
})

app.get('/messages/sync', async (req, res) => {
  try {
    const dbMessages = await Messages.find()
    res.status(200).send(dbMessages)
  } catch (error) {
    res.status(500).send(error)
  }
})

app.post('/messages/image', upload.single('image'), async (req, res) => {
  try {
    if (!gridFSBucket) // Sem gridfs ativo
      return res.status(503).send({
        message: 'GridFS ainda não está pronto'
      })
    if (!req.file) // Arquivo não PNG.
      return res.status(400).send({
        message: 'Nenhuma imagem PNG enviada'
      })
    //Inicia o stream de envio
    const uploadStream =
      gridFSBucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype
      })

    Readable.from(req.file.buffer)
      .pipe(uploadStream)
      .on('error', (error) => {
        res.status(500).send(error)
      })
      .on('finish', async () => {
        const dbMessage = {
          message: '',
          name: req.body.name,
          timestamp: new Date().toUTCString(),
          received: true,
          imageId: uploadStream.id.toString()
        }
        await Messages.create(dbMessage)
        res.status(201).send(dbMessage)
      })
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

app.get('/messages/image/:id', async (req, res) => {
  try {
    if (!gridFSBucket)
      return res.status(503).send({
        message: 'GridFS ainda não está pronto'
      })
    const fileId = new mongoose.Types.ObjectId(req.params.id)
    res.set('Content-Type', 'image/png')
    gridFSBucket.openDownloadStream(fileId)
      .on('error', (error) => {
        res.status(404).send(error)
      })
      .pipe(res)
  } catch (error) {
    res.status(500).send(error)
  }
})

app.get('/messages/actives', async (req, res) => {
  try {
    const cincoMinutos = new Date(Date.now() - 5 * 60 * 1000)
    const activeUsers = await Messages.distinct('name', {
      timestamp: {
        $gte: cincoMinutos.toUTCString()
      }
    })

    res.status(200).send(activeUsers)
  } catch (error) {
    res.status(500).send(error)
  }
})

//Listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`))
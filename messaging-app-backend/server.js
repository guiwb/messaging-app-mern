import express from 'express'
import mongoose from 'mongoose'
import Cors from 'cors'
import Messages from './dbMessages.js'

//App Config
const app = express()
const port = process.env.PORT || 9000
const connection_url = 'mongodb://localhost:27017/chat'

//Middleware
app.use(express.json())
app.use(Cors())

//DB Config
mongoose.connect(connection_url)

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

//Listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`))
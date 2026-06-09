import dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
import mongoose from "mongoose";
import Cors from "cors";
import Messages from "./dbMessages.js";
import multer from "multer";
import { Readable } from "stream";
import uploadArquivos from "./middlewares/upload.js";
import { convert } from "./services/conversor.js";
import fs from "fs";
import path from "path";
//App Config
const app = express();
const port = process.env.PORT || 9000;
const connection_url = "mongodb://localhost:27017/chat";

//Middleware
app.use(express.json());
app.use(Cors());
app.use("/uploads", express.static("uploads"));

//DB Config
mongoose.connect(connection_url);
let gridFSBucket;
let gridFSAudioBucket;
mongoose.connection.once("open", () => {
    gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "images",
    });
    gridFSAudioBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "audios",
    });
});

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "image/png") {
            return cb(new Error("Apenas imagens PNG são permitidas"));
        }
        cb(null, true);
    },
});

const uploadAudio = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("audio/")) {
            return cb(new Error("Apenas arquivos de áudio são permitidos"));
        }
        cb(null, true);
    },
});

//API Endpoints
app.get("/", (req, res) => res.status(200).send("Hello TheWebDev"));

app.post("/messages/new", async (req, res) => {
    try {
        const dbMessage = req.body;
        Messages.create(dbMessage);
        res.status(201).send(dbMessage);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get("/messages/search", async (req, res) => {
  const text = req.query.text;

  try {
    const dbMessages = await Messages.find({ 
      message: { $regex: text, $options: "i" } 
    }).sort({timestamp: -1});
    res.status(200).send(dbMessages);
    // res.status(200).json({msg:"ok"});
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/messages/sync", async (req, res) => {
    try {
        const dbMessages = await Messages.find();
        res.status(200).send(dbMessages);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post("/messages/image", upload.single("image"), async (req, res) => {
    try {
        if (!gridFSBucket)
            // Sem gridfs ativo
            return res.status(503).send({
                message: "GridFS ainda não está pronto",
            });
        if (!req.file)
            // Arquivo não PNG.
            return res.status(400).send({
                message: "Nenhuma imagem PNG enviada",
            });
        //Inicia o stream de envio
        const uploadStream = gridFSBucket.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype,
        });

        Readable.from(req.file.buffer)
            .pipe(uploadStream)
            .on("error", (error) => {
                res.status(500).send(error);
            })
            .on("finish", async () => {
                const dbMessage = {
                    message: "",
                    name: req.body.name,
                    timestamp: new Date().toUTCString(),
                    received: true,
                    type: "image",
                    imageId: uploadStream.id.toString(),
                };
                await Messages.create(dbMessage);
                res.status(201).send(dbMessage);
            });
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

app.post("/messages/audio", uploadAudio.single("audio"), async (req, res) => {
    try {
        if (!gridFSAudioBucket)
            return res.status(503).send({ message: "GridFS ainda não está pronto" });
        if (!req.file)
            return res.status(400).send({ message: "Nenhum arquivo de áudio enviado" });

        const uploadStream = gridFSAudioBucket.openUploadStream(
            req.file.originalname || "audio",
            { contentType: req.file.mimetype }
        );

        Readable.from(req.file.buffer)
            .pipe(uploadStream)
            .on("error", (error) => res.status(500).send(error))
            .on("finish", async () => {
                const dbMessage = {
                    message: "",
                    name: req.body.name,
                    timestamp: new Date().toUTCString(),
                    received: true,
                    audioId: uploadStream.id.toString(),
                };
                await Messages.create(dbMessage);
                res.status(201).send(dbMessage);
            });
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

app.get("/messages/audio/:id", async (req, res) => {
    try {
        if (!gridFSAudioBucket)
            return res.status(503).send({ message: "GridFS ainda não está pronto" });
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        gridFSAudioBucket
            .openDownloadStream(fileId)
            .on("error", (error) => res.status(404).send(error))
            .pipe(res);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post("/convert", uploadArquivos.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("Nenhum arquivo enviado");
    }
    try {
        const data = await convert(req.file.path);
        const fileName = `converted-${Date.now()}.pdf`;
        const filePath = path.join("uploads", fileName);
        fs.writeFileSync(filePath, data);
        return res.json({
            fileUrl: `http://localhost:9000/uploads/${fileName}`,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Erro na conversão");
    }
});

app.get("/messages/image/:id", async (req, res) => {
    try {
        if (!gridFSBucket)
            return res.status(503).send({
                message: "GridFS ainda não está pronto",
            });
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        res.set("Content-Type", "image/png");
        gridFSBucket
            .openDownloadStream(fileId)
            .on("error", (error) => {
                res.status(404).send(error);
            })
            .pipe(res);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get("/messages/actives", async (req, res) => {
    try {
        const cincoMinutos = new Date(Date.now() - 5 * 60 * 1000);
        const activeUsers = await Messages.distinct("name", {
            timestamp: {
                $gte: cincoMinutos.toUTCString(),
            },
        });

        res.status(200).send(activeUsers);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.put("/messages/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { message, name } = req.body;

        if (!id || id === "null") return res.status(404).send({ message: "ID da mensagem inválido" });

        const msg = await Messages.findById(id);
        if (!msg) return res.status(404).send({ message: "Mensagem não encontrada" });  //msg existe
        if (msg.name !== name) return res.status(404).send({ message: "Não pode editar mensagem de outro usuario" }); //mesmo usuario

        const cincoMinutos = new Date(Date.now() - 5 * 60 * 1000);
        if (new Date(msg.timestamp) < cincoMinutos) return res.status(400).send({ message: "Passou o prazo de editar" });

        msg.message = message;
        await msg.save();
        res.status(200).send(msg);
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
});

app.delete("/messages/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const msg = await Messages.findById(id);
        if (!msg) return res.status(404).send({ message: "Mensagem não encontrada" });  //msg existe
        if (msg.name !== name) return res.status(404).send({ message: "Não pode deletar mensagem de outro usuario" }); //mesmo usuario

        const cincoMinutos = new Date(Date.now() - 5 * 60 * 1000);
        if (new Date(msg.timestamp) < cincoMinutos) return res.status(400).send({ message: "Passou o prazo de deletar" });

        await Messages.findByIdAndDelete(id);
        res.status(200).send({ message: "Mensagem deletada com sucesso" });
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
});

//Listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`));

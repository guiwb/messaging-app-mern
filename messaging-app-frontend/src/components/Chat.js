import { useEffect, useRef, useState } from "react";
import { Avatar, IconButton } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import MicIcon from "@mui/icons-material/Mic";
import "./Chat.css";
import axios from "./axios";
import { useStateValue } from "./StateProvider";

const Chat = ({ messages }) => {
  const [seed, setSeed] = useState("");
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [{ user }] = useStateValue();
  const inputRef = useRef(null);
  const [loadingFile, setLoadingFile] = useState(false);

  const openFileSelector = () => {
    fileInputRef.current.click();
  };

  const startAudio = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const formData = new FormData();
        formData.append("audio", blob, "audio");
        formData.append("name", user);
        await axios.post("/messages/audio", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setRecording(false);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert("Permissão de microfone negada.");
    }
  };

  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    if (file.type !== "image/png") {
      alert("Envie apenas imagens PNG.");
      e.target.value = "";
      return;
    }
    const formData = new FormData();
    formData.append("image", file);
    formData.append("name", user);
    await axios.post("/messages/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    e.target.value = "";
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    await axios.post("/messages/new", {
      message: `:\n${input}`,
      name: user,
      timestamp: new Date().toUTCString(),
      received: true,
    });
    setInput("");
  };
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 5000));
  }, []);

  const convertFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingFile(true);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post(
        "http://localhost:9000/convert",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      await axios.post("/messages/new", {
        message: "",
        name: user,
        timestamp: new Date().toUTCString(),
        type: "pdf",
        fileUrl: response.data.fileUrl,
      });
    } catch (error) {
      console.error("Erro na conversão:", error);
    } finally {
      setLoadingFile(false);
    }
  };

  return (
    <div className="chat">
      <div className="chat__header">
        <Avatar
          src={`https://api.dicebear.com/9.x/toon-head/svg?flip=true&seed=${seed}`}
        />
        <div className="chat__headerInfo">
          <h3>Chat básico</h3>
          <p>Visto em: {messages[messages.length - 1]?.timestamp}</p>
        </div>
        <div className="chat__headerRight">
          <IconButton>
            <SearchIcon />
          </IconButton>
          <>
            <IconButton onClick={() => inputRef.current.click()}>
              <img
                src="/converter.svg"
                alt="converter"
                style={{
                  width: 30,
                  height: 30,
                  objectFit: "contain",
                }}
              />
            </IconButton>
            <input
              ref={inputRef}
              type="file"
              hidden
              accept=".doc,.docx"
              onChange={convertFile}
            />
          </>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            onChange={sendImage}
            style={{ display: "none" }}
          />
          <IconButton onClick={openFileSelector}>
            <AttachFileIcon />
          </IconButton>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </div>
      </div>
      <div className="chat__body">
        {messages.map((message, index) => (
          <p
            key={index}
            className={`chat__message ${message.name === user && "chat__receiver"}`}
          >
            <span className="chat__name">{message.name}</span>
            {message.type === "pdf" ? (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="chat__file"
              >
                📄 Abrir PDF
              </a>
            ) : message.type === "image" ? (
              <img
                src={`http://127.0.0.1:9000/messages/image/${message.imageId}`}
                alt="Imagem enviada"
                className="chat__image"
              />
            ) : message.audioId ? (
              <audio controls src={`http://127.0.0.1:9000/messages/audio/${message.audioId}`} />
            ) : (
              message.message
            )}
            <span className="chat__timestamp">{message.timestamp}</span>
          </p>
        ))}
      </div>
      <div className="chat__footer">
        <InsertEmoticonIcon />
        <form onSubmit={sendMessage}>
          <input
            placeholder={
              loadingFile ? "Convertendo arquivo..." : "Digite sua mensagem"
            }
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loadingFile}
          />
          <button type="submit" disabled={loadingFile}>
            {loadingFile ? "..." : "Enviar"}
          </button>
        </form>
        <MicIcon onClick={startAudio} className={recording ? "chat__micRecording" : ""} />
      </div>
    </div>
  );
};
export default Chat;

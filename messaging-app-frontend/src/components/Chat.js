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
  const fileInputRef = useRef(null);
  const [{ user }] = useStateValue();
  // const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState(null);

  const openFileSelector = () => {
    fileInputRef.current.click();
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
      message: input,
      name: user,
      timestamp: new Date().toUTCString(),
      received: true,
    });
    setInput("");
  };

  const searchMessage = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await axios.get(`/messages/search?text=${searchQuery}`);
      const mensagemElement = document.getElementById(response.data[0]._id);

      if(mensagemElement) {
        mensagemElement.scrollIntoView({ behavior: "smooth", block: "center" });

        setHighlightedId(response.data[0]._id);

        setTimeout(() => {
          setHighlightedId(null);
        }, 3000);
      }
      
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
    }
  };

  useEffect(() => {
    setSeed(Math.floor(Math.random() * 5000));
  }, []);

  useEffect(() => {
    searchMessage()
  }, [searchQuery]);

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
          <input 
            type="text" 
            className="search_input" 
            placeholder="Pesquise..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <IconButton>
            <SearchIcon />
          </IconButton>
          <IconButton onClick={() => console.log("Converter")}>
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
            id={message._id}
            key={index}
            className={`chat__message ${message.name === user && "chat__receiver"}
            ${highlightedId === message._id ? "chat__highlight" : ""
      }`}
          >
            <span className="chat__name">{message.name}</span>
            {message.imageId ? (
              <img
                src={`http://127.0.0.1:9000/messages/image/${message.imageId}`}
                alt="Imagem enviada"
                className="chat__image"
              />
            ) : (
              message.message
            )}
            <span className="chat__timestamp">{message.timestamp}</span>
          </p>
        ))}
      </div>
      <div className="chat__footer">
        <InsertEmoticonIcon />
        <form>
          <input
            placeholder="Digite sua mensagem"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" onClick={sendMessage}>
            Enviar
          </button>
        </form>
        <MicIcon />
      </div>
    </div>
  );
};
export default Chat;

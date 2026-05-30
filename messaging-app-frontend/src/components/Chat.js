import { useEffect, useRef, useState } from "react";
import { Avatar, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [mensagemSelecionadaId, setMensagemSelecionadaId] = useState(null);
  const [formEdicaoAberto, setFormEdicaoAberto] = useState(false);
    const [textoEdicao, setTextoEdicao] = useState("");

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

  const abrirMenu = (e, messageId) => {
    setAnchorEl(e.currentTarget);
    setMensagemSelecionadaId(messageId);
  };

  const fecharMenu = () => {
    setAnchorEl(null);
    setMensagemSelecionadaId(null);
  };

  const editarMensagem = (message, messageId) => {
      setTextoEdicao(message);
      setFormEdicaoAberto(true);
      setMensagemSelecionadaId(messageId);
      setTimeout(() => {
          fecharMenu()
      }, 3000);
  };

  const salvarEdicao = async () => {
    try {
        await axios.put(`/messages/edit/${mensagemSelecionadaId}`, {
            message: textoEdicao,
            name: user,
        });
        setFormEdicaoAberto(false);
        setTextoEdicao("");
        setMensagemSelecionadaId(null);
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao editar mensagem");
    }
  };

  const deletarMensagem = async () => {
    if (!confirm("Deseja excluir essa mensagem")) return;
    try {
        await axios.delete(`/messages/delete/${mensagemSelecionadaId}`, {
            data: { name: user },
        });
      fecharMenu();
    } catch (error) {
        console.log(error)
      alert(error.response?.data?.message || "Erro ao deletar mensagem");
    }
  };

  useEffect(() => {
    setSeed(Math.floor(Math.random() * 5000));
  }, []);

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
          <div key={index} className={`chat__messageContainer ${message.name === user && "chat__receiver"}`}>
            <p className={`chat__message ${message.name === user && "chat__receiver"}`}>
              <span className="chat__name">{message.name}</span>
              {message.imageId ? (
                <img src={`http://127.0.0.1:9000/messages/image/${message.imageId}`} alt="Imagem enviada" className="chat__image"/>
              ) : (
                message.message
              )}
              <span className="chat__timestamp">{message.timestamp}</span>
            </p>
            {message.name === user && (
              <IconButton size="small" onClick={(e) => abrirMenu(e, message._id)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </div>
        ))}
      </div>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={fecharMenu}
      >
        <MenuItem
          onClick={() => {
            const msg = messages.find((m) => m._id === mensagemSelecionadaId);
            editarMensagem(msg?.message, mensagemSelecionadaId);
          }}
        >
          Editar
        </MenuItem>
        <MenuItem onClick={deletarMensagem}>
          Deletar
        </MenuItem>
      </Menu>

          <Dialog open={formEdicaoAberto} onClose={() => {
            setFormEdicaoAberto(false);
            setMensagemSelecionadaId(null);
          }}>
        <DialogTitle>Editar Mensagem</DialogTitle>
        <DialogContent>
                  <TextField fullWidth multiline rows={4} value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)}/>
        </DialogContent>
        <DialogActions>
                  <button onClick={() => { 
                    setFormEdicaoAberto(false); 
                    setMensagemSelecionadaId(null); }}>Cancelar</button>
          <button onClick={salvarEdicao}>Salvar</button>
        </DialogActions>
      </Dialog>
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

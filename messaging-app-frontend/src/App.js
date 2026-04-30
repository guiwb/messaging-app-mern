import './App.css';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import axios from './components/axios'
import { useEffect, useState } from 'react';

function App() {
  const [messages, setMessages] = useState([])
  useEffect(() => {
    axios.get("/messages/sync").then(res => {
      setMessages(res.data)
    })
  }, [])

  return (
    <div className="app">
      <div className="app__body">
        <Sidebar />
        <Chat messages={messages} />
      </div>
    </div>
  );
}

export default App;

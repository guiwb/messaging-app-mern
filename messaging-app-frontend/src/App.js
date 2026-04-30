import './App.css';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import Login from './components/Login';
import axios from './components/axios'
import { useEffect, useState } from 'react';
import { useStateValue } from './components/StateProvider';

function App() {
  const [messages, setMessages] = useState([])
  const [{ user }] = useStateValue()

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get("/messages/sync")
        setMessages(response.data)
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error)
      }
    }
    fetchMessages()
    const intervalId = setInterval(fetchMessages, 1000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="app">
      {!user ? <Login /> : (
        <div className="app__body">
          <Sidebar messages={messages} />
          <Chat messages={messages} />
        </div>
      )}
    </div>
  );
}

export default App;

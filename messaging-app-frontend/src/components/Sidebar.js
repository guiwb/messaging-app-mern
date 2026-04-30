import React, { useEffect, useState } from 'react'
import './Sidebar.css'
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import ChatIcon from '@mui/icons-material/Chat'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Avatar, IconButton } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SidebarChat from './SidebarChat'
import axios from 'axios'

const Sidebar = ({ messages }) => {
  const [activeUsers, setActiveUsers] = useState([])

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:9000/messages/actives")
        setActiveUsers(response.data)
      } catch (error) {
        console.error('Erro ao buscar usuários ativos:', error)
      }
    }
    fetchActiveUsers()
    const intervalId = setInterval(fetchActiveUsers, 5000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="sidebar">
      <div className="sidebar__header">
        <Avatar
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Instituto_Federal_Sul-riograndense_-_Marca_Vertical_2015.svg/1920px-Instituto_Federal_Sul-rio-grandense_-
_Marca_Vertical_2015.svg.png"/>
        <div className="sidebar__headerRight">
          <IconButton>
            <DonutLargeIcon />
          </IconButton>
          <IconButton>
            <ChatIcon />
          </IconButton>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </div>
      </div>
      <div className="sidebar__search">
        <div className="sidebar__searchContainer">
          <SearchOutlinedIcon />
          <input placeholder="Busque ou inicie um novo chat" type="text" />
        </div>
      </div>
      <div className="sidebar__chats">
        {activeUsers.map((activeUser) => {
          const userMessages = messages.filter((message) =>
            message.name === activeUser)
          const lastUserMessage = userMessages[userMessages.length -
            1]
          return (
            <SidebarChat
              key={activeUser}
              person={activeUser}
              messages={messages}
              lastTimestamp={lastUserMessage?.timestamp}
            />
          )
        })}
      </div>
    </div>
  )
}
export default Sidebar
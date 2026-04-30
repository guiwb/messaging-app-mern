import React, { useEffect, useState } from 'react'
import { Avatar } from '@mui/material';
import './SidebarChat.css'

const SidebarChat = () => {
  const [seed, setSeed] = useState("")
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 5000))
  }, [])
  return (
    <div className="sidebarChat">
      <Avatar src={`https://api.dicebear.com/9.x/toon-head/svg?flip=true&seed=${seed}`} />
      <div className="sidebarChat__info">
        <h2>Usuario</h2>
        <p>Última mensagem</p>
      </div>
    </div>
  )
}

export default SidebarChat
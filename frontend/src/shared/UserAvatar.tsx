// import { UserCircle } from "lucide-react"
// import { Bookmark, Users } from 'lucide-react'

import { Bookmark } from "lucide-react";


export default function UserAvatar({avatar, inputSize = 36, username} : {avatar : string | null | undefined , inputSize : number, username : string | undefined | null}){
  const base: React.CSSProperties = {
    width: inputSize, height: inputSize, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontSize: inputSize * 0.4, fontWeight: 600
  }
    
    if(!avatar){
      if(username === "Saved Messages"){
        return(
          <div style={{ ...base, background: 'var(--primary)', color: '#fff' }}>
            <Bookmark size={inputSize * 0.6} />
          </div>
        )
      }
      return(
        <div style={{ ...base, background: 'var(--primary)', color: '#fff' }}>
          {username?.charAt(0).toUpperCase()}
        </div>
      )
    }
    return <img src={avatar} style={{ ...base, objectFit: 'cover' }} alt="" />
}
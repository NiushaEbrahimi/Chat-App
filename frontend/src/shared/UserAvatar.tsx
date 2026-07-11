// import { UserCircle } from "lucide-react"
// import { Bookmark, Users } from 'lucide-react'


export default function UserAvatar({avatar, inputSize = 36, username} : {avatar : undefined | string , inputSize : number, username : string | undefined | null}){
  console.log("Avatar:", avatar);
  console.log("Username:", username);
  const base: React.CSSProperties = {
    width: inputSize, height: inputSize, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontSize: inputSize * 0.4, fontWeight: 600
  }
    
    if(!avatar){
      return(
        <div style={{ ...base, background: 'var(--primary)', color: '#fff' }}>
          {username?.charAt(0).toUpperCase()}
        </div>
      )
    }
    return <img src={avatar} style={{ ...base, objectFit: 'cover' }} alt="" />
}
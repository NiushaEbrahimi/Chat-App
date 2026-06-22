import { UserCircle } from "lucide-react"

export default function UserAvatar({avatar, inputSize = 36} : {avatar : null|string, inputSize : number}){
    if(!avatar){
        return <UserCircle size={inputSize}/>
    }
    return <p>{avatar}</p>
}
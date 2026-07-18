import * as Y from "yjs";
import {io} from "socket.io-client";
import { useEffect, useRef, useState } from "react";

const CURSOR_COLORS = ["#F87171", "#FBBF24", "#34D399", "#60A5FA", "#A78BFA", "#F472B6"];

function getColorForUser(id){
    let hash = 0;
    for(let i=0; i<id.length; i++){
        hash = id.charCodeAt(i) + ((hash<<5) - hash);
    }

    return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export default function useYjsProvider(docIdentifier, userInfo){
    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    const [hasSynced, setHasSynced] = useState(false);
    const ydocRef = useRef(null);
    const socketRef = useRef(null);

    if(!ydocRef.current){
        ydocRef.current = new Y.Doc();
    }

    useEffect(()=>{
        if(!docIdentifier) return;

        setConnectionStatus("syncing");

        const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8080", {
            withCredentials: true,
        });

        socketRef.current = socket;

        const ydoc = ydocRef.current;

        socket.on("connect", ()=>{
            socket.emit("join-document", docIdentifier);
        });

        socket.on("yjs-sync", (fullState)=>{
            Y.applyUpdate(ydoc, new Uint8Array(fullState), "remote");
            setConnectionStatus("connected");
            setHasSynced(true);
        });

        socket.on("yjs-update", (update)=>{
            Y.applyUpdate(ydoc, new Uint8Array(update), "remote");
        });

        socket.on("disconnect", ()=>{
            setConnectionStatus("disconnected");
        });

        const handleLocalUpdate = (update, origin)=>{
            if(origin === "remote") return;
            socket.emit("yjs-update", docIdentifier, update);
        };
        ydoc.on("update", handleLocalUpdate);

        return ()=>{
            ydoc.off("update", handleLocalUpdate);
            socket.disconnect();
            ydoc.destroy();
            ydocRef.current = null;
        };

    }, [docIdentifier]);

    return{
        ydoc: ydocRef.current,
        socket: socketRef.current,
        connectionStatus,
        hasSynced,
        cursorColor: userInfo? getColorForUser(userInfo.id): "#9CA3AF",
    };    
}
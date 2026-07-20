import * as Y from "yjs";
import {io} from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness.js";

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
    const [syncError, setSyncError] = useState("");
    const ydocRef = useRef(null);
    const socketRef = useRef(null);
    const undoManagerRef = useRef(null);
    const awarenessRef = useRef(null);

    if(!ydocRef.current){
        ydocRef.current = new Y.Doc();
    }

    if(!undoManagerRef.current){
        const xmlFragment = ydocRef.current.get("default", Y.XmlFragment);
        undoManagerRef.current = new Y.UndoManager(xmlFragment);
    }

    if(!awarenessRef.current){
        awarenessRef.current = new Awareness(ydocRef.current);
    }

    useEffect(()=>{
        if(!docIdentifier) return;

        setConnectionStatus("syncing");
        setHasSynced(false);

        const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8080", {
            withCredentials: true,
        });

        socketRef.current = socket;

        const ydoc = ydocRef.current;
        const awareness = awarenessRef.current;

        socket.on("connect", ()=>{

            socket.emit("join-document", docIdentifier, awareness.clientID);

            if(userInfo){
                awareness.setLocalStateField("user", {
                    name: userInfo.name,
                    color: getColorForUser(userInfo.id),
                });
            }
        });

        socket.on("yjs-sync", (fullState)=>{
            Y.applyUpdate(ydoc, new Uint8Array(fullState), "remote");
            setConnectionStatus("connected");
            setHasSynced(true);
        });

        socket.on("yjs-update", (update)=>{
            Y.applyUpdate(ydoc, new Uint8Array(update), "remote");
        });

        socket.on("awareness-update", (update)=>{
            applyAwarenessUpdate(awareness, new Uint8Array(update), "remote");
        });

        socket.on("error-message", (message) => {
            setSyncError(message);
        });

        socket.on("disconnect", (reason)=>{
            console.log("Disconnected:", socket.id, reason);
            setConnectionStatus("disconnected");
        });

        const handleLocalUpdate = (update, origin)=>{
            if(origin === "remote") return;
            socket.emit("yjs-update", docIdentifier, update);
        };
        ydoc.on("update", handleLocalUpdate);

        const handleAwarenessChange = ({added, updated, removed}, origin)=>{
            if(origin === "remote") return;
            
            const changedClients = added.concat(updated, removed);
            const update = encodeAwarenessUpdate(awareness, changedClients);

            socket.emit("awareness-update", docIdentifier, update);
        };
        awareness.on("update", handleAwarenessChange);

        return ()=>{
            awareness.setLocalState(null);
            ydoc.off("update", handleLocalUpdate);
            awareness.off("update", handleAwarenessChange);
            socket.disconnect();
            undoManagerRef.current.destroy();
            ydoc.destroy();
            ydocRef.current = null;
            undoManagerRef.current = null;
            awarenessRef.current = null;
        };

    }, [docIdentifier]);

    return{
        ydoc: ydocRef.current,
        socket: socketRef.current,
        awareness: awarenessRef.current,
        undoManager: undoManagerRef.current,
        connectionStatus,
        hasSynced,
        syncError,
        cursorColor: userInfo? getColorForUser(userInfo.id): "#9CA3AF",
    };    
}
import {Server} from "socket.io";
import * as Y from "yjs";
import {loadYjsState, saveYjsState} from "../utils/yjsPersistence.js"

const activeDocuments = new Map();
const SAVE_DEBOUNCE_MS = 2000;

export function setupCollaboration(httpServer) {

    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });

    io.on("connection", (socket)=>{

        console.log("Client connected id: ", socket.id);

        let currDocId = null

        socket.on("join-document", async(docId)=>{
            currDocId = docId;
            socket.join(docId);

            if(!activeDocuments.has(docId)){
                const ydoc = await loadYjsState(docId);
                activeDocuments.set(docId, {ydoc, saveTimeout: null});
                console.log(`Loaded document ${docId} into memory`);
            }

            const {ydoc} = activeDocuments.get(docId);

            const fullState = Y.encodeStateAsUpdate(ydoc);
            socket.emit("yjs-sync", fullState);

            console.log(`Socket ${socket.id} joined room ${docId}`);
        });

        socket.on("yjs-update", (docId, update)=>{
            const entry = activeDocuments.get(docId);
            if(!entry) return;

            Y.applyUpdate(entry.ydoc, new Uint8Array(update));

            socket.to(docId).emit("yjs-update", update);

            clearTimeout(entry.saveTimeout);
            entry.saveTimeout = setTimeout(async()=>{
                await saveYjsState(docId, entry.ydoc);
                console.log(`Persisted document ${docId} to MongoDB`);
            }, SAVE_DEBOUNCE_MS);
        });

        socket.on("awareness-update", (docId, update) => {
            socket.to(docId).emit("awareness-update", update);
        });
        
        socket.on("disconnect", async()=>{
            console.log("Client disconnected:", socket.id);

            if (!currDocId) return;

            const room = io.sockets.adapter.rooms.get(currDocId);
            const remainingClients = room? room.size : 0;

            if(remainingClients === 0){
                const entry = activeDocuments.get(currDocId);
                if(entry){
                    clearTimeout(entry.saveTimeout);
                    await saveYjsState(currDocId, entry.ydoc);
                    activeDocuments.delete(currDocId);
                    console.log(`Last client left ${currDocId}, saved and cleaned up`);
                }
            }
        });
    });

    return io;
}
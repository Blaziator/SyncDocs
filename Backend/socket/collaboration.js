import {Server} from "socket.io";
import * as Y from "yjs";
import {loadYjsState, saveYjsState} from "../utils/yjsPersistence.js"
import Document from "../models/document.js";
import {resolveEditPermission} from "../utils/permission.js";
import {attachUserToSocket} from "./socketAuth.js";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from "y-protocols/awareness.js";

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

        attachUserToSocket(socket);

        let currDocId = null

        socket.on("join-document", async(docId,awarenessClientId)=>{
            currDocId = docId;
            socket.awarenessClientId = awarenessClientId;
            socket.join(docId);

            const doc = await Document.findById(docId);
            if(!doc){
                socket.emit("error-messsage", "Document not found");
                return;
            }

            socket.canEdit = resolveEditPermission(doc, socket.userId);

            if(!activeDocuments.has(docId)){
                const ydoc = await loadYjsState(docId);
                const docAwareness = new Awareness(ydoc);

                docAwareness.on("update", ({added, updated, removed}, origin)=>{
                    if(origin !== "server") return;
                    const changedClients = added.concat(updated, removed);
                    const update = encodeAwarenessUpdate(docAwareness, changedClients);
                    io.to(docId).emit("awareness-update", update);
                });

                activeDocuments.set(docId, {ydoc, awareness: docAwareness, saveTimeout: null, dirty: false});
            }

            const {ydoc} = activeDocuments.get(docId);

            const fullState = Y.encodeStateAsUpdate(ydoc);
            socket.emit("yjs-sync", fullState);

        });

        socket.on("yjs-update", (docId, update)=>{

            if(docId !== currDocId || !socket.canEdit){
                return;
            }

            const entry = activeDocuments.get(docId);
            if(!entry) return;

            Y.applyUpdate(entry.ydoc, new Uint8Array(update));
            entry.dirty = true;
            socket.to(docId).emit("yjs-update", update);

            clearTimeout(entry.saveTimeout);
            entry.saveTimeout = setTimeout(async()=>{
                await saveYjsState(docId, entry.ydoc);
            }, SAVE_DEBOUNCE_MS);
        });

        socket.on("awareness-update", (docId, update) => {
            const entry = activeDocuments.get(docId);
            if (entry) {
                applyAwarenessUpdate(entry.awareness, new Uint8Array(update), "remote-client");
            }
            socket.to(docId).emit("awareness-update", update);
        });
        
        socket.on("disconnect", async()=>{

            if (!currDocId) return;

            const entry = activeDocuments.get(currDocId);

            if (entry && socket.awarenessClientId != null) {
                removeAwarenessStates(entry.awareness, [socket.awarenessClientId], "server");
            }

            const room = io.sockets.adapter.rooms.get(currDocId);
            const remainingClients = room? room.size : 0;

            if(remainingClients === 0 && entry){
            
                clearTimeout(entry.saveTimeout);
                if (entry.dirty) {
                    await saveYjsState(currDocId, entry.ydoc);
                }
                activeDocuments.delete(currDocId);            
            }
        });
    });

    return io;
}
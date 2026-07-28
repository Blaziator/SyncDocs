import {Server} from "socket.io";
import * as Y from "yjs";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from "y-protocols/awareness.js";
import {loadYjsState, saveYjsState} from "../utils/yjsPersistence.js"
import {resolveEditPermission} from "../utils/permission.js";
import {attachUserToSocket} from "./socketAuth.js";
import { publisher, subscriber, useRedis } from "../config/redis.js";
import Document from "../models/document.js";
import logger from "../utils/logger.js";

const activeDocuments = new Map();
const SAVE_DEBOUNCE_MS = 2000;

const yjsChannel = (docId)=> `yjs-update:${docId}`;
const awarenessChannel = (docId)=> `awareness-update:${docId}`;

export function setupCollaboration(httpServer) {

    const io = new Server(httpServer, {
        cors: {
            origin:process.env.CLIENT_URL,
            credentials: true
        }
    });

    const subscribedChannels = new Set();

    async function ensureSubscribed(docId) {
        if (!useRedis) return;

        const yjsCh = yjsChannel(docId);
        const awarenessCh = awarenessChannel(docId);

        if(!subscribedChannels.has(yjsCh)){
            await subscriber.subscribe(yjsCh);
            subscribedChannels.add(yjsCh);
        }

        if(!subscribedChannels.has(awarenessCh)){
            await subscriber.subscribe(awarenessCh);
            subscribedChannels.add(awarenessCh);
        }
    }

    async function unsubscribeDocument(docId) {
        const yjsCh = yjsChannel(docId);
        const awarenessCh = awarenessChannel(docId);

        if (subscribedChannels.has(yjsCh)) {
            await subscriber.unsubscribe(yjsCh);
            subscribedChannels.delete(yjsCh);
        }

        if (subscribedChannels.has(awarenessCh)) {
            await subscriber.unsubscribe(awarenessCh);
            subscribedChannels.delete(awarenessCh);
        }
    }

    if(useRedis){

        subscriber.on("message", (channel, message)=>{
            try{
                if(channel.startsWith("yjs-update:")){
                    const docId = channel.replace("yjs-update:", "");
                    const entry = activeDocuments.get(docId);
                    if(!entry) return;
                    
                    const update = Buffer.from(message, "base64");
        
                    Y.applyUpdate(entry.ydoc, new Uint8Array(update), "redis");
                    io.to(docId).emit("yjs-update", update);
                }else if(channel.startsWith("awareness-update:")){

                    const docId = channel.replace("awareness-update:", "");
                    const update = Buffer.from(message, "base64");
                    io.to(docId).emit("awareness-update", update);
                }
            }catch(err){
                logger.error({ event: "redis_message_error", channel, error: err.message });
            }
    
        });
    }

    io.on("connection", (socket)=>{

        attachUserToSocket(socket);

        logger.info({event: "socket_connected", socketId: socket.id, userId: socket.userId});

        let currDocId = null

        socket.on("join-document", async(docId,awarenessClientId)=>{
            try{
                currDocId = docId;
                socket.awarenessClientId = awarenessClientId;
                socket.join(docId);

                await ensureSubscribed(docId);
    
                const doc = await Document.findById(docId);
                if(!doc){
                    logger.warn({ event: "join_document_not_found", docId, socketId: socket.id });
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

                        if (useRedis){
                            publisher.publish(awarenessChannel(docId), Buffer.from(update).toString("base64"));
                        }
                    });
    
                    activeDocuments.set(docId, {ydoc, awareness: docAwareness, saveTimeout: null, dirty: false});
                }
    
                const {ydoc} = activeDocuments.get(docId);
                const fullState = Y.encodeStateAsUpdate(ydoc);
                socket.emit("yjs-sync", fullState);

                logger.info({ event: "joined_document", docId, socketId: socket.id, canEdit: socket.canEdit });

            }catch(err){
                logger.error({ event: "join_document_error", docId, socketId: socket.id, error: err.message });
                socket.emit("error-message", "Something went wrong while joining the document.");
            }

        });

        socket.on("yjs-update", async(docId, update)=>{
            try{

                if(docId !== currDocId || !socket.canEdit){
                    return;
                }
    
                const entry = activeDocuments.get(docId);
                if(!entry) return;
    
                Y.applyUpdate(entry.ydoc, new Uint8Array(update));
                entry.dirty = true;

                if (useRedis){
                    try{
                        await publisher.publish(yjsChannel(docId), Buffer.from(update).toString("base64"));
                    }catch(err){
                        logger.error({event: "redis_publish_failed", error: err.message,});
                    }
                }else{
                    socket.to(docId).emit("yjs-update", update);
                }
    
                clearTimeout(entry.saveTimeout);
                entry.saveTimeout = setTimeout(async()=>{
                    try{
                        if (entry.dirty) {
                            await saveYjsState(docId, entry.ydoc);
                            entry.dirty = false;
                            logger.info({ event: "document_persisted", docId });
                        }

                    }catch(err){
                        logger.error({ event: "persist_failed", docId, error: err.message });
                    }
                }, SAVE_DEBOUNCE_MS);
            }catch(err){
                logger.error({ event: "yjs_update_error", docId, socketId: socket.id, error: err.message });
            }
        });

        socket.on("awareness-update", async(docId, update) => {
            try{
                const entry = activeDocuments.get(docId);
                if (entry) {
                    applyAwarenessUpdate(entry.awareness, new Uint8Array(update), "remote-client");
                }
                
                if (useRedis){
                    try{
                        await publisher.publish(awarenessChannel(docId), Buffer.from(update).toString("base64"));
                    }catch(err){
                        logger.error({event: "redis_publish_failed", error: err.message,});
                    }
                }else{
                    socket.to(docId).emit("awareness-update", update);
                }

            }catch(err){
                logger.error({ event: "awareness_update_error", docId, socketId: socket.id, error: err.message });
            }
        });
        
        socket.on("disconnect", async()=>{
            logger.info({ event: "socket_disconnected", socketId: socket.id });

            try{
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

                    if (useRedis) {
                        await unsubscribeDocument(currDocId);
                    }

                    logger.info({ event: "document_unloaded", docId: currDocId });    
                }        
            }catch(err){
                logger.error({ event: "disconnect_cleanup_error", docId: currDocId, socketId: socket.id, error: err.message });
            }
        });
    });

    return io;
}
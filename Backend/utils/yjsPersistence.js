import * as Y from "yjs";
import Document from "../models/document.js";

export async function loadYjsState(docId){
    const doc = await Document.findById(docId);
    const ydoc = new Y.Doc();

    if(doc && doc.content){
        Y.applyUpdate(ydoc, new Uint8Array(doc.content));
    }

    return ydoc;
}

export async function saveYjsState(docId, ydoc){
    const update = Y.encodeStateAsUpdate(ydoc);
    const buffer = Buffer.from(update);
    await Document.findByIdAndUpdate(docId, {content: buffer});
}
import {useEditor, EditorContent} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-caret";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import {TextStyle} from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import axiosInstance from "../../api/axiosInstance.js";
import {useNavigate, useParams} from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import EditorToolbar from "../../components/EditorToolbar/EditorToolbar.jsx";
import EditorHeader from "../../components/EditorHeader/EditorHeader.jsx";
import useYjsProvider from "../../hooks/useYjsProvider.js";
import styles from "./Editor.module.css";

function getGuestName(){
  let name = sessionStorage.getItem("guestName");
  if(!name){
    name = `Guest${Math.floor(Math.random()*1000)}`;
    sessionStorage.setItem("guestName", name);
  }
  return name;
}

export default function Editor() {

  const navigate = useNavigate();
  const {docId, shareId } = useParams();
  const {user, loading: authLoading} = useAuth();

  const [doc, setDoc] = useState({});
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(true);
  const [docLoaded, setDocLoaded] = useState(false);

  useEffect(()=>{
    if(authLoading) return;

    const getDocMeta = async()=>{
      try{

        const endPoint = docId ? `/documents/${docId}`: `/documents/shared/${shareId}`;
        const response = await axiosInstance.get(endPoint);
        const fetchedDoc = response.data.doc;
        setDoc(fetchedDoc);
        
        if(shareId){
          const isOwner = user && fetchedDoc.owner === user.id;
          const collabRecord = user? fetchedDoc.collaborators.find((c)=> c.user === user.id): null;

          if(isOwner){
            setCanEdit(true);
          }else if(collabRecord){
            setCanEdit(collabRecord.permission === "edit");
          }else{
            setCanEdit(fetchedDoc.sharePermission === "edit");
          }
        }else{
          setCanEdit(true);
        }

        setDocLoaded(true);

      }catch(err){
        const status = err.response?.status;
        if (status === 403) navigate("/access-denied");
        else if (status === 404) navigate("/not-found");
        else setError(err.response?.data?.message || "Something went wrong. Try again");
      }
    };

    getDocMeta();

  }, [docId, shareId, navigate, user, authLoading]);

  const syncId = doc._id || null;

  const userInfo = useMemo(()=>{
    if(user) return {id: user.id, name: user.name};
    return {id: sessionStorage.getItem("guestName") || getGuestName(), name: getGuestName()};
  }, [user]);

  const {ydoc, awareness, undoManager, connectionStatus, hasSynced, syncError, cursorColor} = useYjsProvider(
    docLoaded? syncId: null,
    userInfo
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        undoRedo: false,
      }),

      Placeholder.configure({
        placeholder: "Start typing...",
      }),
  
      Heading.configure({
        levels: [1,2,3,4,5,6]
      }),

      Highlight.configure({
        multicolor: true
      }),

      TextStyle,
      Color,
      FontFamily,

      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),

      Collaboration.configure({
        document: ydoc,
        undoManager: undoManager,
      }),

      CollaborationCursor.configure({
        provider: {awareness},
        user: {name: userInfo.name, color: cursorColor}
      })
  ],
    editable: canEdit,
  }, [ydoc]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [canEdit, editor]);

  return (
    <div className={styles.editorPage}>

      <div className={styles.topBar}>
        <EditorHeader doc={doc} connectionStatus={connectionStatus}/>
        <EditorToolbar editor={editor}/>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {syncError && <p className={styles.error}>{syncError}</p>}

      {!canEdit && (
        <p className={styles.viewOnlyBanner}>
            You're viewing this document in read-only mode.
        </p>
      )}  
      
      {hasSynced ? (
      <EditorContent editor={editor} className={styles.contentDiv}/>
      ): (
        <p className={styles.statusText}>Loading document...</p>
      )}
    </div>
  )
}
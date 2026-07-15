import {useEditor, EditorContent} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import axiosInstance from "../../api/axiosInstance.js";
import {useNavigate, useParams} from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {Bold, Italic, Strikethrough, List, Undo2, Redo2} from "lucide-react";
import EditorToolbar from "../../components/EditorToolbar/EditorToolbar.jsx";
import EditorHeader from "../../components/EditorHeader/EditorHeader.jsx";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import {TextStyle} from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import styles from "./Editor.module.css";

export default function Editor() {

  const navigate = useNavigate();
  const {docId, shareId } = useParams();
  const {user} = useAuth();

  const [doc, setDoc] = useState({});
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
  
      Heading.configure({
        levels: [1,2,3,4,5,6]
      }),

      // Underline,

      Highlight.configure({
        multicolor: true
      }),

      TextStyle,
      Color,
      FontFamily,

      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),

  ],
    content,
    editable: canEdit,
  });


  useEffect(()=>{

  const getDocContent = async()=>{

    try{

      const endPoint = docId ? `/documents/${docId}`: `/documents/shared/${shareId}`;
      const response = await axiosInstance.get(endPoint);
      const doc = response.data.existingDoc;  
      setDoc(doc);
      setContent(doc.content || "Hello user, start typing now...");

      if(shareId){
        const isOwner = user && fetchedDoc.owner === user.id;
        const collabRecord = user? fetchedDoc.collaborators.find((c) => c.user === user.id): null;

        if (isOwner) {
          setCanEdit(true);
        } else if (collabRecord) {
          setCanEdit(collabRecord.permission === "edit");
        } else {
          setCanEdit(fetchedDoc.sharePermission === "edit");
        }
      }else{
        setCanEdit(true);
      }

    }catch(err){
      console.log(err);
      const status = err.response?.status;

      if (status === 403) {
        navigate("/access-denied");
      } else if (status === 404) {
          navigate("/not-found");
      } else { 
        setError(err.response?.data?.message || "Something went wrong. Try again");
      }
    }
  }

  getDocContent();

  }, [docId, shareId, navigate]);

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
    }, [canEdit, editor]);

  return (
    <div className={styles.editorPage}>

      <div className={styles.topBar}>
        <EditorHeader doc={doc}/>
        <EditorToolbar editor={editor}/>
      </div>


      {error && <p className={styles.error}>{error}</p>}

      {!canEdit && (
        <p className={styles.viewOnlyBanner}>
            You're viewing this document in read-only mode.
        </p>
      )}  
      
      <EditorContent editor={editor} className={styles.contentDiv}/>
    </div>
  )
}
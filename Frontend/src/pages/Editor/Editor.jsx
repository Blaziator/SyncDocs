import {useEditor, EditorContent} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import axiosInstance from "../../api/axiosInstance.js";
import {useNavigate, useParams} from "react-router-dom";
import { useEffect, useState } from "react";
import {Bold, Italic, Strikethrough, List, Undo2, Redo2} from "lucide-react";
import EditorToolbar from "../../components/EditorToolbar/EditorToolbar.jsx";
import EditorHeader from "../../components/EditorHeader/EditorHeader.jsx";
import Heading from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import {TextStyle} from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import styles from "./Editor.module.css";

export default function Editor() {

  const navigate = useNavigate();

  const {docId} = useParams();
  const [doc, setDoc] = useState({});
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
  
      Heading.configure({
        levels: [1,2,3,4,5,6]
      }),

      Underline,

      Highlight.configure({
        multicolor: true
      }),

      TextStyle,
      Color,
      FontFamily,

      TextAlign.configure({
        types: ["heading", "paragraph"]
      })

  ],
    content,
  });

  useEffect(()=>{

  const getDocContent = async()=>{

    try{

      const response = await axiosInstance.get(`/documents/${docId}`);
      const doc = response.data.existingDoc;  
      setDoc(doc);
      setContent(doc.content || "Hello user, start typing now...");

    }catch(err){
      const status = err.response?.status;
      console.log(status);

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

  }, [docId, navigate]);

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className={styles.editorPage}>

      <div className={styles.topBar}>
        <EditorHeader doc={doc}/>
        <EditorToolbar editor={editor}/>
      </div>


      {error && <p className={styles.error}>{error}</p>}
      
      <EditorContent editor={editor} className={styles.contentDiv}/>
    </div>
  )
}
import { Bold, Italic, Strikethrough, List, Undo2, Redo2, Underline, Highlighter, AlignLeft, AlignCenter, AlignRight, AlignJustify,} from "lucide-react";
import { useEditorState } from "@tiptap/react";
import Tooltip from "../Tooltip/Tooltip";
import styles from "./EditorToolbar.module.css";

export default function EditorToolbar({editor}) {

    if(!editor) return null;

    const editorState = useEditorState({
        editor,
        selector: ({ editor }) => ({
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            strike: editor.isActive("strike"),
            bulletList: editor.isActive("bulletList"),
            underline: editor.isActive("underline"),
            highlight: editor.isActive("highlight"),
            alignLeft: editor.isActive({textAlign: "left"}),
            alignCenter: editor.isActive({ textAlign: "center" }),
            alignRight: editor.isActive({ textAlign: "right" }),
            alignJustify: editor.isActive({ textAlign: "justify" }),
            headingLevel: [1, 2, 3, 4, 5, 6].find((level) =>
                editor.isActive("heading", { level })
            ) || 0,
        }),
    });

  return (
    <div className={styles.toolbar}>

        <Tooltip label="Undo (Ctrl+Z)">
            <button 
                onClick={()=> editor.chain().focus().undo().run()} 
                className={styles.toolbarBtn}
            >
                <Undo2 size={18}/>
            </button>
        </Tooltip>

        <Tooltip label="Redo (Ctrl+Y)">
            <button 
                onClick={()=> editor.chain().focus().redo().run()} 
                className={styles.toolbarBtn}
            >
                <Redo2 size={18}/>
            </button>
        </Tooltip>

        <div className={styles.divider} />

        <Tooltip label="Styles">
            <select
                value={editorState.headingLevel}
                onChange={(e)=>{
                    const value = Number(e.target.value);

                    if(value == 0){
                        editor.chain().focus().setParagraph().run();
                    }else{
                        editor.chain().focus().toggleHeading({ level: value }).run();
                    }
                }}
                className={styles.toolbarSelect}
            >
                <option value={0}>Normal text</option>
                <option value={1}>Heading 1</option>
                <option value={2}>Heading 2</option>
                <option value={3}>Heading 3</option>
                <option value={4}>Heading 4</option>
                <option value={5}>Heading 5</option>
                <option value={6}>Heading 6</option>
            </select>
        </Tooltip>

        <div className={styles.divider} />

        <Tooltip label="Bold (Ctrl+B)">
            <button 
                onClick={()=> editor.chain().focus().toggleBold().run()} 
                className={`${styles.toolbarBtn} ${editorState.bold? styles.active: ""}`}
            >
                <Bold size={18}/>
            </button>
        </Tooltip>

        <Tooltip label="Italic (Ctrl+I)">
            <button 
                onClick={()=> editor.chain().focus().toggleItalic().run()} 
                className={`${styles.toolbarBtn} ${editorState.italic? styles.active: ""}`}
            >
                <Italic size={18}/>
            </button>
        </Tooltip>

        <Tooltip label="Underline (Ctrl+U)">
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`${styles.toolbarBtn} ${editorState.underline ? styles.active : ""}`}
            >
                <Underline size={18}/>
            </button>
        </Tooltip>

        <Tooltip label="Strikethrough (Ctrl+Shift+S)">
            <button 
                onClick={()=> editor.chain().focus().toggleStrike().run()} 
                className={`${styles.toolbarBtn} ${editorState.strike? styles.active: ""}`}
            >
                <Strikethrough size={18}/>
            </button>
        </Tooltip>

        <div className={styles.divider} />

        <Tooltip label="Fonts">
            <select
                onChange={(e) =>
                    editor.chain().focus().setFontFamily(e.target.value).run()
                }
                className = {styles.toolbarSelect}
            >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Verdana">Verdana</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Garamond">Garamond</option>
                <option value="Palatino">Palatino</option>
                <option value="Courier New">Courier New</option>
                <option value="Lucida Console">Lucida Console</option>
                <option value="Monaco">Monaco</option>

            </select>
        </Tooltip>


        <div className={styles.divider} />

        <Tooltip label="Text color">
            <input
                type="color"
                onChange={(e) =>
                    editor.chain().focus().setColor(e.target.value).run()
                }
                className={styles.colorPicker}
            />
        </Tooltip>

        <div className={styles.divider} />

        <Tooltip label="Bullet List (Ctrl+Shift+B)">
            <button 
                onClick={()=> editor.chain().focus().toggleBulletList().run()} 
                className={`${styles.toolbarBtn} ${editorState.bulletList? styles.active: ""}`}
            >
                <List size={18}/>
            </button>      
        </Tooltip>

        <Tooltip label="Highlight with yellow color">
            <button
                onClick={() => editor.chain().focus().toggleHighlight({ color: "#FFFF00" }).run()}
                className={`${styles.toolbarBtn} ${editorState.highlight? styles.highlightActive: ""}`}
            >
                <Highlighter/>
            </button>
        </Tooltip>

        <div className={styles.divider} />

        <Tooltip label="Left align (Ctrl+Shift+L)">
            <button 
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                className={`${styles.toolbarBtn} ${editorState.alignLeft? styles.active: ""}`}
            >
                <AlignLeft size={18}/>
            </button>
        </Tooltip>
        <Tooltip label="Center align (Ctrl+Shift+E)">
            <button 
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                className={`${styles.toolbarBtn} ${editorState.alignCenter? styles.active: ""}`}
            >
                <AlignCenter size={18}/>
            </button>
        </Tooltip>
        <Tooltip label="Right align (Ctrl+Shift+R)">
            <button 
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                className={`${styles.toolbarBtn} ${editorState.alignRight? styles.active: ""}`}
            >
                <AlignRight size={18}/>
            </button>
        </Tooltip>
        <Tooltip label="Justify (Ctrl+Shift+J)">
            <button 
                onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                className={`${styles.toolbarBtn} ${editorState.alignJustify? styles.active: ""}`}
            >
                <AlignJustify size={18}/>
            </button>
        </Tooltip>        

    </div>
  )
}

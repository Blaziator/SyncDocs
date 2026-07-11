import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance.js";
import DocumentRow from "../../components/DocumentRow/DocumentRow.jsx";
import Header from "../../components/Header/Header.jsx";
import styles from "./Dashboard.module.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { Plus } from "lucide-react";
import NameDocumentModal from "../../components/NameDocumentModal/NameDocumentModal.jsx";

export default function Dashboard() {

  const {user} = useAuth();
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({
    isOpen: false, mode: null, docId: null, initialValue: ""
  });

  useEffect(()=>{

    async function fetchDocs(){
      setLoading(true);

      try{
        const response = await axiosInstance.get("/documents/dashboard");
        setDocs(response.data.allDoc);
  
      }catch(err){
        setError(err.response?.data?.message || "Something Went Wrong. Try again");

      }finally{
        setLoading(false);
      }
    }

    fetchDocs();

  }, []);

  const hour = new Date().getHours();
  let greetingMsg = "Hello";

  if(hour < 12){
      greetingMsg = "Good Morning";
  }
  else if(hour < 18){
      greetingMsg = "Good Afternoon";
  }
  else{
      greetingMsg = "Good Evening";
  }

  const handleCreateClick = () => {
    setModalState({ isOpen: true, mode: "create", docId: null, initialValue: "Untitled Document" });
};

const handleRenameClick = (doc) => {
    setModalState({ isOpen: true, mode: "rename", docId: doc._id, initialValue: doc.title });
};

const handleModalCancel = () => {
    setModalState({ isOpen: false, mode: null, docId: null, initialValue: "" });
};

const handleModalConfirm = async (title) => {
    const { mode, docId } = modalState;
    setModalState({ isOpen: false, mode: null, docId: null, initialValue: "" });

    try {
        if (mode === "create") {
            const response = await axiosInstance.post("/documents/create", { title });
            navigate(`/doc/${response.data.doc._id}`);
        } else if (mode === "rename") {
            const response = await axiosInstance.patch(`/documents/${docId}`, { title });
            setDocs((prev) => prev.map((d) => (d._id === docId ? response.data.doc : d)));
        }
    } catch (err) {
        setError(err.response?.data?.message || "Something went wrong.");
    }
};

  const handleDelete = async(docId)=>{
    try{

      await axiosInstance.delete(`/documents/${docId}`);
      setDocs((prev)=> prev.filter((doc) => doc._id !== docId));

    }catch(err){
      setError(err.response?.data?.message || "Failed to delete document.");
    }
  };

  const filteredDocs = docs.filter((doc)=> doc.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (

    <div className={styles.dashboardPage}>      
      <Header searchQuery = {searchQuery} setSearchQuery = {setSearchQuery}/>

    <div className={styles.greeting}>

      <h1>{greetingMsg}, {user.name} 👋</h1>
      <p>{docs.length === 0? "Ready to create your first document?":"Everything is synced and ready."}</p>

    </div>

      <div className={styles.content}>
        <div className={styles.toolbar}>
          
          <h2>All Documents</h2>
          <button className={styles.createBtn} onClick={handleCreateClick}> <Plus size={18}/> New Document</button>

        </div>

        {error && <p className={styles.error}>{error}</p>}

        {loading? (
          <p className={styles.statusText}>Loading your documents...</p>
        ): docs.length === 0 ? (
          <p className={styles.statusText}>You have no documents yet. Click "New Document" to get started.</p>
        ): filteredDocs.length === 0 ? (
          <p className={styles.statusText}>No documents match your search.</p>
        ): (
          <div className={styles.list}>
            {filteredDocs.map((doc)=> (
              <DocumentRow key={doc._id} doc={doc} onDelete={handleDelete} onRename={handleRenameClick}/>
            ))}
          </div>
        )}

      </div>
      <NameDocumentModal
        isOpen={modalState.isOpen}
        initialValue={modalState.initialValue}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import styles from "./ShareModal.module.css";
import axiosInstance from "../../api/axiosInstance";
import { Link2, Check } from "lucide-react";

export default function ShareModal({isOpen, docId, onClose}) {
  
    const [shareId, setShareId] = useState("");
    const [permission, setPermission] = useState("view");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    useEffect(()=>{
        if(!isOpen) return;

        const fetchShareLink = async()=>{
            setLoading(true);
            setError("");

            try{
            
                const response = await axiosInstance.post(`/documents/${docId}/share`);
                setShareId(response.data.shareId);
                setPermission(response.data.sharePermission);

            }catch(err){
                setError(err.response?.data?.message || "Failed to generate share link.");
            }finally{
                setLoading(false);
            }
        };

        fetchShareLink();

    }, [isOpen, docId]);

    if(!isOpen) return null;

    const shareUrl = `${window.location.origin}/shared/${shareId}`;

    const handlePermissionChange = async(e)=>{
        const newPermission = e.target.value;
        setPermission(newPermission);

        try{
            await axiosInstance.patch(`/documents/${docId}/share-permission`, {
                permission: newPermission,
            });

        }catch(err){
            setError(err.response?.data?.message || "Failed to update permission.");
        }
    };

    const handleCopy = async()=>{
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(()=> setCopied(false), 2000);
    };
  
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e)=> e.stopPropagation()}>
                <h3 className={styles.title}>Share this document</h3>

                {error && <p className={styles.error}>{error}</p>}

                {loading? (
                    <p className={styles.loadingText}>Generating link...</p>
                ): (
                    <>
                        <div className={styles.linkRow}>
                            <Link2 size={16} className={styles.linkIcon}/>
                            <input className={styles.linkInput} type="text" value={shareUrl} readOnly/>
                        </div>

                        <div className={styles.controls}>
                            <select
                                className={styles.permissionSelect}
                                value={permission}
                                onChange={handlePermissionChange}
                            >
                                <option value="view">Viewer</option>
                                <option value="edit">Editor</option>
                            </select>

                            <button className={styles.copyBtn} onClick={handleCopy}>
                                {copied ? <Check size={16} /> : <Link2 size={16} />}
                                {copied ? "Copied!" : "Copy link"}
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    )
}

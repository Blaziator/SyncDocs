export function resolveEditPermission(doc, userId){

    const isOwner = doc.owner && userId && doc.owner.toString() === userId;
    if(isOwner) return true;

    const collabRecord = userId
        ? doc.collaborators.find((c) => c.user.toString() === userId)
        : null;
    if(collabRecord) return collabRecord.permission === "edit";

    return doc.sharePermission === "edit";
}
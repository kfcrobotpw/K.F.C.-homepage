import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, query, orderBy, onSnapshot, doc, deleteDoc, setDoc, serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Resource } from '../types';
import { 
  FileText, Link as LinkIcon, FolderOpen, Search, Plus, Trash2, X, Download, FileCode, Video, HelpCircle, HardDrive
} from 'lucide-react';

interface ResourceShareProps {
  currentUser: { uid: string; email: string; displayName: string; photoURL: string };
  isOfficer: boolean;
  canManageResource?: boolean;
}

export default function ResourceShare({ currentUser, isOfficer, canManageResource = isOfficer }: ResourceShareProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shareType, setShareType] = useState<'link' | 'file'>('link');
  const [linkUrl, setLinkUrl] = useState('');
  
  // Simulated file states
  const [simulatedFile, setSimulatedFile] = useState<{ name: string; size: string; type: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Resource[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Resource);
      });
      setResources(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'resources');
    });

    return () => unsubscribe();
  }, []);

  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      let fileCat = 'document';
      if (file.name.endsWith('.zip') || file.name.endsWith('.rar')) fileCat = 'zip';
      else if (file.name.endsWith('.py') || file.name.endsWith('.cpp') || file.name.endsWith('.ts') || file.name.endsWith('.json')) fileCat = 'code';
      else if (file.name.endsWith('.mp4') || file.name.endsWith('.mov')) fileCat = 'video';

      setSimulatedFile({
        name: file.name,
        size: `${sizeMB} MB`,
        type: fileCat,
      });
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      const resourceCol = collection(db, 'resources');
      const docRef = doc(resourceCol); // Generate specific doc ID for rules checks

      const payload: any = {
        id: docRef.id,
        title: title.trim(),
        description: description.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorPhoto: currentUser.photoURL,
        createdAt: serverTimestamp(),
      };

      if (shareType === 'link') {
        if (!linkUrl.trim()) return;
        let formattedLink = linkUrl.trim();
        if (!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) {
          formattedLink = `https://${formattedLink}`;
        }
        payload.link = formattedLink;
        payload.fileType = 'link';
      } else if (shareType === 'file' && simulatedFile) {
        payload.fileName = simulatedFile.name;
        payload.fileType = simulatedFile.type;
        // In physical builds without storage bucket setup, we simulate a secure file object container
        payload.fileUrl = `https://example.com/mockfiles/${simulatedFile.name}`; 
      } else {
        alert('링크 또는 파일을 업로드해 주세요.');
        return;
      }

      await setDoc(docRef, payload);

      // Clean state
      setTitle('');
      setDescription('');
      setLinkUrl('');
      setSimulatedFile(null);
      setShareType('link');
      setShowAddModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'resources');
    }
  };

  const handleDeleteResource = async (id: string, authorId: string) => {
    if (currentUser.uid !== authorId && !canManageResource) {
      alert('작성자 및 관리자만 삭제할 수 있습니다.');
      return;
    }

    if (!confirm('정말로 이 자료 공유 글을 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'resources', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `resources/${id}`);
    }
  };

  const getIconForType = (type: string | undefined) => {
    if (!type) return <HelpCircle className="w-5 h-5 text-slate-400" />;
    switch (type) {
      case 'link':
        return <LinkIcon className="w-5 h-5 text-sky-400" />;
      case 'zip':
        return <FolderOpen className="w-5 h-5 text-amber-400" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-emerald-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-rose-400" />;
      default:
        return <FileText className="w-5 h-5 text-teal-400" />;
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredResources = resources.filter(res => {
    const titleVal = res.title || '';
    const descVal = res.description || '';
    const authorVal = res.authorName || '';
    return (
      titleVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      descVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      authorVal.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6" id="resource-share-container">
      {/* Header and Search row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📂 자료 공유</span>
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-medium">Resources</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">로봇 제작 매뉴얼, 설계 코드, 영상, 유용한 자료 링크를 단원들과 나누어 주세요.</p>
        </div>

        <button
          id="add-resource-btn"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-blue-500/10 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>자료 등록하기</span>
        </button>
      </div>

      {/* Search Input bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          id="resource-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="자료 제목, 설명, 올린 사람으로 찾아보세요..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#121216] border border-slate-800 rounded-xl text-slate-300 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm font-mono">로딩 중...</div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-[#121216] border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-sm">
          등록된 자료가 없거나 검색 조건에 부합하는 항목이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="resource-grid">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              id={`resource-item-${res.id}`}
              className="bg-[#121216] border border-slate-805 rounded-xl p-5 hover:border-slate-700 transition duration-150 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2 bg-[#0A0A0C] border border-slate-800 rounded-lg">
                    {getIconForType(res.fileType)}
                  </div>

                  {(res.authorId === currentUser.uid || canManageResource) && (
                    <button
                      id={`delete-resource-${res.id}`}
                      onClick={() => handleDeleteResource(res.id, res.authorId)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition cursor-pointer"
                      title="자료 삭제"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-white text-base tracking-tight mb-1.5 line-clamp-1">{res.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[40px] line-clamp-3 mb-4">{res.description}</p>
              </div>

              {/* Card Footer detail */}
              <div className="border-t border-slate-800/60 pt-3.5 mt-2">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={res.authorPhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"} 
                      alt={res.authorName || "단원"} 
                      className="w-5 h-5 rounded-full object-cover border border-slate-800"
                    />
                    <span className="text-xs text-slate-400 font-medium truncate max-w-[80px]">{res.authorName || "익명 단원"}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{formatTimestamp(res.createdAt)}</span>
                </div>

                {/* Navigation/Action call to shared media */}
                {res.link ? (
                  <a
                    id={`open-link-btn-${res.id}`}
                    href={res.link}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/20 flex items-center justify-center gap-1.5 transition text-center"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>자료 링크 이동</span>
                  </a>
                ) : res.fileUrl ? (
                  <div className="flex flex-col gap-1">
                    <div className="px-2 py-1 bg-[#0A0A0C] border border-slate-800 rounded text-[10px] text-slate-400 font-mono flex items-center justify-between overflow-hidden">
                      <span className="truncate max-w-[124px]">{res.fileName}</span>
                      <span className="shrink-0 text-[10px] text-blue-400 font-semibold font-sans">첨부파일</span>
                    </div>
                    <button
                      id={`download-file-btn-${res.id}`}
                      onClick={() => {
                        const blob = new Blob(["K.F.C. Robot Club Resource: " + res.title + "\n" + res.description], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = res.fileName || "resource.txt";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/20 flex items-center justify-center gap-1.5 transition text-center cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>자료 파일 다운로드</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD RESOURCE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" id="add-resource-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121216] border border-slate-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <HardDrive className="w-5 h-5 text-blue-500" />
                  <span>공유 자료물 업로드</span>
                </h3>
                <button
                  id="close-add-modal"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddResource} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">자료 이름</label>
                  <input
                    id="resource-title-input-field"
                    type="text"
                    required
                    maxLength={100}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 3D 프린팅 메카넘 휠 세부 도면"
                    className="w-full px-3.5 py-2 bg-[#0A0A0C] border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">설명 및 참고사항</label>
                  <textarea
                    id="resource-desc-input-field"
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="자료에 대한 간략한 특징이나 버전을 명시해 주세요..."
                    className="w-full px-3.5 py-2 bg-[#0A0A0C] border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>

                {/* Share Type toggler */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">공유 방식 선택</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#0A0A0C] p-1 border border-slate-800 rounded-lg">
                    <button
                      id="opt-link-btn"
                      type="button"
                      onClick={() => setShareType('link')}
                      className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                        shareType === 'link' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      웹 주소/링크 공유
                    </button>
                    <button
                      id="opt-file-btn"
                      type="button"
                      onClick={() => setShareType('file')}
                      className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                        shareType === 'file' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      첨부파일 직접 등록
                    </button>
                  </div>
                </div>

                {shareType === 'link' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">참조 링크 (URL)</label>
                    <input
                      id="resource-link-input-field"
                      type="text"
                      required={shareType === 'link'}
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://github.com/your-robot-repo"
                      className="w-full px-3.5 py-2 bg-[#0A0A0C] border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">파일 선택</label>
                    <div className="border-2 border-dashed border-slate-800 hover:border-slate-750 hover:bg-[#0A0A0C]/40 rounded-xl p-5 text-center transition relative overflow-hidden">
                      <input
                        id="resource-file-upload-input"
                        type="file"
                        onChange={handleSimulatedFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FolderOpen className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">클릭하여 파일을 선택하세요</p>
                      <p className="text-[10px] text-slate-500 mt-1">PDF, CAD파일, ZIP, mp4 등</p>
                    </div>

                    {simulatedFile && (
                      <div className="mt-3 p-2 bg-[#0A0A0C] border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
                        <span className="text-emerald-450 truncate max-w-[200px]">{simulatedFile.name} ({simulatedFile.size})</span>
                        <button
                          id="clear-simulated-file"
                          type="button"
                          onClick={() => setSimulatedFile(null)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    id="cancel-add-resource"
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 bg-[#0A0A0C] hover:bg-slate-900/50 border border-slate-800 rounded-lg transition"
                  >
                    취소
                  </button>
                  <button
                    id="submit-add-resource"
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer"
                  >
                    자료 올리기
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

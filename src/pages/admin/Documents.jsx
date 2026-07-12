import { useState, useEffect } from 'react';
import { Trash2, ExternalLink, FileText, Cloud } from 'lucide-react';
import { getDocuments, createDocuments, deleteDocument } from '../../services/api';
import { pickDriveDocumentLinks, isGoogleDriveConfigured } from '../../lib/googleDrivePicker';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return 'Hari ini';
  if (days === 1) return 'Kemarin';
  return `${days} hari lalu`;
}

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    const { data } = await getDocuments();
    if (data) setDocuments(data);
    setLoading(false);
  }

  const handleAddFromDrive = async () => {
    setIsImporting(true);
    try {
      const picked = await pickDriveDocumentLinks({ multiple: true });
      if (picked.length > 0) {
        const { error } = await createDocuments(picked);
        if (error) throw error;
        fetchDocuments();
      }
    } catch (err) {
      alert('Gagal menambah dokumen dari Google Drive: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus bookmark dokumen ini? (File aslinya di Google Drive tidak akan terhapus)')) return;
    const { error } = await deleteDocument(id);
    if (error) alert('Gagal menghapus: ' + error.message);
    else setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-heading text-gray-900 leading-tight">Dokumen</h2>
          <p className="mt-1 text-gray-500">Akses cepat ke laporan keuangan, riset, dan dokumen kerja dari Google Drive.</p>
        </div>
        <button
          onClick={handleAddFromDrive}
          disabled={isImporting || !isGoogleDriveConfigured}
          title={!isGoogleDriveConfigured ? 'Google Drive belum dikonfigurasi' : undefined}
          className="gradient-primary text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <Cloud className="w-4 h-4" />
          {isImporting ? 'Membuka Drive...' : 'Tambah dari Drive'}
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-premium border border-gray-50 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-400 font-medium text-sm">Memuat dokumen...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-20 text-center px-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-400 font-medium text-sm italic">
              Belum ada dokumen. Klik &ldquo;Tambah dari Drive&rdquo; untuk bookmark laporan atau file penting.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 px-8 py-5 hover:bg-gray-50/50 transition-colors group">
                <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {doc.icon_url ? (
                    <img src={doc.icon_url} alt="" className="w-6 h-6 object-contain" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 flex items-center gap-2 group/link"
                >
                  <span className="text-sm font-bold text-gray-900 truncate group-hover/link:text-primary transition-colors">
                    {doc.title}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 group-hover/link:text-primary transition-colors" />
                </a>
                <span className="text-[11px] text-gray-300 font-medium flex-shrink-0 hidden sm:block">
                  {timeAgo(doc.created_at)}
                </span>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 rounded-xl text-gray-300 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Hapus bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

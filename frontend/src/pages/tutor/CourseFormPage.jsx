import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { tutorApi, authApi } from '../../api';
import { Plus, Trash2, X, Image, ChevronDown, ChevronRight } from 'lucide-react';
import SortableItem from '../../components/SortableItem';
import { reorderArray } from '../../utils/reorder';

const emptySubMaterial = () => ({ title: '', description: '', video_url: '' });
const emptyMaterial = () => ({
  title: '',
  description: '',
  video_url: '',
  sub_materials: [emptySubMaterial()],
});

const emptyCourse = {
  title: '',
  intro_video_url: '',
  information: '',
  price: 0,
  thumbnail_url: '',
  materials: [emptyMaterial()],
};

const mapMaterial = (m) => ({
  title: m.title || '',
  description: m.description || '',
  video_url: m.video_url || '',
  sub_materials: m.sub_materials?.length
    ? m.sub_materials.map((s) => ({
        title: s.title || '',
        description: s.description || '',
        video_url: s.video_url || '',
      }))
    : [emptySubMaterial()],
});

export default function CourseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [course, setCourse] = useState(emptyCourse);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [collapsedMaterials, setCollapsedMaterials] = useState({});
  const [collapsedSubMaterials, setCollapsedSubMaterials] = useState({});

  const isMaterialCollapsed = (index) => Boolean(collapsedMaterials[index]);
  const isSubMaterialCollapsed = (matIndex, subIndex) =>
    Boolean(collapsedSubMaterials[`${matIndex}-${subIndex}`]);

  const toggleMaterial = (index) => {
    setCollapsedMaterials((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleSubMaterialCollapse = (matIndex, subIndex) => {
    const key = `${matIndex}-${subIndex}`;
    setCollapsedSubMaterials((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (isEdit) loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      const res = await tutorApi.getCourse(id);
      const data = res.data.course;
      setCourse({
        title: data.title || '',
        intro_video_url: data.intro_video_url || '',
        information: data.information || '',
        price: data.price || 0,
        thumbnail_url: data.thumbnail_url || '',
        materials: data.materials?.length
          ? data.materials.map(mapMaterial)
          : [emptyMaterial()],
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memuat course');
      navigate('/tutor/courses');
    } finally {
      setLoading(false);
    }
  };

  const updateMaterial = (index, field, value) => {
    const materials = [...course.materials];
    materials[index] = { ...materials[index], [field]: value };
    setCourse({ ...course, materials });
  };

  const updateSubMaterial = (matIndex, subIndex, field, value) => {
    const materials = [...course.materials];
    const subs = [...materials[matIndex].sub_materials];
    subs[subIndex] = { ...subs[subIndex], [field]: value };
    materials[matIndex] = { ...materials[matIndex], sub_materials: subs };
    setCourse({ ...course, materials });
  };

  const addMaterial = () => {
    setCourse({
      ...course,
      materials: [...course.materials, emptyMaterial()],
    });
  };

  const removeMaterial = (index) => {
    setCourse({
      ...course,
      materials: course.materials.filter((_, i) => i !== index),
    });
  };

  const addSubMaterial = (matIndex) => {
    const materials = [...course.materials];
    materials[matIndex] = {
      ...materials[matIndex],
      sub_materials: [...materials[matIndex].sub_materials, emptySubMaterial()],
    };
    setCourse({ ...course, materials });
  };

  const removeSubMaterial = (matIndex, subIndex) => {
    const materials = [...course.materials];
    const subs = materials[matIndex].sub_materials.filter((_, i) => i !== subIndex);
    materials[matIndex] = {
      ...materials[matIndex],
      sub_materials: subs.length ? subs : [emptySubMaterial()],
    };
    setCourse({ ...course, materials });
  };

  const moveMaterial = (fromId, toId) => {
    // #region agent log
    fetch('http://localhost:7454/ingest/b83563f1-55a3-4588-9237-377b1e3571ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'749551'},body:JSON.stringify({sessionId:'749551',location:'CourseFormPage.jsx:moveMaterial',message:'moveMaterial called',data:{fromId,toId},timestamp:Date.now(),hypothesisId:'A',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    const from = parseInt(fromId.replace('mat-', ''), 10);
    const to = parseInt(toId.replace('mat-', ''), 10);
    setCourse({
      ...course,
      materials: reorderArray(course.materials, from, to),
    });
  };

  const moveSubMaterial = (matIndex, fromId, toId) => {
    const from = parseInt(fromId.split('-').pop(), 10);
    const to = parseInt(toId.split('-').pop(), 10);
    // #region agent log
    fetch('http://localhost:7454/ingest/b83563f1-55a3-4588-9237-377b1e3571ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'749551'},body:JSON.stringify({sessionId:'749551',location:'CourseFormPage.jsx:moveSubMaterial',message:'moveSubMaterial called',data:{matIndex,fromId,toId,from,to,subCount:course.materials[matIndex]?.sub_materials?.length},timestamp:Date.now(),hypothesisId:'C-D',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    const materials = [...course.materials];
    materials[matIndex] = {
      ...materials[matIndex],
      sub_materials: reorderArray(materials[matIndex].sub_materials, from, to),
    };
    setCourse({ ...course, materials });
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const res = await authApi.upload(file);
      setCourse({ ...course, thumbnail_url: res.data.url });
    } catch {
      alert('Gagal upload thumbnail');
    } finally {
      setUploadingThumb(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (let i = 0; i < course.materials.length; i++) {
      if (!course.materials[i].title.trim()) {
        alert(`Judul Materi ${i + 1} wajib diisi`);
        return;
      }
      for (let j = 0; j < course.materials[i].sub_materials.length; j++) {
        if (!course.materials[i].sub_materials[j].title.trim()) {
          alert(`Judul Sub Materi ${j + 1} pada Materi ${i + 1} wajib diisi`);
          return;
        }
      }
    }
    setSaving(true);
    try {
      if (isEdit) {
        await tutorApi.updateCourse(id, course);
        navigate(`/tutor/courses/${id}`);
      } else {
        const res = await tutorApi.createCourse(course);
        navigate(`/tutor/courses/${res.data.course.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.error || `Gagal ${isEdit ? 'mengupdate' : 'membuat'} course`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar variant="tutor" />
        <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="tutor" />
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <Link
          to={isEdit ? `/tutor/courses/${id}` : '/tutor/courses'}
          className="text-black hover:underline text-sm mb-4 inline-block"
        >
          ← Kembali
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-black mb-6">
          {isEdit ? 'Edit Course' : 'Buat Course Baru'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul Course *</label>
              <input
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Course</label>
              <div className="space-y-3">
                {course.thumbnail_url ? (
                  <div className="relative inline-block">
                    <img
                      src={course.thumbnail_url}
                      alt="Thumbnail preview"
                      className="w-full max-w-sm aspect-video object-cover rounded-lg border border-gray-200"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setCourse({ ...course, thumbnail_url: '' })}
                      className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full max-w-sm aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-black transition-colors">
                    <Image className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      {uploadingThumb ? 'Mengupload...' : 'Klik untuk upload thumbnail'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      disabled={uploadingThumb}
                    />
                  </label>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video Pembukaan (URL YouTube)</label>
              <input
                value={course.intro_video_url}
                onChange={(e) => setCourse({ ...course, intro_video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Information</label>
              <textarea
                value={course.information}
                onChange={(e) => setCourse({ ...course, information: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 h-32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga (IDR)</label>
              <input
                type="number"
                value={course.price}
                onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })}
                className="w-full border rounded-lg px-3 py-2"
                min="0"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Materi</h2>

            {course.materials.map((mat, i) => (
              <SortableItem
                key={`mat-${i}`}
                id={`mat-${i}`}
                acceptPrefix="mat-"
                onMove={moveMaterial}
                className="border rounded-lg p-4 mb-4"
              >
                <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMaterial(i)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left hover:text-black"
                  >
                    {isMaterialCollapsed(i) ? (
                      <ChevronRight className="w-4 h-4 shrink-0 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
                    )}
                    <span className="font-medium text-sm text-gray-500 shrink-0">Materi {i + 1}</span>
                    {isMaterialCollapsed(i) && mat.title && (
                      <span className="text-sm text-gray-700 truncate">— {mat.title}</span>
                    )}
                  </button>
                  {course.materials.length > 1 && (
                    <button type="button" onClick={() => removeMaterial(i)} className="text-gray-700 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {!isMaterialCollapsed(i) && (
                <>
                <input
                  value={mat.title}
                  onChange={(e) => updateMaterial(i, 'title', e.target.value)}
                  placeholder="Judul Materi *"
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
                <textarea
                  value={mat.description}
                  onChange={(e) => updateMaterial(i, 'description', e.target.value)}
                  placeholder="Deskripsi materi (opsional)"
                  className="w-full border rounded-lg px-3 py-2 h-20"
                />
                <input
                  value={mat.video_url}
                  onChange={(e) => updateMaterial(i, 'video_url', e.target.value)}
                  placeholder="URL Video materi (opsional)"
                  className="w-full border rounded-lg px-3 py-2"
                />

                <div className="border-t border-gray-100 pt-4 mt-2">
                  <span className="text-sm font-medium text-gray-600 block mb-3">Sub Materi</span>

                  {mat.sub_materials.map((sub, j) => (
                    <SortableItem
                      key={`sub-${i}-${j}`}
                      id={`sub-${i}-${j}`}
                      acceptPrefix={`sub-${i}-`}
                      onMove={(fromId, toId) => moveSubMaterial(i, fromId, toId)}
                      className="bg-gray-50 rounded-lg p-3 mb-2"
                    >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSubMaterialCollapse(i, j)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left hover:text-black"
                        >
                          {isSubMaterialCollapsed(i, j) ? (
                            <ChevronRight className="w-3 h-3 shrink-0 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 shrink-0 text-gray-400" />
                          )}
                          <span className="text-xs text-gray-500 shrink-0">Sub Materi {j + 1}</span>
                          {isSubMaterialCollapsed(i, j) && sub.title && (
                            <span className="text-xs text-gray-600 truncate">— {sub.title}</span>
                          )}
                        </button>
                        {mat.sub_materials.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubMaterial(i, j)}
                            className="text-gray-500 hover:text-gray-700 shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {!isSubMaterialCollapsed(i, j) && (
                      <>
                      <input
                        value={sub.title}
                        onChange={(e) => updateSubMaterial(i, j, 'title', e.target.value)}
                        placeholder="Judul Sub Materi *"
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                      />
                      <textarea
                        value={sub.description}
                        onChange={(e) => updateSubMaterial(i, j, 'description', e.target.value)}
                        placeholder="Deskripsi"
                        className="w-full border rounded-lg px-3 py-2 h-16 text-sm bg-white"
                      />
                      <input
                        value={sub.video_url}
                        onChange={(e) => updateSubMaterial(i, j, 'video_url', e.target.value)}
                        placeholder="URL Video (opsional)"
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                      />
                      </>
                      )}
                    </div>
                    </SortableItem>
                  ))}

                  <button
                    type="button"
                    onClick={() => addSubMaterial(i)}
                    className="w-full border-2 border-dashed border-gray-200 rounded-lg py-2 text-black flex items-center justify-center gap-1 text-xs hover:border-black hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Tambah Sub Materi
                  </button>
                </div>
                </>
                )}
                </div>
              </SortableItem>
            ))}

            <button
              type="button"
              onClick={addMaterial}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-black flex items-center justify-center gap-1 text-sm hover:border-black hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Materi
            </button>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Course'}
          </button>
        </form>
      </div>
    </div>
  );
}

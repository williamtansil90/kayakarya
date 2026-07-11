import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useAuth } from '../context/AuthContext';
import { coursesApi, authApi } from '../api';
import {
  CheckCircle, Circle, Heart,
  Send, Plus, ExternalLink, X, ChevronDown, ChevronUp, Lock
} from 'lucide-react';
import CourseThumbnail from '../components/CourseThumbnail';
import CommunityPanel from '../components/CommunityPanel';

const TABS = ['info', 'content', 'community', 'project'];

export default function CourseDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState('info');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const [newProject, setNewProject] = useState({
    title: '', description: '', youtube_url: '', images: []
  });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [commentTexts, setCommentTexts] = useState({});
  const [expandedMaterialId, setExpandedMaterialId] = useState(null);

  useEffect(() => {
    loadCourse();
  }, [id]);

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (!payment) return;
    const messages = {
      success: 'Pembayaran berhasil! Course sudah aktif.',
      failed: 'Pembayaran gagal. Silakan coba lagi.',
      pending: 'Pembayaran masih diproses.',
      verify_failed: 'Gagal memverifikasi pembayaran. Hubungi admin jika sudah bayar.',
    };
    if (messages[payment]) {
      alert(messages[payment]);
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
      loadCourse();
    }
  }, [searchParams]);

  useEffect(() => {
    if (course?.enrolled && tab === 'project') {
      loadProjects();
    }
  }, [tab, course?.enrolled]);

  const loadCourse = async () => {
    try {
      const res = await coursesApi.get(id);
      setCourse(res.data.course);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    const res = await coursesApi.getProjects(id);
    setProjects(res.data.projects);
  };

  const handleBuy = async () => {
    setBuying(true);
    try {
      const res = await coursesApi.buy(id);
      if (res.data.payment_url) {
        // #region agent log
        fetch('http://localhost:61351/ingest/b83563f1-55a3-4588-9237-377b1e3571ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'749551'},body:JSON.stringify({sessionId:'749551',location:'CourseDetail.jsx:handleBuy',message:'redirecting to payment',data:{courseId:id,invoice:res.data.invoice_number},timestamp:Date.now(),hypothesisId:'BUY',runId:'payment-integration'})}).catch(()=>{});
        // #endregion
        window.location.href = res.data.payment_url;
        return;
      }
      await loadCourse();
      setTab('content');
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal membeli course';
      alert(msg.includes('login') || msg.includes('Authentication') || msg.includes('Session')
        ? 'Sesi login habis. Silakan login ulang lalu coba beli lagi.'
        : msg);
    } finally {
      setBuying(false);
    }
  };

  const toggleExpand = (materialId) => {
    setExpandedMaterialId((prev) => {
      const next = prev === materialId ? null : materialId;
      // #region agent log
      fetch('http://localhost:7454/ingest/b83563f1-55a3-4588-9237-377b1e3571ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'749551'},body:JSON.stringify({sessionId:'749551',location:'CourseDetail.jsx:toggleExpand',message:'accordion toggle',data:{materialId,prev,next},timestamp:Date.now(),hypothesisId:'accordion',runId:'accordion-fix'})}).catch(()=>{});
      // #endregion
      return next;
    });
  };

  const toggleMaterial = async (materialId, current) => {
    await coursesApi.markProgress(id, materialId, !current);
    await loadCourse();
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 10 - newProject.images.length);
    for (const file of files) {
      const res = await authApi.upload(file);
      setNewProject(prev => ({
        ...prev,
        images: [...prev.images, res.data.url]
      }));
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    await coursesApi.createProject(id, newProject);
    setNewProject({ title: '', description: '', youtube_url: '', images: [] });
    setShowProjectForm(false);
    loadProjects();
  };

  const handleLike = async (projectId) => {
    await coursesApi.toggleLike(projectId);
    loadProjects();
  };

  const handleComment = async (projectId) => {
    const text = commentTexts[projectId];
    if (!text?.trim()) return;
    await coursesApi.addComment(projectId, text);
    setCommentTexts(prev => ({ ...prev, [projectId]: '' }));
    loadProjects();
  };

  useEffect(() => {
    if (!course) return;
    const checkLayout = () => {
      const doc = document.documentElement;
      // #region agent log
      fetch('http://localhost:7454/ingest/b83563f1-55a3-4588-9237-377b1e3571ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'749551'},body:JSON.stringify({sessionId:'749551',location:'CourseDetail.jsx:layoutCheck',message:'mobile layout check',data:{innerWidth:window.innerWidth,scrollWidth:doc.scrollWidth,clientWidth:doc.clientWidth,hasOverflow:doc.scrollWidth>doc.clientWidth,tab,enrolled:course.enrolled},timestamp:Date.now(),hypothesisId:'A-B',runId:'mobile-fix'})}).catch(()=>{});
      // #endregion
    };
    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, [course, tab]);

  const embedUrl = (url) => {
    if (!url) return '';
    return url.includes('embed/') ? url : url.replace('watch?v=', 'embed/');
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const progressPercent = course?.progress
    ? Math.round(
        (course.progress.filter(p => p.completed).length / (course.materials?.length || 1)) * 100
      )
    : 0;

  const renderBuyCard = () => {
    if (!course) return null;
    if (course.enrolled) {
      return (
        <div className="bg-gray-100 text-gray-800 p-3 rounded-lg text-center font-medium text-sm sm:text-base">
          ✓ Anda sudah membeli course ini
        </div>
      );
    }
    return (
      <>
        <p className="text-2xl sm:text-3xl font-bold text-black mb-4 text-center break-words">
          {formatPrice(course.price)}
        </p>
        {user ? (
          <button
            onClick={handleBuy}
            disabled={buying}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            {buying ? 'Memproses...' : 'Beli Course'}
          </button>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-3 text-sm">Login untuk membeli</p>
            <GoogleAuthButton role="student" onSuccess={loadCourse} />
          </div>
        )}
      </>
    );
  };

  if (loading) return (
    <div className="min-h-screen"><Navbar /><div className="animate-pulse h-96 bg-gray-200 m-4 rounded-xl" /></div>
  );

  if (!course) return (
    <div className="min-h-screen"><Navbar /><div className="text-center py-20">Course tidak ditemukan</div></div>
  );

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />

      <div className="bg-black text-white relative overflow-hidden">
        {course.thumbnail_url && (
          <div className="absolute inset-0">
            <CourseThumbnail
              url={course.thumbnail_url}
              title={course.title}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 py-6 sm:py-10">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold mb-3 sm:mb-4 break-words leading-tight">
            {course.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm md:text-base">
            {course.tutor_avatar && (
              <img src={course.tutor_avatar} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0" />
            )}
            <span className="break-words">oleh <strong>{course.tutor_name}</strong></span>
            <span className="text-gray-400 shrink-0">{course.total_buyers} students</span>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 py-4 sm:py-8 ${!course.enrolled ? 'pb-28 lg:pb-8' : ''}`}>
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1 min-w-0">
            {course.enrolled && (
              <div className="lg:hidden bg-gray-100 text-gray-800 p-3 rounded-lg text-center font-medium text-sm mb-4">
                ✓ Anda sudah membeli course ini
              </div>
            )}
            <div className="flex gap-0.5 sm:gap-1 border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {TABS.map((t) => {
                const locked = ['content', 'community', 'project'].includes(t) && !course.enrolled;
                const label = t === 'info' ? 'Info' : t === 'content' ? 'Content' : t === 'community' ? 'Community' : 'Project';
                return (
                  <button
                    key={t}
                    onClick={() => !locked && setTab(t)}
                    className={`flex-shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-medium capitalize transition-colors inline-flex items-center gap-1.5 ${
                      tab === t
                        ? 'text-black border-b-2 border-black'
                        : locked
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                    {locked && <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black" strokeWidth={2} />}
                  </button>
                );
              })}
            </div>

            {tab === 'info' && (
              <>
                {course.intro_video_url && (
                  <div className="aspect-video w-full max-w-full bg-black rounded-xl overflow-hidden mb-4 sm:mb-6">
                    <iframe
                      src={embedUrl(course.intro_video_url)}
                      className="w-full h-full"
                      allowFullScreen
                      title="Intro video"
                    />
                  </div>
                )}
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold text-black mb-3 sm:mb-4">Tentang Course</h2>
                <p className="text-gray-600 text-sm sm:text-base whitespace-pre-wrap leading-relaxed break-words">
                  {course.information || 'Belum ada informasi.'}
                </p>
                <h3 className="text-base sm:text-lg font-semibold mt-5 sm:mt-6 mb-3">Daftar Materi ({course.materials?.length || 0})</h3>
                <ul className="space-y-2">
                  {(course.materials || []).map((m, i) => (
                    <li key={m.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 bg-black text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                        {i + 1}
                      </span>
                      <p className="font-medium text-sm sm:text-base break-words min-w-0">{m.title}</p>
                    </li>
                  ))}
                </ul>
              </div>
              </>
            )}

            {tab === 'content' && course.enrolled && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Progress Belajar</span>
                    <span className="text-black font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-black h-3 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {(course.materials || []).map((m, i) => {
                  const prog = course.progress?.find(p => p.material_id === m.id);
                  const done = prog?.completed;
                  const isExpanded = expandedMaterialId === m.id;
                  return (
                    <div key={m.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-5 min-w-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleMaterial(m.id, done); }}
                          className="flex-shrink-0 mt-0.5 sm:mt-0"
                          title={done ? 'Tandai belum selesai' : 'Tandai selesai'}
                        >
                          {done ? (
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                          ) : (
                            <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 hover:text-black" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleExpand(m.id)}
                          className="flex-1 flex items-start sm:items-center justify-between gap-2 text-left min-w-0"
                        >
                          <h3 className="font-semibold text-black text-sm sm:text-base break-words min-w-0">
                            {i + 1}. {m.title}
                          </h3>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="px-3 sm:px-5 pb-4 sm:pb-5 pt-0 sm:ml-9 border-t border-gray-100 min-w-0">
                          {m.description && (
                            <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed break-words">{m.description}</p>
                          )}
                          {m.video_url && (
                            <div className="mt-3 sm:mt-4 aspect-video w-full max-w-full rounded-lg overflow-hidden bg-black">
                              <iframe
                                src={embedUrl(m.video_url)}
                                className="w-full h-full"
                                allowFullScreen
                                title={m.title}
                              />
                            </div>
                          )}

                          {(m.sub_materials || []).length > 0 && (
                            <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                              {m.sub_materials.map((sub, si) => (
                                <div key={sub.id || si} className="border border-gray-100 rounded-lg p-3 sm:p-4 bg-gray-50 min-w-0">
                                  <h4 className="font-medium text-black text-sm break-words">
                                    {i + 1}.{si + 1} {sub.title}
                                  </h4>
                                  {sub.description && (
                                    <p className="text-gray-600 text-sm mt-2 leading-relaxed break-words">{sub.description}</p>
                                  )}
                                  {sub.video_url && (
                                    <div className="mt-3 aspect-video w-full max-w-full rounded-lg overflow-hidden bg-black">
                                      <iframe
                                        src={embedUrl(sub.video_url)}
                                        className="w-full h-full"
                                        allowFullScreen
                                        title={sub.title}
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {!m.description && !m.video_url && !(m.sub_materials || []).length && (
                            <p className="text-gray-400 mt-4 text-sm">Tidak ada konten tambahan.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'community' && course.enrolled && (
              <CommunityPanel courseId={id} />
            )}

            {tab === 'project' && course.enrolled && (
              <div className="space-y-4">
                <button
                  onClick={() => setShowProjectForm(!showProjectForm)}
                  className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4" /> Posting Project
                </button>

                {showProjectForm && (
                  <form onSubmit={handleCreateProject} className="bg-white rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
                    <input
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      placeholder="Judul project"
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="Deskripsi"
                      className="w-full border rounded-lg px-3 py-2 h-24"
                    />
                    <input
                      value={newProject.youtube_url}
                      onChange={(e) => setNewProject({ ...newProject, youtube_url: e.target.value })}
                      placeholder="URL YouTube (opsional)"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Upload Gambar (max 10)
                      </label>
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {newProject.images.map((img, i) => (
                          <div key={i} className="relative">
                            <img src={img} alt="" className="w-20 h-20 object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => setNewProject(prev => ({
                                ...prev,
                                images: prev.images.filter((_, j) => j !== i)
                              }))}
                              className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg">
                      Submit Project
                    </button>
                  </form>
                )}

                {projects.map((project) => (
                  <div key={project.id} className="bg-white rounded-xl p-4 sm:p-5 shadow-sm min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      {project.user_avatar && <img src={project.user_avatar} alt="" className="w-8 h-8 rounded-full" />}
                      <div>
                        <p className="font-medium">{project.user_name}</p>
                        <p className="text-xs text-gray-400">{new Date(project.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <h4 className="font-semibold text-base sm:text-lg break-words">{project.title}</h4>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base break-words">{project.description}</p>

                    {project.images?.length > 0 && (
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-3">
                        {project.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="w-full sm:w-32 h-28 sm:h-32 object-cover rounded-lg" />
                        ))}
                      </div>
                    )}

                    {project.youtube_url && (
                      <a href={project.youtube_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-gray-700 mt-2 text-sm hover:underline">
                        <ExternalLink className="w-4 h-4" /> Lihat di YouTube
                      </a>
                    )}

                    <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                      <button
                        onClick={() => handleLike(project.id)}
                        className={`flex items-center gap-1 ${project.liked_by_me ? 'text-black' : 'text-gray-500'}`}
                      >
                        <Heart className={`w-5 h-5 ${project.liked_by_me ? 'fill-current' : ''}`} />
                        {project.like_count}
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {project.comments?.map((c) => (
                        <div key={c.id} className="flex gap-2 text-sm">
                          {c.user_avatar && <img src={c.user_avatar} alt="" className="w-6 h-6 rounded-full" />}
                          <div>
                            <span className="font-medium">{c.user_name}: </span>
                            <span className="text-gray-600">{c.content}</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          value={commentTexts[project.id] || ''}
                          onChange={(e) => setCommentTexts(prev => ({ ...prev, [project.id]: e.target.value }))}
                          placeholder="Tulis komentar..."
                          className="flex-1 border rounded-lg px-3 py-1.5 text-sm min-w-0"
                        />
                        <button onClick={() => handleComment(project.id)} className="text-black self-end sm:self-auto px-2 py-1">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2 hidden lg:block min-w-0">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm lg:sticky lg:top-24">
              {renderBuyCard()}
            </div>
          </div>
        </div>
      </div>

      {!course.enrolled && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <p className="text-base font-bold text-black shrink-0">{formatPrice(course.price)}</p>
            {user ? (
              <button
                onClick={handleBuy}
                disabled={buying}
                className="flex-1 bg-black text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm"
              >
                {buying ? 'Memproses...' : 'Beli Course'}
              </button>
            ) : (
              <div className="flex-1 flex justify-end">
                <GoogleAuthButton role="student" onSuccess={loadCourse} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

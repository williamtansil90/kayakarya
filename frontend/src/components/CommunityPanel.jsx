import { useState, useEffect } from 'react';
import { MessageSquare, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { coursesApi } from '../api';

const PER_PAGE = 10;

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function MentionContent({ content, mentionName }) {
  if (!content) return null;
  if (mentionName && content.startsWith('@')) {
    const rest = content.slice(mentionName.length + 1).trimStart();
    return (
      <p className="text-sm text-gray-600 break-words">
        <span className="font-semibold text-black">@{mentionName}</span>
        {rest ? ` ${rest}` : ''}
      </p>
    );
  }
  const match = content.match(/^@(\S+)\s*(.*)$/s);
  if (match) {
    return (
      <p className="text-sm text-gray-600 break-words">
        <span className="font-semibold text-black">@{match[1]}</span>
        {match[2] ? ` ${match[2]}` : ''}
      </p>
    );
  }
  return <p className="text-sm text-gray-600 break-words">{content}</p>;
}

function ReplyForm({ placeholder, onSubmit, onCancel }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col sm:flex-row gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border rounded-lg px-3 py-2 text-sm min-w-0"
      />
      <div className="flex gap-2 self-end sm:self-auto">
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-gray-500 text-sm px-2 py-2">
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={sending}
          className="bg-black text-white px-3 py-2 rounded-lg disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

export default function CommunityPanel({ courseId, onTopicCreated }) {
  const [topics, setTopics] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [thread, setThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const [replyTarget, setReplyTarget] = useState(null);

  const loadTopics = async (page = 1) => {
    setLoading(true);
    try {
      const res = await coursesApi.getCommunity(courseId, { page, per_page: PER_PAGE });
      setTopics(res.data.topics);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (topicId) => {
    setThreadLoading(true);
    try {
      const res = await coursesApi.getCommunityTopic(courseId, topicId);
      setThread(res.data);
      setSelectedTopicId(topicId);
      setReplyTarget(null);
    } finally {
      setThreadLoading(false);
    }
  };

  useEffect(() => {
    loadTopics(1);
  }, [courseId]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    await coursesApi.createTopic(courseId, newTopic);
    setNewTopic({ title: '', content: '' });
    await loadTopics(pagination.page);
    onTopicCreated?.();
  };

  const handleReply = async (text) => {
    if (!replyTarget) return;
    const payload = { content: text, title: 'Reply' };
    if (replyTarget.type === 'topic') {
      payload.parent_id = replyTarget.id;
    } else if (replyTarget.type === 'reply') {
      payload.parent_id = replyTarget.id;
    } else if (replyTarget.type === 'sub') {
      payload.reply_to_id = replyTarget.id;
    }
    await coursesApi.createTopic(courseId, payload);
    setReplyTarget(null);
    await loadThread(selectedTopicId);
    await loadTopics(pagination.page);
  };

  if (selectedTopicId && thread) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => { setSelectedTopicId(null); setThread(null); setReplyTarget(null); }}
          className="flex items-center gap-1 text-sm text-black hover:underline"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali ke daftar topik
        </button>

        {threadLoading ? (
          <div className="animate-pulse h-32 bg-gray-200 rounded-xl" />
        ) : (
          <>
            <div className={`bg-white rounded-xl p-4 sm:p-5 shadow-sm min-w-0 ${thread.topic.is_main_topic ? 'border-l-4 border-black' : ''}`}>
              {thread.topic.is_main_topic && (
                <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full mb-2 inline-block">
                  Topik Utama
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                {thread.topic.user_avatar && (
                  <img src={thread.topic.user_avatar} alt="" className="w-8 h-8 rounded-full" />
                )}
                <div>
                  <p className="font-medium text-sm">{thread.topic.user_name}</p>
                  <p className="text-xs text-gray-400">{formatDate(thread.topic.created_at)}</p>
                </div>
              </div>
              <h4 className="font-semibold text-base sm:text-lg break-words">{thread.topic.title}</h4>
              <p className="text-gray-600 mt-2 text-sm sm:text-base break-words whitespace-pre-wrap">
                {thread.topic.content}
              </p>
              <button
                type="button"
                onClick={() => setReplyTarget({ type: 'topic', id: thread.topic.id })}
                className="text-sm text-black mt-3 hover:underline"
              >
                Balas topik
              </button>
              {replyTarget?.type === 'topic' && replyTarget.id === thread.topic.id && (
                <ReplyForm
                  placeholder="Tulis balasan..."
                  onSubmit={handleReply}
                  onCancel={() => setReplyTarget(null)}
                />
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-600">
                Balasan ({thread.replies?.length || 0})
              </h3>
              {(thread.replies || []).map((reply) => (
                <div key={reply.id} className="bg-white rounded-xl p-4 shadow-sm min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {reply.user_avatar && (
                      <img src={reply.user_avatar} alt="" className="w-7 h-7 rounded-full" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{reply.user_name}</p>
                      <p className="text-xs text-gray-400">{formatDate(reply.created_at)}</p>
                    </div>
                  </div>
                  <MentionContent content={reply.content} mentionName={reply.reply_to_user_name} />

                  <button
                    type="button"
                    onClick={() => setReplyTarget({ type: 'reply', id: reply.id })}
                    className="text-xs text-black mt-2 hover:underline"
                  >
                    Balas
                  </button>
                  {replyTarget?.type === 'reply' && replyTarget.id === reply.id && (
                    <ReplyForm
                      placeholder="Tulis sub balasan..."
                      onSubmit={handleReply}
                      onCancel={() => setReplyTarget(null)}
                    />
                  )}

                  {reply.sub_reply && (
                    <div className="mt-3 ml-3 sm:ml-6 p-3 bg-gray-50 rounded-lg border-l-2 border-gray-300">
                      <div className="flex items-center gap-2 mb-1">
                        {reply.sub_reply.user_avatar && (
                          <img src={reply.sub_reply.user_avatar} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        <span className="font-medium text-sm">{reply.sub_reply.user_name}</span>
                        <span className="text-xs text-gray-400">{formatDate(reply.sub_reply.created_at)}</span>
                      </div>
                      <MentionContent
                        content={reply.sub_reply.content}
                        mentionName={reply.sub_reply.reply_to_user_name}
                      />
                      <button
                        type="button"
                        onClick={() => setReplyTarget({ type: 'sub', id: reply.sub_reply.id })}
                        className="text-xs text-black mt-2 hover:underline"
                      >
                        Balas
                      </button>
                      {replyTarget?.type === 'sub' && replyTarget.id === reply.sub_reply.id && (
                        <ReplyForm
                          placeholder={`Balas @${reply.sub_reply.user_name}...`}
                          onSubmit={handleReply}
                          onCancel={() => setReplyTarget(null)}
                        />
                      )}
                    </div>
                  )}

                  {(reply.at_replies || []).map((at) => (
                    <div key={at.id} className="mt-2 ml-3 sm:ml-6 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        {at.user_avatar && (
                          <img src={at.user_avatar} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        <span className="font-medium text-sm">{at.user_name}</span>
                        <span className="text-xs text-gray-400">{formatDate(at.created_at)}</span>
                      </div>
                      <MentionContent content={at.content} mentionName={at.reply_to_user_name} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreateTopic} className="bg-white rounded-xl p-4 sm:p-5 shadow-sm">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Buat Topik Baru
        </h3>
        <input
          value={newTopic.title}
          onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
          placeholder="Judul topik"
          className="w-full border rounded-lg px-3 py-2 mb-2"
          required
        />
        <textarea
          value={newTopic.content}
          onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
          placeholder="Isi topik..."
          className="w-full border rounded-lg px-3 py-2 mb-3 h-24"
        />
        <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
          Posting Topik
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuat...</div>
        ) : topics.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Belum ada topik.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Judul Topic</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Tanggal</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Reply</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topics.map((topic) => (
                    <tr
                      key={topic.id}
                      onClick={() => loadThread(topic.id)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {topic.is_main_topic && (
                            <span className="text-xs bg-black text-white px-1.5 py-0.5 rounded shrink-0">
                              Utama
                            </span>
                          )}
                          <span className="font-medium text-black break-words">{topic.title}</span>
                        </div>
                        <span className="text-xs text-gray-400 sm:hidden">{formatDate(topic.created_at)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">
                        {formatDate(topic.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{topic.reply_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => loadTopics(pagination.page - 1)}
                  className="flex items-center gap-1 disabled:opacity-40 hover:text-black"
                >
                  <ChevronLeft className="w-4 h-4" /> Sebelumnya
                </button>
                <span className="text-gray-500">
                  Halaman {pagination.page} / {pagination.pages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadTopics(pagination.page + 1)}
                  className="flex items-center gap-1 disabled:opacity-40 hover:text-black"
                >
                  Berikutnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

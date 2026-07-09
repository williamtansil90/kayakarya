import { useState } from 'react';
import { GripVertical } from 'lucide-react';

export default function SortableItem({ id, onMove, children, className = '', acceptPrefix }) {
  const [isOver, setIsOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('sortable/id', id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    // #region agent log
    fetch('http://localhost:7454/ingest/b83563f1-55a3-4588-9237-377b1e3571ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'749551'},body:JSON.stringify({sessionId:'749551',location:'SortableItem.jsx:dragStart',message:'dragStart',data:{id},timestamp:Date.now(),hypothesisId:'E',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    const fromId = e.dataTransfer.getData('sortable/id');
    // #region agent log
    fetch('http://localhost:7454/ingest/b83563f1-55a3-4588-9237-377b1e3571ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'749551'},body:JSON.stringify({sessionId:'749551',location:'SortableItem.jsx:drop',message:'drop',data:{id,fromId,willMove:Boolean(fromId&&fromId!==id)},timestamp:Date.now(),hypothesisId:'A-B',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    if (fromId && fromId !== id) {
      if (acceptPrefix && (!fromId.startsWith(acceptPrefix) || !id.startsWith(acceptPrefix))) return;
      onMove(fromId, id);
    }
  };

  return (
    <div
      className={`${className} transition-shadow ${
        isOver ? 'ring-2 ring-black/20 rounded-lg' : ''
      } ${isDragging ? 'opacity-60' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex gap-2 sm:gap-3">
        <button
          type="button"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0 touch-none p-1 -ml-1"
          title="Drag untuk pindah posisi"
          aria-label="Drag untuk pindah posisi"
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

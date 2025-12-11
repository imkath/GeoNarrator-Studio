'use client';

import { useState, forwardRef } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, AlertTriangle, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Chapter } from '@/types';

interface DeleteConfirmProps {
  chapterTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ chapterTitle, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
          </div>
          <div>
            <h3 id="delete-dialog-title" className="text-sm font-semibold text-white">Delete Scene</h3>
            <p className="text-xs text-slate-500">This action cannot be undone</p>
          </div>
          <button
            onClick={onCancel}
            className="ml-auto p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete <span className="font-semibold text-white">&quot;{chapterTitle}&quot;</span>?
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 flex gap-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors"
          >
            Delete Scene
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface SortableChapterProps {
  chapter: Chapter;
  index: number;
  isSelected: boolean;
  totalChapters: number;
  onSelect: () => void;
  onDelete: () => void;
}

const SortableChapter = forwardRef<HTMLDivElement, SortableChapterProps>(
  function SortableChapter({ chapter, index, isSelected, totalChapters, onSelect, onDelete }, ref) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const is3D = chapter.pitch > 10;

  // Combine refs
  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  return (
    <motion.div
      ref={combinedRef}
      style={style}
      layout={!isDragging}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{
        opacity: isDragging ? 0.8 : 1,
        y: 0,
        scale: isDragging ? 1.02 : 1,
      }}
      exit={{ opacity: 0, scale: 0.9, x: -100 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onClick={onSelect}
      className={`
        relative p-4 rounded-xl cursor-pointer border transition-all duration-300 group
        ${isDragging
          ? 'bg-indigo-500/20 border-indigo-500/50 shadow-2xl shadow-indigo-500/20'
          : isSelected
            ? 'bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
            : 'bg-white/[0.02] border-transparent hover:bg-white/5 hover:border-white/10'
        }
      `}
    >
      {/* Selection indicator */}
      <AnimatePresence>
        {isSelected && !isDragging && (
          <motion.div
            layoutId="selection-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-r-full"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className={`
            p-1 rounded cursor-grab active:cursor-grabbing transition-all
            ${isDragging
              ? 'opacity-100 text-indigo-400'
              : 'opacity-0 group-hover:opacity-60 hover:!opacity-100 text-slate-500 hover:text-white hover:bg-white/10'
            }
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Chapter number */}
        <motion.div
          className={`
            flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0 transition-all duration-300
            ${isSelected
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-white/5 text-slate-500 group-hover:bg-white/10'
            }
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {index + 1}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate transition-colors ${isSelected ? 'text-white' : 'text-slate-300'}`}>
            {chapter.title}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-600 font-mono">
              z{chapter.zoom.toFixed(1)}
            </span>
            {is3D && (
              <span className="text-[9px] text-emerald-500 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                3D
              </span>
            )}
          </div>
        </div>

        {/* Delete button */}
        {totalChapters > 1 && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-lg transition-all"
            title="Delete scene"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
});

export default function ChapterList() {
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  const {
    chapters,
    selectedChapterId,
    setSelectedChapterId,
    addChapter,
    deleteChapter,
    reorderChapters,
  } = useStoryStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex((ch) => ch.id === active.id);
      const newIndex = chapters.findIndex((ch) => ch.id === over.id);
      const newChapters = arrayMove(chapters, oldIndex, newIndex);
      reorderChapters(newChapters);
    }
  };

  const handleDeleteRequest = (id: string, title: string) => {
    setDeleteConfirm({ id, title });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deleteChapter(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <div className="px-4 pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={chapters.map(ch => ch.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2" role="list" aria-label="Scene list">
              <AnimatePresence mode="popLayout">
                {chapters.map((chapter, idx) => (
                  <SortableChapter
                    key={chapter.id}
                    chapter={chapter}
                    index={idx}
                    isSelected={selectedChapterId === chapter.id}
                    totalChapters={chapters.length}
                    onSelect={() => setSelectedChapterId(chapter.id)}
                    onDelete={() => handleDeleteRequest(chapter.id, chapter.title)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>

        {/* Add new chapter button */}
        <motion.button
          onClick={addChapter}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full mt-4 py-4 border border-dashed border-white/10 rounded-xl text-slate-500 text-sm font-medium hover:bg-white/5 hover:text-slate-300 hover:border-white/20 transition-all flex items-center justify-center gap-2 group"
          aria-label="Add new scene"
        >
          <motion.div
            className="p-1.5 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 transition-colors"
            whileHover={{ rotate: 90 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </motion.div>
          ADD NEW SCENE
        </motion.button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirmDialog
            chapterTitle={deleteConfirm.title}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

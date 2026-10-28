'use client';

import { useState } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  type Announcements,
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
import Modal, { btn } from '@/components/ui/Modal';

interface SortableChapterProps {
  chapter: Chapter;
  index: number;
  isSelected: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableChapter({ chapter, index, isSelected, canDelete, onSelect, onDelete }: SortableChapterProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
      className={`group flex items-stretch border rounded-[2px] bg-paper ${
        isDragging ? 'border-ink shadow-[0_2px_0_rgba(20,24,29,0.25)]' : isSelected ? 'border-water bg-water-tint' : 'border-rule hover:border-ink-3'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reordenar la escena ${index + 1}`}
        className="px-1.5 text-ink-3 hover:text-ink cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
      </button>

      <button
        onClick={onSelect}
        aria-current={isSelected ? 'true' : undefined}
        className="flex-1 min-w-0 flex items-center gap-2.5 py-2 pr-2 text-left"
      >
        <span
          className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center font-mono text-[11px] font-semibold ${
            isSelected ? 'bg-contour border-contour text-paper' : 'border-ink text-ink'
          }`}
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <span className="min-w-0">
          <span className={`block text-[14px] leading-tight truncate ${isSelected ? 'font-semibold' : ''}`}>
            {chapter.title || 'Sin título'}
          </span>
          <span className="block font-mono text-[10px] text-ink-3 mt-0.5">
            {Math.abs(chapter.latitude).toFixed(2)}°{chapter.latitude < 0 ? 'S' : 'N'}{' '}
            {Math.abs(chapter.longitude).toFixed(2)}°{chapter.longitude < 0 ? 'O' : 'E'} · z{chapter.zoom.toFixed(1)}
            {chapter.pitch > 10 ? ` · ${Math.round(chapter.pitch)}°` : ''}
          </span>
        </span>
      </button>

      {canDelete && (
        <button
          onClick={onDelete}
          className="px-2 text-ink-3 hover:text-danger opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Borrar la escena ${index + 1}`}
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

export default function ChapterList() {
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string; index: number } | null>(null);

  const { chapters, selectedChapterId, setSelectedChapterId, addChapter, deleteChapter, reorderChapters } =
    useStoryStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const position = (id: string | number) => chapters.findIndex((c) => c.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tomaste la escena ${position(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `La escena ${position(active.id)} pasa al lugar ${position(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `La escena quedó en el lugar ${position(over.id)}.` : `La escena ${position(active.id)} no se movió.`,
    onDragCancel: () => 'Se canceló el cambio de orden.',
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex((ch) => ch.id === active.id);
      const newIndex = chapters.findIndex((ch) => ch.id === over.id);
      reorderChapters(arrayMove(chapters, oldIndex, newIndex));
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              'Para reordenar, presiona espacio, mueve la escena con las flechas y suelta con espacio. Escape cancela.',
          },
        }}
      >
        <SortableContext items={chapters.map((ch) => ch.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-1.5" aria-label="Escenas de la historia">
            {chapters.map((chapter, idx) => (
              <SortableChapter
                key={chapter.id}
                chapter={chapter}
                index={idx}
                isSelected={selectedChapterId === chapter.id}
                canDelete={chapters.length > 1}
                onSelect={() => setSelectedChapterId(chapter.id)}
                onDelete={() => setDeleteConfirm({ id: chapter.id, title: chapter.title, index: idx })}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <button
        onClick={addChapter}
        className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-[2px] border border-dashed border-ink-3 text-[13px] font-semibold text-ink-2 hover:border-water hover:text-water"
      >
        <Plus className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
        Agregar escena
      </button>

      {deleteConfirm && (
        <Modal
          title={`¿Borrar la escena ${deleteConfirm.index + 1}?`}
          size="sm"
          onClose={() => setDeleteConfirm(null)}
          footer={
            <>
              <button className={btn.secondary} onClick={() => setDeleteConfirm(null)} data-autofocus>
                Cancelar
              </button>
              <button
                className={btn.danger}
                onClick={() => {
                  deleteChapter(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
              >
                Borrar la escena
              </button>
            </>
          }
        >
          <p className="px-5 py-4 text-sm text-ink-2">
            “{deleteConfirm.title || 'Sin título'}” se borra con su texto y su encuadre. No se puede deshacer.
          </p>
        </Modal>
      )}
    </>
  );
}

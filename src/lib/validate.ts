import type { Chapter, DataLayer } from '@/types';

export class ProjectError extends Error {}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Scenes come from files people import and from URLs anyone can edit. The
 * editor reads every camera field without guards (zoom.toFixed, and so on),
 * so a scene missing one used to take the whole screen down. This is the one
 * gate both entry points go through.
 */
export function validateChapters(value: unknown): Chapter[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ProjectError('La historia no tiene escenas.');
  }

  const seen = new Set<string>();
  return value.map((raw, index) => {
    const ch = raw as Partial<Chapter> | null;
    if (
      !ch ||
      typeof ch.id !== 'string' ||
      ch.id === '' ||
      typeof ch.title !== 'string' ||
      !isNumber(ch.longitude) ||
      !isNumber(ch.latitude) ||
      !isNumber(ch.zoom) ||
      !isNumber(ch.pitch) ||
      !isNumber(ch.bearing)
    ) {
      throw new ProjectError(`La escena ${index + 1} tiene datos incompletos.`);
    }
    // Duplicate ids break selection and the sortable list in quiet ways.
    const id = seen.has(ch.id) ? `${ch.id}-${index}` : ch.id;
    seen.add(id);

    return {
      id,
      title: ch.title.slice(0, 100),
      content: typeof ch.content === 'string' ? ch.content.slice(0, 1000) : '',
      longitude: clamp(ch.longitude, -180, 180),
      latitude: clamp(ch.latitude, -85, 85),
      zoom: clamp(ch.zoom, 0, 22),
      pitch: clamp(ch.pitch, 0, 85),
      bearing: clamp(ch.bearing, -180, 180),
      ...(Array.isArray(ch.visibleLayerIds)
        ? { visibleLayerIds: ch.visibleLayerIds.filter((l): l is string => typeof l === 'string') }
        : {}),
    };
  });
}

const isColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value);

/**
 * Layers are drawn straight into Mapbox paint expressions, so a malformed one
 * crashed the embed inside someone else's page. Anything that does not look
 * like a layer this app wrote is rejected as a whole.
 */
export function validateLayers(value: unknown): DataLayer[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new ProjectError('El campo de capas no es una lista.');
  }

  return value.map((raw, index) => {
    const layer = raw as Partial<DataLayer> | null;
    const style = layer?.style;
    if (
      !layer ||
      typeof layer.id !== 'string' ||
      typeof layer.name !== 'string' ||
      layer.collection?.type !== 'FeatureCollection' ||
      !Array.isArray(layer.collection.features) ||
      !Array.isArray(layer.geometryKinds) ||
      !style ||
      !isColor(style.color) ||
      !isColor(style.rampFrom) ||
      !isColor(style.rampTo) ||
      !isNumber(style.opacity)
    ) {
      throw new ProjectError(`La capa ${index + 1} no tiene el formato esperado.`);
    }

    const range =
      style.range && isNumber(style.range.min) && isNumber(style.range.max) ? style.range : undefined;

    return {
      id: layer.id,
      name: layer.name.slice(0, 100),
      collection: layer.collection,
      geometryKinds: layer.geometryKinds.filter((k): k is string => typeof k === 'string'),
      numericProperties:
        layer.numericProperties && typeof layer.numericProperties === 'object'
          ? layer.numericProperties
          : {},
      featureCount: isNumber(layer.featureCount) ? layer.featureCount : layer.collection.features.length,
      style: {
        color: style.color,
        opacity: clamp(style.opacity, 0, 1),
        rampFrom: style.rampFrom,
        rampTo: style.rampTo,
        ...(typeof style.property === 'string' && range ? { property: style.property, range } : {}),
      },
    };
  });
}

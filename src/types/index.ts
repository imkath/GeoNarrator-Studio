export interface CameraState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface Chapter extends CameraState {
  id: string;
  title: string;
  content: string;
  /** Layers visible in this scene. Absent means every layer is visible. */
  visibleLayerIds?: string[];
  mediaUrl?: string;
  duration?: number;
}

export type EditorMode = 'edit' | 'preview';

export interface ViewState extends CameraState {
  transitionDuration?: number;
  transitionInterpolator?: unknown;
}

export interface NumericRange {
  min: number;
  max: number;
}

export interface LayerStyle {
  /** Flat colour, used when no property drives the ramp. */
  color: string;
  opacity: number;
  /** Property whose value drives the colour ramp, if any. */
  property?: string;
  range?: NumericRange;
  rampFrom: string;
  rampTo: string;
}

export interface DataLayer {
  id: string;
  name: string;
  collection: GeoJSON.FeatureCollection;
  style: LayerStyle;
  /** Which geometry kinds it holds, so the map knows what layers to add. */
  geometryKinds: string[];
  numericProperties: Record<string, NumericRange>;
  featureCount: number;
}

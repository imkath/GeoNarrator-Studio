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
  mediaUrl?: string;
  duration?: number;
}

export type EditorMode = 'edit' | 'preview';

export interface ViewState extends CameraState {
  transitionDuration?: number;
  transitionInterpolator?: unknown;
}

declare module 'react-avatar-editor' {
  import { Component } from 'react';

  export interface Position {
    x: number;
    y: number;
  }

  export interface AvatarEditorProps {
    ref?: React.Ref<AvatarEditor>;
    image: string | File;
    width?: number;
    height?: number;
    border?: number | number[];
    borderRadius?: number;
    color?: number[];
    scale?: number;
    position?: Position;
    rotate?: number;
    crossOrigin?: string;
    onLoadFailure?: (event: Event) => void;
    onLoadSuccess?: (imgInfo: {
      width: number;
      height: number;
      resource: HTMLImageElement;
    }) => void;
    onImageReady?: (event: Event) => void;
    onImageChange?: () => void;
    onMouseUp?: () => void;
    onMouseMove?: (event: Event) => void;
    onPositionChange?: (position: Position) => void;
    disableBoundaryChecks?: boolean;
    disableHiDPIScaling?: boolean;
    className?: string;
    style?: React.CSSProperties;
  }

  export default class AvatarEditor extends Component<AvatarEditorProps> {
    getImage(): HTMLCanvasElement;
    getImageScaledToCanvas(): HTMLCanvasElement;
  }
}

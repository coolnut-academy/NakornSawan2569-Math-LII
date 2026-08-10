import {
  createIcons,
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  Eye,
  EyeOff,
  FileImage,
  Image,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Trash2,
  Undo2,
  Upload
} from 'lucide';

const icons = {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  Eye,
  EyeOff,
  FileImage,
  Image,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Trash2,
  Undo2,
  Upload
};

export function refreshIcons(root = document) {
  createIcons({
    icons,
    root,
    attrs: {
      'aria-hidden': 'true',
      width: 18,
      height: 18,
      'stroke-width': 2
    }
  });
}

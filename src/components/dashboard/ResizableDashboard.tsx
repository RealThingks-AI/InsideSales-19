import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  X, Plus, GripVertical,
  Users, FileText, Briefcase, TrendingUp, Clock, Calendar, Activity, Bell, 
  Target, PieChart, LineChart, DollarSign, Mail, MessageSquare, CheckCircle, AlertTriangle, 
  Globe, Building2, Star, Trophy, Gauge, ListTodo, PhoneCall, MapPin, Percent, ArrowUpRight, Filter
} from "lucide-react";
import { WidgetKey, DEFAULT_WIDGETS, WidgetLayoutConfig, WidgetLayout } from "./DashboardCustomizeModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResizableDashboardProps {
  isResizeMode: boolean;
  visibleWidgets: WidgetKey[];
  widgetLayouts: WidgetLayoutConfig;
  onLayoutChange: (layouts: WidgetLayoutConfig) => void;
  onWidgetRemove: (key: WidgetKey) => void;
  onWidgetAdd: (key: WidgetKey) => void;
  renderWidget: (key: WidgetKey) => React.ReactNode;
  containerWidth: number;
}

export const ResizableDashboard = ({
  isResizeMode,
  visibleWidgets,
  widgetLayouts,
  onLayoutChange,
  onWidgetRemove,
  onWidgetAdd,
  renderWidget,
  containerWidth,
}: ResizableDashboardProps) => {
  const [draggedWidget, setDraggedWidget] = useState<WidgetKey | null>(null);
  const [resizingWidget, setResizingWidget] = useState<WidgetKey | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Get layout for a widget with defaults
  const getWidgetLayout = (key: WidgetKey): WidgetLayout => {
    const saved = widgetLayouts[key];
    const defaultWidget = DEFAULT_WIDGETS.find(w => w.key === key);
    const defaultLayout = defaultWidget?.defaultLayout || { x: 0, y: 0, w: 3, h: 2 };
    return {
      x: saved?.x ?? defaultLayout.x,
      y: saved?.y ?? defaultLayout.y,
      w: saved?.w ?? defaultLayout.w,
      h: saved?.h ?? defaultLayout.h,
    };
  };

  // Calculate grid column span
  const getGridSpan = (key: WidgetKey) => {
    const layout = getWidgetLayout(key);
    return {
      gridColumn: `span ${Math.min(layout.w, 12)}`,
      gridRow: `span ${layout.h}`,
    };
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, key: WidgetKey, corner: string) => {
    if (!isResizeMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    const layout = getWidgetLayout(key);
    setResizingWidget(key);
    setResizeStart({ x: e.clientX, y: e.clientY, w: layout.w, h: layout.h });
  };

  // Handle resize move
  useEffect(() => {
    if (!resizingWidget || !resizeStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      // Calculate new size based on drag distance (100px per grid unit)
      const newW = Math.max(2, Math.min(12, Math.round(resizeStart.w + deltaX / 100)));
      const newH = Math.max(2, Math.round(resizeStart.h + deltaY / 60));
      
      const newLayouts = { ...widgetLayouts };
      const currentLayout = getWidgetLayout(resizingWidget);
      newLayouts[resizingWidget] = {
        ...currentLayout,
        w: newW,
        h: newH,
      };
      onLayoutChange(newLayouts);
    };

    const handleMouseUp = () => {
      setResizingWidget(null);
      setResizeStart(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingWidget, resizeStart, widgetLayouts, onLayoutChange]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, key: WidgetKey) => {
    if (!isResizeMode) return;
    setDraggedWidget(key);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop - swap widgets
  const handleDrop = (e: React.DragEvent, targetKey: WidgetKey) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetKey) {
      setDraggedWidget(null);
      return;
    }

    // Swap layouts
    const draggedLayout = getWidgetLayout(draggedWidget);
    const targetLayout = getWidgetLayout(targetKey);
    
    const newLayouts = { ...widgetLayouts };
    newLayouts[draggedWidget] = { ...targetLayout };
    newLayouts[targetKey] = { ...draggedLayout };
    
    onLayoutChange(newLayouts);
    setDraggedWidget(null);
  };

  // Get widgets that can be added
  const availableWidgets = DEFAULT_WIDGETS.filter(w => !visibleWidgets.includes(w.key));

  return (
    <div className="relative">
      {/* Add Widget Button */}
      {isResizeMode && availableWidgets.length > 0 && (
        <div className="mb-4 flex justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Widget
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="center">
              <ScrollArea className="h-64">
                <div className="p-2 space-y-1">
                  {availableWidgets.map(widget => (
                    <Button
                      key={widget.key}
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => onWidgetAdd(widget.key)}
                    >
                      {widget.icon}
                      {widget.label}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Grid Layout */}
      <div 
        ref={gridRef}
        className="grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridAutoRows: '80px',
        }}
      >
        {visibleWidgets.map(key => {
          const gridSpan = getGridSpan(key);
          const isDragging = draggedWidget === key;
          const isResizing = resizingWidget === key;
          
          return (
            <div
              key={key}
              className={`relative transition-all duration-200 ${
                isResizeMode ? 'resize-mode-widget' : ''
              } ${isDragging ? 'opacity-50' : ''} ${isResizing ? 'ring-2 ring-primary' : ''}`}
              style={gridSpan}
              draggable={isResizeMode}
              onDragStart={(e) => handleDragStart(e, key)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, key)}
            >
              <div className={`relative h-full ${isResizeMode ? 'animate-wiggle' : ''}`}>
                {/* Remove button */}
                {isResizeMode && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 z-20 h-6 w-6 rounded-full shadow-lg"
                    onClick={(e) => { e.stopPropagation(); onWidgetRemove(key); }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
                
                {/* Drag handle */}
                {isResizeMode && (
                  <div className="absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing bg-background/90 backdrop-blur-sm p-1.5 rounded-md shadow-sm border">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                
                {/* Resize handles */}
                {isResizeMode && (
                  <>
                    <div 
                      className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-tl cursor-se-resize z-20 opacity-80 hover:opacity-100"
                      onMouseDown={(e) => handleResizeStart(e, key, 'se')}
                    />
                    <div 
                      className="absolute bottom-0 left-0 right-4 h-2 bg-primary/30 cursor-s-resize z-20 opacity-0 hover:opacity-80 rounded-bl"
                      onMouseDown={(e) => handleResizeStart(e, key, 's')}
                    />
                    <div 
                      className="absolute top-0 bottom-4 right-0 w-2 bg-primary/30 cursor-e-resize z-20 opacity-0 hover:opacity-80 rounded-tr"
                      onMouseDown={(e) => handleResizeStart(e, key, 'e')}
                    />
                  </>
                )}
                
                {/* Widget content */}
                <div className={`h-full ${isResizeMode ? 'pointer-events-none select-none' : ''}`}>
                  {renderWidget(key)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-0.3deg); }
          50% { transform: rotate(0.3deg); }
        }
        .animate-wiggle { animation: wiggle 0.25s ease-in-out infinite; }
        .resize-mode-widget { 
          transition: box-shadow 0.2s ease, transform 0.2s ease; 
        }
        .resize-mode-widget:hover { 
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.5);
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

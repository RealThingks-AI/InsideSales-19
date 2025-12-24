import { useState, useEffect, useCallback, useMemo } from "react";
import GridLayout from "react-grid-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  X, Plus, Check,
  Users, FileText, Briefcase, TrendingUp, Clock, CheckCircle2, ArrowRight, Calendar, Activity, Bell, AlertCircle, Info, 
  Target, PieChart, LineChart, DollarSign, Mail, MessageSquare, CheckCircle, AlertTriangle, 
  Globe, Building2, Star, Trophy, Gauge, ListTodo, PhoneCall, MapPin, Percent, ArrowUpRight, Filter
} from "lucide-react";
import { WidgetKey, DEFAULT_WIDGETS, WidgetLayoutConfig, WidgetLayout } from "./DashboardCustomizeModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

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
  const COLS = 12;
  const ROW_HEIGHT = 80;
  const MARGIN: [number, number] = [16, 16];

  // Convert widget layouts to react-grid-layout format
  const layout: LayoutItem[] = useMemo(() => {
    return visibleWidgets.map((key) => {
      const savedLayout = widgetLayouts[key];
      const defaultWidget = DEFAULT_WIDGETS.find(w => w.key === key);
      const defaultLayout = defaultWidget?.defaultLayout || { x: 0, y: 0, w: 3, h: 2 };
      
      return {
        i: key,
        x: savedLayout?.x ?? defaultLayout.x,
        y: savedLayout?.y ?? defaultLayout.y,
        w: savedLayout?.w ?? defaultLayout.w,
        h: savedLayout?.h ?? defaultLayout.h,
        minW: 2,
        minH: 2,
      };
    });
  }, [visibleWidgets, widgetLayouts]);

  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    const newLayouts: WidgetLayoutConfig = {};
    newLayout.forEach(item => {
      newLayouts[item.i] = {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      };
    });
    onLayoutChange(newLayouts);
  }, [onLayoutChange]);

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

      <GridLayout
        className="layout"
        layout={layout}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        width={containerWidth}
        margin={MARGIN}
        isDraggable={isResizeMode}
        isResizable={isResizeMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's']}
        compactType="vertical"
        preventCollision={false}
      >
        {visibleWidgets.map(key => (
          <div 
            key={key} 
            className={`widget-container ${isResizeMode ? 'resize-mode-widget' : ''}`}
          >
            <div className={`relative h-full ${isResizeMode ? 'animate-wiggle' : ''}`}>
              {isResizeMode && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 z-20 h-6 w-6 rounded-full shadow-lg"
                  onClick={() => onWidgetRemove(key)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              
              {isResizeMode && (
                <div className="widget-drag-handle absolute inset-0 z-10 cursor-move bg-transparent" />
              )}
              
              <div className={`h-full ${isResizeMode ? 'pointer-events-none' : ''}`}>
                {renderWidget(key)}
              </div>
            </div>
          </div>
        ))}
      </GridLayout>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-0.5deg); }
          50% { transform: rotate(0.5deg); }
        }
        .animate-wiggle { animation: wiggle 0.3s ease-in-out infinite; }
        .resize-mode-widget { transition: box-shadow 0.2s ease; }
        .resize-mode-widget:hover { box-shadow: 0 0 0 2px hsl(var(--primary) / 0.5); }
        .react-grid-item.react-grid-placeholder {
          background: hsl(var(--primary) / 0.2) !important;
          border: 2px dashed hsl(var(--primary)) !important;
          border-radius: 0.5rem;
        }
        .react-resizable-handle {
          position: absolute; width: 20px; height: 20px;
          background: hsl(var(--primary)); border-radius: 4px;
          opacity: 0; transition: opacity 0.2s;
        }
        .resize-mode-widget:hover .react-resizable-handle { opacity: 1; }
        .react-resizable-handle-se { bottom: 0; right: 0; cursor: se-resize; }
        .react-resizable-handle-sw { bottom: 0; left: 0; cursor: sw-resize; }
        .react-resizable-handle-ne { top: 0; right: 0; cursor: ne-resize; }
        .react-resizable-handle-nw { top: 0; left: 0; cursor: nw-resize; }
        .react-resizable-handle-e { right: 0; top: 50%; transform: translateY(-50%); cursor: e-resize; }
        .react-resizable-handle-w { left: 0; top: 50%; transform: translateY(-50%); cursor: w-resize; }
        .react-resizable-handle-n { top: 0; left: 50%; transform: translateX(-50%); cursor: n-resize; }
        .react-resizable-handle-s { bottom: 0; left: 50%; transform: translateX(-50%); cursor: s-resize; }
      `}</style>
    </div>
  );
};

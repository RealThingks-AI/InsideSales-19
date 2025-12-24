import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  GripVertical, FileText, Users, Briefcase, Clock, TrendingUp, Zap, BarChart3, Calendar, Activity, Bell, 
  Target, PieChart, LineChart, DollarSign, Mail, MessageSquare, CheckCircle, AlertTriangle, 
  Globe, Building2, Star, Trophy, Gauge, ListTodo, PhoneCall, MapPin, Percent, ArrowUpRight, Filter
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type WidgetKey = 
  | "leads" | "contacts" | "deals" | "actionItems" | "performance" | "quickActions" 
  | "leadStatus" | "upcomingMeetings" | "recentActivities" | "taskReminders"
  | "salesTarget" | "revenueChart" | "pipelineValue" | "conversionRate" | "emailStats"
  | "teamActivity" | "completedTasks" | "overdueItems" | "topDeals" | "regionStats"
  | "accountHealth" | "customerRetention" | "winLossRatio" | "salesVelocity" | "taskProgress"
  | "callLog" | "geoDistribution" | "dealForecast" | "growthTrend" | "leadSources";

export type WidgetSize = "xs" | "small" | "medium" | "large" | "xl";

export interface DashboardWidget {
  key: WidgetKey;
  label: string;
  icon: React.ReactNode;
  visible: boolean;
  size: WidgetSize;
}

export interface WidgetSizeConfig {
  [key: string]: WidgetSize;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  // Core widgets
  { key: "leads", label: "My Leads", icon: <FileText className="w-4 h-4" />, visible: true, size: "small" },
  { key: "contacts", label: "My Contacts", icon: <Users className="w-4 h-4" />, visible: true, size: "small" },
  { key: "deals", label: "My Deals", icon: <Briefcase className="w-4 h-4" />, visible: true, size: "small" },
  { key: "actionItems", label: "Action Items", icon: <Clock className="w-4 h-4" />, visible: true, size: "small" },
  { key: "quickActions", label: "Quick Actions", icon: <Zap className="w-4 h-4" />, visible: true, size: "medium" },
  { key: "upcomingMeetings", label: "Upcoming Meetings", icon: <Calendar className="w-4 h-4" />, visible: true, size: "medium" },
  { key: "taskReminders", label: "Task Reminders", icon: <Bell className="w-4 h-4" />, visible: true, size: "medium" },
  { key: "recentActivities", label: "Recent Activities", icon: <Activity className="w-4 h-4" />, visible: true, size: "medium" },
  { key: "performance", label: "My Performance", icon: <TrendingUp className="w-4 h-4" />, visible: true, size: "large" },
  { key: "leadStatus", label: "Lead Status Overview", icon: <BarChart3 className="w-4 h-4" />, visible: true, size: "large" },
  // Sales & Revenue widgets
  { key: "salesTarget", label: "Sales Target", icon: <Target className="w-4 h-4" />, visible: false, size: "medium" },
  { key: "revenueChart", label: "Revenue Chart", icon: <LineChart className="w-4 h-4" />, visible: false, size: "large" },
  { key: "pipelineValue", label: "Pipeline Value", icon: <DollarSign className="w-4 h-4" />, visible: false, size: "small" },
  { key: "conversionRate", label: "Conversion Rate", icon: <Percent className="w-4 h-4" />, visible: false, size: "small" },
  { key: "dealForecast", label: "Deal Forecast", icon: <ArrowUpRight className="w-4 h-4" />, visible: false, size: "large" },
  // Communication widgets
  { key: "emailStats", label: "Email Statistics", icon: <Mail className="w-4 h-4" />, visible: false, size: "medium" },
  { key: "callLog", label: "Call Log", icon: <PhoneCall className="w-4 h-4" />, visible: false, size: "medium" },
  // Team & Activity widgets
  { key: "teamActivity", label: "Team Activity", icon: <MessageSquare className="w-4 h-4" />, visible: false, size: "medium" },
  { key: "completedTasks", label: "Completed Tasks", icon: <CheckCircle className="w-4 h-4" />, visible: false, size: "small" },
  { key: "overdueItems", label: "Overdue Items", icon: <AlertTriangle className="w-4 h-4" />, visible: false, size: "small" },
  { key: "taskProgress", label: "Task Progress", icon: <ListTodo className="w-4 h-4" />, visible: false, size: "medium" },
  // Analytics widgets
  { key: "topDeals", label: "Top Deals", icon: <Trophy className="w-4 h-4" />, visible: false, size: "medium" },
  { key: "regionStats", label: "Region Statistics", icon: <Globe className="w-4 h-4" />, visible: false, size: "large" },
  { key: "geoDistribution", label: "Geo Distribution", icon: <MapPin className="w-4 h-4" />, visible: false, size: "large" },
  { key: "leadSources", label: "Lead Sources", icon: <Filter className="w-4 h-4" />, visible: false, size: "medium" },
  // Account & Customer widgets
  { key: "accountHealth", label: "Account Health", icon: <Building2 className="w-4 h-4" />, visible: false, size: "medium" },
  { key: "customerRetention", label: "Customer Retention", icon: <Star className="w-4 h-4" />, visible: false, size: "small" },
  // Performance widgets
  { key: "winLossRatio", label: "Win/Loss Ratio", icon: <PieChart className="w-4 h-4" />, visible: false, size: "small" },
  { key: "salesVelocity", label: "Sales Velocity", icon: <Gauge className="w-4 h-4" />, visible: false, size: "medium" },
  { key: "growthTrend", label: "Growth Trend", icon: <TrendingUp className="w-4 h-4" />, visible: false, size: "large" },
];

interface DashboardCustomizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleWidgets: WidgetKey[];
  widgetOrder: WidgetKey[];
  widgetSizes?: WidgetSizeConfig;
  onSave: (visibleWidgets: WidgetKey[], widgetOrder: WidgetKey[], widgetSizes: WidgetSizeConfig) => void;
  isSaving?: boolean;
}

export const DashboardCustomizeModal = ({
  open,
  onOpenChange,
  visibleWidgets,
  widgetOrder,
  widgetSizes = {},
  onSave,
  isSaving = false,
}: DashboardCustomizeModalProps) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  useEffect(() => {
    // Initialize widgets state based on current order and visibility
    const orderedWidgets: DashboardWidget[] = [];
    
    // First add widgets in the saved order
    widgetOrder.forEach(key => {
      const defaultWidget = DEFAULT_WIDGETS.find(w => w.key === key);
      if (defaultWidget) {
        orderedWidgets.push({
          ...defaultWidget,
          visible: visibleWidgets.includes(key),
          size: widgetSizes[key] || defaultWidget.size,
        });
      }
    });
    
    // Add any missing widgets at the end
    DEFAULT_WIDGETS.forEach(w => {
      if (!orderedWidgets.find(ow => ow.key === w.key)) {
        orderedWidgets.push({
          ...w,
          visible: visibleWidgets.includes(w.key),
          size: widgetSizes[w.key] || w.size,
        });
      }
    });
    
    setWidgets(orderedWidgets);
  }, [visibleWidgets, widgetOrder, widgetSizes, open]);

  const toggleWidget = (key: WidgetKey) => {
    setWidgets(prev =>
      prev.map(w => (w.key === key ? { ...w, visible: !w.visible } : w))
    );
  };

  const changeSize = (key: WidgetKey, size: WidgetSize) => {
    setWidgets(prev =>
      prev.map(w => (w.key === key ? { ...w, size } : w))
    );
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setWidgets(items);
  };

  const handleSave = () => {
    const visible = widgets.filter(w => w.visible).map(w => w.key);
    const order = widgets.map(w => w.key);
    const sizes: WidgetSizeConfig = {};
    widgets.forEach(w => {
      sizes[w.key] = w.size;
    });
    onSave(visible, order, sizes);
  };

  const handleReset = () => {
    setWidgets(DEFAULT_WIDGETS.map(w => ({ ...w, visible: true })));
  };

  const getSizeLabel = (size: WidgetSize) => {
    switch (size) {
      case "xs": return "XS";
      case "small": return "S";
      case "medium": return "M";
      case "large": return "L";
      case "xl": return "XL";
    }
  };

  const getSizeColor = (size: WidgetSize) => {
    switch (size) {
      case "xs": return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300';
      case "small": return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300';
      case "medium": return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300';
      case "large": return 'bg-green-100 dark:bg-green-900/30 border-green-300';
      case "xl": return 'bg-rose-100 dark:bg-rose-900/30 border-rose-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Drag to reorder, toggle visibility, and resize widgets.
          </p>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="widgets">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {widgets.map((widget, index) => (
                    <Draggable key={widget.key} draggableId={widget.key} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center justify-between p-3 rounded-lg border bg-card transition-colors ${
                            snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : "hover:bg-accent/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className={widget.visible ? "text-foreground" : "text-muted-foreground"}>
                              {widget.icon}
                            </div>
                            <Label 
                              htmlFor={widget.key} 
                              className={`cursor-pointer font-medium ${!widget.visible && "text-muted-foreground"}`}
                            >
                              {widget.label}
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={widget.size}
                              onValueChange={(value: WidgetSize) => changeSize(widget.key, value)}
                            >
                            <SelectTrigger className={`w-[90px] h-8 text-xs font-medium ${getSizeColor(widget.size)}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border shadow-lg">
                                <SelectItem value="xs" className="data-[state=checked]:bg-purple-100 dark:data-[state=checked]:bg-purple-900/30">Extra Small</SelectItem>
                                <SelectItem value="small" className="data-[state=checked]:bg-blue-100 dark:data-[state=checked]:bg-blue-900/30">Small</SelectItem>
                                <SelectItem value="medium" className="data-[state=checked]:bg-amber-100 dark:data-[state=checked]:bg-amber-900/30">Medium</SelectItem>
                                <SelectItem value="large" className="data-[state=checked]:bg-green-100 dark:data-[state=checked]:bg-green-900/30">Large</SelectItem>
                                <SelectItem value="xl" className="data-[state=checked]:bg-rose-100 dark:data-[state=checked]:bg-rose-900/30">Extra Large</SelectItem>
                              </SelectContent>
                            </Select>
                            <Switch
                              id={widget.key}
                              checked={widget.visible}
                              onCheckedChange={() => toggleWidget(widget.key)}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleReset} className="sm:mr-auto">
            Reset to Default
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { DEFAULT_WIDGETS };

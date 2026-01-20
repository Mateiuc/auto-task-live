import { Task, WorkSession, WorkPeriod, Part } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus } from 'lucide-react';
import { formatDuration, formatCurrency, formatTime, formatTimeForInput } from '@/lib/formatTime';
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { getVehicleColorScheme } from '@/lib/vehicleColors';
import { getSessionColorScheme } from '@/lib/sessionColors';
interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onSave: (updatedTask: Task) => void;
  onDelete?: (taskId: string) => void;
}
export const EditTaskDialog = ({
  open,
  onOpenChange,
  task,
  onSave,
  onDelete
}: EditTaskDialogProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useNotifications();
  // Get vehicle color scheme
  const colorScheme = getVehicleColorScheme(task.vehicleId);
  // Ensure all dates are properly converted to Date objects with fallbacks
  const [sessions, setSessions] = useState<WorkSession[]>((task.sessions || []).map(session => {
    const sessionBaseDate = session.createdAt ? new Date(session.createdAt) : new Date();
    // Validate session base date
    const validSessionDate = !isNaN(sessionBaseDate.getTime()) ? sessionBaseDate : new Date();
    
    return {
      ...session,
      createdAt: validSessionDate,
      completedAt: session.completedAt ? new Date(session.completedAt) : undefined,
      periods: (session.periods || []).map(period => {
        const startTime = period.startTime ? new Date(period.startTime) : new Date(validSessionDate);
        const endTime = period.endTime ? new Date(period.endTime) : new Date(validSessionDate);
        
        // Validate and use session date as fallback if invalid
        const validStartTime = !isNaN(startTime.getTime()) ? startTime : new Date(validSessionDate);
        const validEndTime = !isNaN(endTime.getTime()) ? endTime : new Date(validSessionDate);
        
        return {
          ...period,
          startTime: validStartTime,
          endTime: validEndTime
        };
      }),
      parts: session.parts || []
    };
  }));
  
  const [editingPeriod, setEditingPeriod] = useState<{
    sessionId: string;
    periodId: string;
    field: 'startTime' | 'endTime';
    value: string;
  } | null>(null);

  const [editingPeriodDate, setEditingPeriodDate] = useState<{
    sessionId: string;
    periodId: string;
  } | null>(null);
  const handleDeletePeriod = (sessionId: string, periodId: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedPeriods = session.periods.filter(p => p.id !== periodId);
        return {
          ...session,
          periods: updatedPeriods
        };
      }
      return session;
    }));
  };
  const handlePeriodTimeChange = (
    sessionId: string, 
    periodId: string, 
    field: 'startTime' | 'endTime', 
    value: string
  ) => {
    setEditingPeriod({ sessionId, periodId, field, value });
  };

  const handlePeriodTimeBlur = () => {
    if (!editingPeriod) return;
    
    const { sessionId, periodId, field, value } = editingPeriod;
    
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedPeriods = session.periods.map(period => {
          if (period.id === periodId) {
            const [hours, minutes] = value.split(':').map(Number);
            
            // Validate time input
            if (isNaN(hours) || isNaN(minutes)) {
              return period;
            }
            
            // FIX: Preserve the original date portion, only update time
            const currentDate = new Date(period[field]);
            
            // Validate that the base date is valid
            if (isNaN(currentDate.getTime())) {
              toast({
                title: "Invalid date",
                description: "Could not update the time. Please try again.",
                variant: "destructive"
              });
              return period;
            }
            
            // Create new date preserving the original date portion
            const newDate = new Date(currentDate);
            newDate.setHours(hours, minutes, 0, 0);
            
            const updated = {
              ...period,
              [field]: newDate
            };
            // Recalculate duration
            updated.duration = Math.floor((updated.endTime.getTime() - updated.startTime.getTime()) / 1000);
            
            // Check for conflicts with other periods on the same day
            const hasConflict = session.periods.some(p => {
              if (p.id === periodId) return false; // Skip self
              
              const isSameDay = 
                p.startTime.toDateString() === updated.startTime.toDateString();
              
              if (!isSameDay) return false;
              
              const newStart = updated.startTime.getTime();
              const newEnd = updated.endTime.getTime();
              const existingStart = p.startTime.getTime();
              const existingEnd = p.endTime.getTime();
              
              return (
                // Exact match
                (newStart === existingStart && newEnd === existingEnd) ||
                // Updated period overlaps with existing
                (newStart >= existingStart && newStart < existingEnd) ||
                (newEnd > existingStart && newEnd <= existingEnd) ||
                (newStart <= existingStart && newEnd >= existingEnd)
              );
            });
            
            if (hasConflict) {
              toast({
                title: "Cannot update period",
                description: "This time overlaps with another period on the same day",
                variant: "destructive"
              });
              return period; // Return unchanged
            }
            
            return updated;
          }
          return period;
        });
        return {
          ...session,
          periods: updatedPeriods
        };
      }
      return session;
    }));
    
    setEditingPeriod(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    toast({
      title: "Session deleted",
      description: "Session removed successfully"
    });
  };

  const handleChangePeriodDate = (sessionId: string, periodId: string, newDate: Date) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedPeriods = session.periods.map(period => {
          if (period.id === periodId) {
            // Preserve the time but change the date
            const newStartTime = new Date(newDate);
            newStartTime.setHours(period.startTime.getHours(), period.startTime.getMinutes(), 0, 0);
            
            const newEndTime = new Date(newDate);
            newEndTime.setHours(period.endTime.getHours(), period.endTime.getMinutes(), 0, 0);
            
            return {
              ...period,
              startTime: newStartTime,
              endTime: newEndTime
            };
          }
          return period;
        });
        return {
          ...session,
          periods: updatedPeriods
        };
      }
      return session;
    }));
    
    setEditingPeriodDate(null);
    toast({
      title: "Date updated",
      description: "Period date changed successfully"
    });
  };
  const handleDeletePart = (sessionId: string, partIndex: number) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedParts = session.parts.filter((_, i) => i !== partIndex);
        return {
          ...session,
          parts: updatedParts
        };
      }
      return session;
    }));
  };
  const handleUpdatePartQuantity = (sessionId: string, partIndex: number, quantity: number) => {
    if (quantity < 1) return;
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedParts = [...(session.parts || [])];
        updatedParts[partIndex] = {
          ...updatedParts[partIndex],
          quantity
        };
        return {
          ...session,
          parts: updatedParts
        };
      }
      return session;
    }));
  };
  const handleUpdatePartPrice = (sessionId: string, partIndex: number, price: number) => {
    if (price < 0) return;
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedParts = [...(session.parts || [])];
        updatedParts[partIndex] = {
          ...updatedParts[partIndex],
          price
        };
        return {
          ...session,
          parts: updatedParts
        };
      }
      return session;
    }));
  };

  const handleAddPeriodToSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    // Get the session's date (from first period or createdAt)
    const sessionDate = session.periods.length > 0 
      ? new Date(session.periods[0].startTime)
      : new Date(session.createdAt);
    
    // Find next available time slot within THIS session only
    let startHour = 9;
    let startMinute = 0;
    
    if (session.periods.length > 0) {
      // Find latest end time in this session
      const latestPeriod = session.periods.reduce((latest, period) => 
        period.endTime > latest.endTime ? period : latest
      );
      
      const latestEnd = new Date(latestPeriod.endTime);
      startHour = latestEnd.getHours();
      startMinute = latestEnd.getMinutes();
      
      // If minutes are not 0, round up to next hour
      if (startMinute > 0) {
        startHour++;
        startMinute = 0;
      }
    }
    
    const startTime = new Date(sessionDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    const endTime = new Date(startTime.getTime() + 3600000); // +1 hour
    
    // Check for conflicts within THIS session only
    const hasConflict = session.periods.some(period => {
      const periodStart = period.startTime.getTime();
      const periodEnd = period.endTime.getTime();
      const newStart = startTime.getTime();
      const newEnd = endTime.getTime();
      
      return (
        (newStart >= periodStart && newStart < periodEnd) ||
        (newEnd > periodStart && newEnd <= periodEnd) ||
        (newStart <= periodStart && newEnd >= periodEnd)
      );
    });
    
    if (hasConflict) {
      toast({
        title: "Cannot add period",
        description: "Time slot conflicts with existing period in this session",
        variant: "destructive"
      });
      return;
    }
    
    const newPeriod: WorkPeriod = {
      id: `period-${Date.now()}`,
      startTime,
      endTime,
      duration: 3600
    };
    
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          periods: [...s.periods, newPeriod]
        };
      }
      return s;
    }));
    
    toast({
      title: "Period added",
      description: `Added ${formatTime(startTime)} - ${formatTime(endTime)}`
    });
  };

  const handleAddNewSession = () => {
    const now = new Date();
    
    // Find next available time slot across ALL sessions
    let startHour = 9;
    
    // Get all periods from today
    const todayPeriods: WorkPeriod[] = [];
    sessions.forEach(session => {
      session.periods.forEach(period => {
        if (period.startTime.toDateString() === now.toDateString()) {
          todayPeriods.push(period);
        }
      });
    });
    
    if (todayPeriods.length > 0) {
      // Find the latest end time today
      const latestPeriod = todayPeriods.reduce((latest, period) => 
        period.endTime > latest.endTime ? period : latest
      );
      
      const latestEnd = new Date(latestPeriod.endTime);
      startHour = latestEnd.getHours() + 1;
      
      // If past 6 PM, start at 9 AM
      if (startHour >= 18) {
        startHour = 9;
      }
    }
    
    const startTime = new Date(now);
    startTime.setHours(startHour, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 3600000);
    
    // Check for conflicts across all sessions on same day
    const hasConflict = todayPeriods.some(period => {
      const periodStart = period.startTime.getTime();
      const periodEnd = period.endTime.getTime();
      const newStart = startTime.getTime();
      const newEnd = endTime.getTime();
      
      return (
        (newStart >= periodStart && newStart < periodEnd) ||
        (newEnd > periodStart && newEnd <= periodEnd) ||
        (newStart <= periodStart && newEnd >= periodEnd)
      );
    });
    
    if (hasConflict) {
      toast({
        title: "Cannot create session",
        description: "Time slot conflicts with existing work today. Please manually adjust times.",
        variant: "destructive"
      });
      // Still create the session but user needs to adjust times
    }
    
    const newSession: WorkSession = {
      id: `session-${Date.now()}`,
      createdAt: new Date(),
      periods: [{
        id: `period-${Date.now()}`,
        startTime,
        endTime,
        duration: 3600
      }],
      parts: [],
      description: ''
    };
    
    setSessions(prev => [...prev, newSession]);
    
    toast({
      title: "Session created",
      description: hasConflict 
        ? "Session added with time conflict - please adjust times"
        : `New session: ${formatTime(startTime)} - ${formatTime(endTime)}`
    });
  };

  const handleAddPart = (sessionId: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const newPart: Part = {
          name: 'New Part',
          quantity: 1,
          price: 0
        };
        
        return {
          ...session,
          parts: [...(session.parts || []), newPart]
        };
      }
      return session;
    }));
  };
  const handleSave = () => {
    // Filter out sessions with no periods, parts, or description
    const validSessions = sessions.filter(s => 
      s.periods.length > 0 || 
      (s.parts && s.parts.length > 0) || 
      (s.description && s.description.trim().length > 0)
    );

    // Recalculate total time
    const totalTime = validSessions.reduce((total, session) => {
      return total + session.periods.reduce((sum, p) => sum + p.duration, 0);
    }, 0);
    const updatedTask = {
      ...task,
      sessions: validSessions,
      totalTime
    };
    onSave(updatedTask);
    toast({
      title: "Task updated",
      description: "Changes saved successfully"
    });
    onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full m-0 p-0 rounded-none max-w-none max-h-none flex flex-col">
        <DialogHeader className={`px-4 py-3 border-b ${colorScheme.gradient}`}>
          <DialogTitle>Edit</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {sessions.map((session, sessionIndex) => {
            // Get unique color scheme for THIS session
            const sessionColorScheme = getSessionColorScheme(session.id);
            
            // Get session date with robust validation and fallback
            let sessionDate: Date;
            if (session.periods.length > 0 && session.periods[0].startTime) {
              sessionDate = session.periods[0].startTime;
            } else if (session.createdAt) {
              sessionDate = session.createdAt;
            } else {
              sessionDate = new Date(); // Fallback to current date
            }
            
            // Validate the date is valid
            const isValidDate = sessionDate instanceof Date && !isNaN(sessionDate.getTime());
            
            // If still invalid, use current date as fallback
            if (!isValidDate) {
              console.warn('Invalid session date detected, using current date as fallback');
              sessionDate = new Date();
            }
            
            const formattedDate = new Intl.DateTimeFormat('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }).format(sessionDate);
            
            return <div key={session.id} className={`${sessionColorScheme.session} border rounded p-1 space-y-1`}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Session {sessionIndex + 1}</h4>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{formattedDate}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Periods */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Work Periods:</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 gap-1"
                    onClick={() => handleAddPeriodToSession(session.id)}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="text-xs">Add Period</span>
                  </Button>
                </div>
                
                {session.periods.map((period, periodIndex) => <div key={period.id} className={`${sessionColorScheme.period} border p-1 rounded space-y-1`}>
                    <div className="flex items-center justify-between px-1 py-0.5">
                      <div className="flex items-center gap-1">
                        <div className="font-medium text-xs">Period {periodIndex + 1}: {formatDuration(period.duration)}</div>
                        <Popover open={editingPeriodDate?.sessionId === session.id && editingPeriodDate?.periodId === period.id}
                                 onOpenChange={(open) => !open && setEditingPeriodDate(null)}>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 px-1 text-[10px]"
                              onClick={() => setEditingPeriodDate({ sessionId: session.id, periodId: period.id })}
                            >
                              {!isNaN(period.startTime.getTime()) 
                                ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(period.startTime)
                                : 'Invalid Date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={period.startTime}
                              onSelect={(date) => {
                                if (date) {
                                  handleChangePeriodDate(session.id, period.id, date);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeletePeriod(session.id, period.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 px-1">
                      <div>
                        <Label className="text-[10px]">Start Time</Label>
                        <Input 
                          type="time" 
                          value={
                            editingPeriod?.sessionId === session.id && 
                            editingPeriod?.periodId === period.id && 
                            editingPeriod?.field === 'startTime'
                              ? editingPeriod.value
                              : formatTimeForInput(period.startTime)
                          }
                          onChange={e => handlePeriodTimeChange(session.id, period.id, 'startTime', e.target.value)}
                          onBlur={handlePeriodTimeBlur}
                          className="h-8 text-xs" 
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">End Time</Label>
                        <Input 
                          type="time" 
                          value={
                            editingPeriod?.sessionId === session.id && 
                            editingPeriod?.periodId === period.id && 
                            editingPeriod?.field === 'endTime'
                              ? editingPeriod.value
                              : formatTimeForInput(period.endTime)
                          }
                          onChange={e => handlePeriodTimeChange(session.id, period.id, 'endTime', e.target.value)}
                          onBlur={handlePeriodTimeBlur}
                          className="h-8 text-xs" 
                        />
                      </div>
                    </div>
                  </div>)}
              </div>

              {/* Parts */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Parts:</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 gap-1"
                    onClick={() => handleAddPart(session.id)}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="text-xs">Add Part</span>
                  </Button>
                </div>
                
                {(session.parts || []).map((part, partIndex) => <div key={partIndex} className={`${sessionColorScheme.part} border p-1 rounded space-y-1`}>
                    <div className="flex items-center justify-between">
                      <Input 
                        type="text" 
                        value={part.name} 
                        onChange={e => {
                          setSessions(prev => prev.map(s => {
                            if (s.id === session.id) {
                              const updatedParts = [...(s.parts || [])];
                              updatedParts[partIndex] = { ...updatedParts[partIndex], name: e.target.value };
                              return { ...s, parts: updatedParts };
                            }
                            return s;
                          }));
                        }}
                        className="h-6 text-xs flex-1"
                        placeholder="Part name"
                      />
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => handleDeletePart(session.id, partIndex)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <Label className="text-[10px]">Quantity</Label>
                        <Input type="number" min="1" value={part.quantity} onChange={e => handleUpdatePartQuantity(session.id, partIndex, parseInt(e.target.value) || 1)} className="h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Price</Label>
                        <Input type="number" min="0" step="0.01" value={part.price} onChange={e => handleUpdatePartPrice(session.id, partIndex, parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px]">Description (optional)</Label>
                      <Input 
                        type="text" 
                        value={part.description || ''} 
                        onChange={e => {
                          setSessions(prev => prev.map(s => {
                            if (s.id === session.id) {
                              const updatedParts = [...(s.parts || [])];
                              updatedParts[partIndex] = { 
                                ...updatedParts[partIndex], 
                                description: e.target.value 
                              };
                              return { ...s, parts: updatedParts };
                            }
                            return s;
                          }));
                        }}
                        className="h-7 text-xs"
                        placeholder="Optional part description"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total: {formatCurrency(part.price * part.quantity)}
                    </div>
                  </div>)}
              </div>

              {/* Work Description */}
              <div className="space-y-1">
                <Label className="text-xs">Work Description:</Label>
                <Textarea
                  value={session.description || ''}
                  onChange={(e) => {
                    setSessions(prev => prev.map(s => {
                      if (s.id === session.id) {
                        return { ...s, description: e.target.value };
                      }
                      return s;
                    }));
                  }}
                  placeholder="Describe the work performed..."
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>
            </div>;
          })}
        </div>

        <DialogFooter className="px-4 py-3 border-t bg-card/80 backdrop-blur-sm flex gap-2">
          {onDelete && !showDeleteConfirm && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          {onDelete && showDeleteConfirm && (
            <div className="flex gap-2 items-center">
              <span className="text-xs text-destructive">Delete task?</span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  onDelete(task.id);
                  onOpenChange(false);
                }}
              >
                Yes
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                No
              </Button>
            </div>
          )}
          <Button 
            variant="secondary" 
            onClick={handleAddNewSession} 
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Session
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};
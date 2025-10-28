# Auto Task Tracker - Technical Documentation

## Overview

Auto Task Tracker is a comprehensive time-tracking and billing application designed for automotive repair shops. It allows mechanics and shop owners to track work sessions, manage clients and vehicles, and generate professional PDF bills.

## Architecture

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks with custom storage hooks
- **Data Persistence**: IndexedDB (with localStorage migration support)
- **PDF Generation**: jsPDF
- **Build Tool**: Vite

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── TaskCard.tsx    # Main task display and management
│   ├── AddClientDialog.tsx
│   ├── AddVehicleDialog.tsx
│   ├── CompleteWorkDialog.tsx
│   ├── EditTaskDialog.tsx
│   ├── EditVehicleDialog.tsx
│   ├── ManageClientsDialog.tsx
│   └── SettingsDialog.tsx
├── hooks/              # Custom React hooks
│   ├── useLocalStorage.ts
│   └── useStorage.ts
├── lib/                # Utility functions and services
│   ├── localStorage.ts
│   ├── indexedDB.ts
│   ├── migrationHelper.ts
│   ├── formatTime.ts
│   ├── sessionColors.ts
│   ├── vehicleColors.ts
│   ├── vinDecoder.ts
│   └── xmlConverter.ts
├── pages/              # Page components
│   ├── Index.tsx       # Main dashboard
│   └── NotFound.tsx
├── services/           # External service integrations
│   └── contactsService.ts
└── types/              # TypeScript type definitions
    └── index.ts
```

## Data Models

### Client
```typescript
interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  hourlyRate?: number;
  createdAt: Date;
}
```

### Vehicle
```typescript
interface Vehicle {
  id: string;
  clientId: string;
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
}
```

### Task
```typescript
interface Task {
  id: string;
  clientId: string;
  vehicleId: string;
  customerName: string;
  carVin: string;
  status: TaskStatus; // 'pending' | 'in-progress' | 'paused' | 'completed' | 'billed' | 'paid'
  totalTime: number; // seconds
  needsFollowUp: boolean;
  sessions: WorkSession[];
  createdAt: Date;
  startTime?: Date;
  activeSessionId?: string;
}
```

### WorkSession
```typescript
interface WorkSession {
  id: string;
  createdAt: Date;
  completedAt?: Date;
  description?: string;
  periods: WorkPeriod[];
  parts: Part[];
}
```

### WorkPeriod
```typescript
interface WorkPeriod {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
}
```

### Part
```typescript
interface Part {
  name: string;
  quantity: number;
  price: number;
  description?: string;
}
```

## Component Interactions

### Main Dashboard (Index.tsx)

The dashboard is the central hub of the application and orchestrates all major interactions:

1. **Data Fetching**: Uses custom hooks (`useClients`, `useVehicles`, `useTasks`, `useSettings`) to fetch data from IndexedDB
2. **Task Organization**: Groups tasks by status (active/completed) and by client
3. **Dialog Management**: Controls visibility of various modal dialogs
4. **Event Coordination**: Handles all CRUD operations and timer events

### TaskCard Component

The TaskCard is the primary UI component for displaying and interacting with tasks:

**Key Features:**
- **Timer Management**: Start, pause, resume, and stop work sessions
- **Session Display**: Shows all work sessions with color-coded periods
- **Part Management**: Add, edit, and remove parts within sessions
- **PDF Generation**: Creates professional bills with company branding
- **Status Management**: Update task status (completed, billed, paid)

**Interactions:**
- Receives task data and callbacks from parent (Index.tsx)
- Emits events for timer actions, status updates, and deletions
- Opens CompleteWorkDialog when completing work
- Opens EditTaskDialog for editing session details
- Generates PDF bills using jsPDF library

### Dialog Components

#### AddClientDialog
- **Purpose**: Create new clients
- **Data Flow**: Collects client information → validates → calls `onAddClient` → updates IndexedDB
- **Features**: Contact import from device, form validation

#### AddVehicleDialog
- **Purpose**: Create new vehicles and optionally new clients
- **Data Flow**: Collects VIN and client info → decodes VIN → calls `onAddVehicle` → creates task → updates IndexedDB
- **Features**: VIN scanning, automatic VIN decoding, client creation

#### CompleteWorkDialog
- **Purpose**: Add session details when completing a work period
- **Data Flow**: Collects description and parts → calls `onComplete` → updates task session
- **Features**: Part management, description input

#### EditTaskDialog
- **Purpose**: Edit existing work sessions
- **Data Flow**: Loads session data → allows editing → updates task → saves to IndexedDB
- **Features**: Edit descriptions, add/remove/edit parts

#### EditVehicleDialog
- **Purpose**: Update vehicle information
- **Data Flow**: Loads vehicle data → allows editing → calls `onUpdate` → updates IndexedDB
- **Features**: All vehicle field editing

#### ManageClientsDialog
- **Purpose**: View and manage all clients
- **Data Flow**: Displays client list → allows editing/deletion → updates IndexedDB
- **Features**: Client editing, deletion with confirmation

#### SettingsDialog
- **Purpose**: Configure app settings
- **Data Flow**: Loads settings → allows editing → saves to IndexedDB
- **Features**: Default hourly rate configuration

## Data Flow

### Storage Architecture

The application uses a two-tier storage system:

1. **IndexedDB (Primary)**: Modern, performant storage for all application data
2. **localStorage (Legacy)**: Original storage system, now used only for migration

### Storage Hooks

#### useStorage Hook
- **Purpose**: Provides reactive state management for IndexedDB data
- **Pattern**: Custom hook that wraps IndexedDB operations with React state
- **Features**: Automatic re-rendering on data changes, consistent API across all data types

```typescript
const [clients, setClients] = useClients();
const [vehicles, setVehicles] = useVehicles();
const [tasks, setTasks] = useTasks();
const [settings, setSettings] = useSettings();
```

### Migration System

**Process:**
1. On app load, `migrationHelper.ts` checks if migration is needed
2. If localStorage contains data and IndexedDB is empty, migration runs
3. Data is copied from localStorage to IndexedDB
4. Migration flag is set to prevent duplicate migrations
5. Page reloads to initialize with IndexedDB data

## Key Workflows

### 1. Adding a New Vehicle and Starting Work

```
User clicks "Add Vehicle" 
  → AddVehicleDialog opens
  → User scans/enters VIN
  → VIN decoded to get make/model/year
  → User selects/creates client
  → New vehicle created in IndexedDB
  → New task automatically created
  → Task appears in Active Tasks
  → User can immediately start timer
```

### 2. Timer Workflow

```
User clicks "Start"
  → New WorkSession created
  → New WorkPeriod started
  → Task status → "in-progress"
  → Timer displays elapsed time
  → Auto-pause other running tasks

User clicks "Pause"
  → Current WorkPeriod ended
  → Task status → "paused"
  → Timer stops

User clicks "Resume"
  → New WorkPeriod started in same session
  → Task status → "in-progress"
  → Timer continues

User clicks "Stop"
  → Current WorkPeriod ended
  → CompleteWorkDialog opens
  → User adds description and parts
  → Session marked complete
  → Task status → "completed"
```

### 3. Billing Workflow

```
Task completed
  → User clicks "Mark as Billed"
  → PDF generation starts
  → Bill includes:
    - Client information
    - Vehicle details
    - All work sessions with dates/times
    - Parts list with quantities and prices
    - Labor hours and rate
    - Total calculations
  → PDF downloaded
  → Task status → "billed"

User clicks "Mark as Paid"
  → Task status → "paid"
  → Task moves to Completed tab
```

### 4. Auto-Pause Mechanism

When starting a timer on any task:
```
1. Check all other tasks
2. Find any task with status "in-progress"
3. For each running task:
   - End current work period
   - Set status to "paused"
   - Update task in IndexedDB
4. Start new task timer
```

This ensures only one task is running at a time.

## PDF Bill Generation

### Layout Structure

The PDF bill follows a professional invoice format:

**Header Section:**
- Company name and logo background
- "BILL / INVOICE" title
- Bill number and date

**Client Section:**
- "Bill to:" label
- Client name
- Vehicle information (Year Make Model + VIN)
- Billed date

**Work Sessions Table:**
- Columns: Session Date, Description, Duration, Rate, Amount
- Each session shows work periods
- Parts listed under session description
- Subtotals for labor and parts

**Summary Section:**
- Total labor hours
- Total parts cost
- Grand total

**Footer:**
- Thank you message

### PDF Generation Flow

```typescript
1. Gather data (client, vehicle, task, settings)
2. Initialize jsPDF with custom font
3. Add background image (optional)
4. Render header with company info
5. Render client information
6. Build work sessions table
7. Calculate totals
8. Render summary
9. Add footer
10. Save PDF with filename: bill-{clientName}-{timestamp}.pdf
```

## Color System

### Session Colors
Each work session is assigned a unique color from a predefined palette to visually distinguish sessions within the same task. Colors are assigned sequentially as new sessions are created.

### Vehicle Colors
Visual representation uses color coding for quick identification in the UI.

## Time Formatting

Time is stored in seconds and formatted for display using `formatTime.ts`:
- Displays in HH:MM:SS format
- Handles hours, minutes, and seconds
- Used in timer displays and PDF bills

## Error Handling

### Storage Errors
- IndexedDB operations wrapped in try-catch
- Fallback to error toasts for user notification
- Migration errors logged and displayed

### Data Validation
- Client name required
- VIN format validation
- Numeric validation for rates and prices
- Date validation for work periods

## Performance Considerations

### IndexedDB Benefits
- Asynchronous operations don't block UI
- Can store large amounts of data
- Better performance than localStorage
- Structured data with indexes

### React Optimization
- Custom hooks prevent unnecessary re-renders
- Dialog lazy loading via state management
- Efficient task grouping algorithms

## Future Enhancements

Potential areas for expansion:
- Cloud sync/backup
- Multi-user support with authentication
- Advanced reporting and analytics
- Inventory management for parts
- Email billing integration
- Mobile app with offline support
- Payment processing integration
- Customer portal

## Development Guidelines

### Adding New Features
1. Define TypeScript types in `src/types/index.ts`
2. Create storage functions if needed in `src/lib/indexedDB.ts`
3. Build UI components in `src/components/`
4. Add business logic to `src/pages/Index.tsx`
5. Update this documentation

### Best Practices
- Always use TypeScript types
- Handle dates properly (IndexedDB stores as Date objects)
- Use toast notifications for user feedback
- Maintain separation of concerns
- Follow React hooks best practices
- Use semantic UI components from shadcn/ui

## Troubleshooting

### Data Not Persisting
- Check browser IndexedDB support
- Verify IndexedDB not disabled in private mode
- Check browser storage quotas

### Migration Issues
- Clear both localStorage and IndexedDB
- Refresh page
- Check migration completion flag

### Timer Issues
- Verify Date objects are properly stored
- Check work period calculations
- Ensure proper pause/resume logic

## License and Credits

Built with React, TypeScript, Tailwind CSS, and shadcn/ui components.
PDF generation powered by jsPDF.

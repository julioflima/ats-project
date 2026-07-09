# Component Conventions

## File Structure

**One component per file.** Never define multiple components in the same file.

### Route-specific components → `-components/`

Components that only make sense for a specific route must live in a `-components/` directory next to that route file — not in the global `src/components/`. TanStack Router ignores directories prefixed with `-`, so the router is not affected.

```
src/routes/_main/vendor/.../framework-assessments/
├── index.tsx                 ← route file
├── -components/              ← ignored by router
│   ├── index.ts              ← barrel export
│   ├── checks-table.tsx      ← one component per file
│   ├── check-detail-panel.tsx
│   └── empty-state.tsx
```

Import from the barrel: `import { ChecksTable } from './-components'`

### Shared/reusable components → `src/components/`

Only promote a component to `src/components/` when it is used by more than one route. Components in `src/components/` must be **pure/presentational** — they receive data and callbacks via props and do **not** fetch data themselves.

### Screen components → `src/screens/`

Components that **fetch data** (use hooks like `useQuery`, `useMutation`, etc.) and are **reused across multiple routes** (not declared inside `/routes`) must live in `src/screens/`. This separates data-fetching "smart" components from pure UI components.

```
src/screens/
├── check-detail-panel.tsx   ← fetches via mutations, used by dashboard + framework assessments
```

## Naming

- **File names**: `kebab-case.tsx` — always. Never `PascalCase.tsx`.
- **Component names**: `<PascalCase />` inside the file.
- **Utility/helper files** (no JSX): `kebab-case.ts`.

## Event Handlers & Callbacks

**Never use anonymous arrow functions as props inside JSX.** Every handler must be a named `useCallback` (or a named function defined inside a `useCallback` render function). Anonymous arrows are recreated on every render, causing unnecessary re-renders of children.

```tsx
// ✗ wrong — anonymous arrow recreated every render
<Button onClick={() => doSomething()} />

// ✓ correct — stable reference
const handleClick = useCallback(() => {
    doSomething()
}, [])
<Button onClick={handleClick} />
```

For `Controller` render props that need context (e.g. `field`), use **chained `useCallback`s**: one stable outer callback that takes the context and returns the actual handler, plus a separate render callback that wires them together.

```tsx
// 1. Outer handler: takes field, returns the real event handler.
//    Empty deps — closes over nothing from the component.
const handleUrlBlur = useCallback(
    (field: ControllerRenderProps<FormValues, 'url'>) =>
        (e: FocusEvent<HTMLInputElement>) => {
            const val = e.target.value
            if (val.startsWith(PREFIX)) {
                field.onChange(val.slice(PREFIX.length))
            }
            field.onBlur()
        },
    [],
)

// 2. Render callback: calls the outer handler with field.
const renderUrlInput = useCallback(
    ({ field }: { field: ControllerRenderProps<FormValues, 'url'> }) => (
        <Input {...field} onBlur={handleUrlBlur(field)} />
    ),
    [handleUrlBlur, /* other deps */],
)

<Controller name="url" control={control} render={renderUrlInput} />
```

This keeps the handler logic isolated and stable while the render callback only re-creates when its display deps change.

## Filters & Search

### Radix Select — reset to placeholder

Radix `<Select>` does not reset to its placeholder when the controlled `value` clears (e.g. when the user picks "All"). Force a remount by adding a `key` that includes the current value:

```tsx
<Select
    key={`status-${statusFilter}`}
    value={statusFilter || undefined}
    onValueChange={onStatusChange}
>
    ...
    <SelectItem value="all">{t('common.all')}</SelectItem>
    ...
</Select>
```

When the parent sets the filter to `''` / `null`, the `key` changes and the Select remounts, showing the placeholder again.

### Search inputs — ALL searches MUST be debounced

**Every search input that triggers a server request or URL update must use `useDebouncedCallback` from `use-debounce` (500 ms).** Never fire a query on every keystroke — always debounce.

Debounce belongs in the **parent component** that owns the query state — not inside a presentational filter component. The filter component receives `searchValue` and an `onSearchChange: (value: string) => void` prop; the parent manages both local display state and the debounced URL/query update:

```tsx
// parent
const [localSearch, setLocalSearch] = useState(filters.search)
const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setFilters({ search: value || null })
}, 500)
const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value)
    debouncedSetSearch(value)
}, [debouncedSetSearch])

// passed to filter component
<SomeFilters searchValue={localSearch} onSearchChange={handleSearchChange} />
```

If a filter component manages its **own** internal debounce (like `ChecksFilters`), its `onSearchChange` prop receives the already-debounced string value — never a `React.ChangeEvent`.

## Forms

Every form must use **react-hook-form** with **zod** validation. No exceptions.

```tsx
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Define schema inside useMemo so error messages can use t()
const schema = useMemo(
    () =>
        z.object({
            name: z.string().min(1, t('validation.name_required')),
        }),
    [t],
)

type FormValues = z.infer<typeof schema>

const { register, control, handleSubmit, setError, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })
```

### Rules

- **All fields must be validated** — required fields, format, min/max, etc.
- **Native inputs** (`<Input>`, `<Textarea>`): use `{...register('field')}`.
- **Custom inputs** (`<Select>`, `<Checkbox>`, etc.): use `<Controller>` with `onValueChange={field.onChange}` and `value={field.value}`.
- **Error display**: show `<p className="text-xs text-destructive">{errors.field.message}</p>` below the field; add `className={cn(errors.field && 'text-destructive')}` to the `<Label>`.
- **Server errors**: use `toast.error(resolveApiError(data?.errorCode, data?.errors, t))` — never inline error strings.
- **Zod v4**: use `z.enum([...])` instead of deprecated `z.nativeEnum()`. For URL validation use `.refine((val) => { try { new URL(val); return true } catch { return false } }, { message })` instead of deprecated `.url(string)`.
- **Submit button**: pass `disabled={isPending}` when a mutation is in flight.

### Toasts & API error feedback

Use `toast` from `@/components/ui/sonner` for mutation feedback. Use `resolveApiError` from `@/lib/api-error` to translate error codes.

```tsx
import { toast } from '@/components/ui/sonner'
import { resolveApiError } from '@/lib/api-error'

onSuccess: (data) => {
    if (data?.success) {
        toast.success(t('feature.add_success'))
        onOpenChange(false)
    } else {
        toast.error(resolveApiError(data?.errorCode, data?.errors, t))
    }
},
```

`resolveApiError` priority: **translated error code** (`common.error_codes.*`) → **server error messages** → **`common.error`** fallback. All known codes are already mapped. Add new ones to `common.error_codes` in `en.json`.

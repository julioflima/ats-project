# Schema Architecture

All form validation schemas live in `src/schemas/`. They are defined once and reused across every component that shares the same form shape.

## Source of Truth

`src/schemas/` → imported directly into form components — no inline `useMemo` schemas.

## Structure

```
src/schemas/
├── fields.ts              ← atomic reusable field schemas
├── sign-in.ts
├── sign-up.ts
├── create-account.ts
├── invite-team-member.ts
├── organization.ts
├── vendor.ts              ← vendorSchema, customVendorAddSchema, customVendorEditSchema
└── tolerate-issue.ts
```

## `fields.ts` — Atomic Fields

Reusable primitives composed into form schemas:

```ts
import {
  emailField,
  optionalUrlField,
  passwordField,
  urlField,
  vendorBaseFields,
} from '@/schemas/fields'
```

| Export             | Type          | Used by                         |
| ------------------ | ------------- | ------------------------------- |
| `emailField`       | `ZodString`   | sign-in, create-account, invite |
| `passwordField`    | `ZodString`   | sign-in                         |
| `urlField`         | `ZodString`   | vendor add/edit (required URL)  |
| `optionalUrlField` | `ZodOptional` | organization (website)          |
| `vendorBaseFields` | plain object  | all vendor schemas (spread in)  |

## Rules

1. **No inline schemas** — never define `z.object({...})` inside a component. Always import from `src/schemas/`.
2. **No `useMemo`** — schemas use `i18n.t()` at module scope (English-only app, initialized before components mount).
3. **camelCase field names** — form field names match GraphQL/API field names. No `snake_case` keys in schemas or form state.
4. **One file per entity** — `organization.ts`, `vendor.ts`, etc. Group related schemas in the same file when they share fields.
5. **Export `FormValues` type** — every schema file exports both the schema and the inferred type:
   ```ts
   export const signInSchema = z.object({ ... })
   export type SignInFormValues = z.infer<typeof signInSchema>
   ```
6. **Use separate imports** for type and value:
   ```ts
   import type { SignInFormValues } from '@/schemas/sign-in'

   import { signInSchema } from '@/schemas/sign-in'
   ```

## Usage in Components

```tsx
import type { OrganizationFormValues } from '@/schemas/organization'

import { organizationSchema } from '@/schemas/organization'

const { register, handleSubmit } = useForm<OrganizationFormValues>({
  resolver: zodResolver(organizationSchema),
})
```

## Adding a New Schema

1. Create `src/schemas/my-entity.ts`
2. Import atomic fields from `./fields` where applicable
3. Export `myEntitySchema` and `MyEntityFormValues`
4. Import in the component — no inline schema, no `useMemo`

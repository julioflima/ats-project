# Enum Architecture

All enums are defined in the **GraphQL schema** and auto-generated as TypeScript enums. The frontend NEVER defines or modifies status types.

## Why TypeScript Enums

TypeScript enums serve dual purposes:

1. **Type safety** — usable as type annotations (`status: FrameworkAlignmentStatus`)
2. **Runtime values** — usable for comparisons, iteration, and as `Record` keys

```ts
// Generated from GraphQL schema
export enum FrameworkAlignmentStatus {
  Aligned = 'aligned',
  InProgress = 'in_progress',
  ...
}
```

## Source of Truth

`src/graphql/mock/schema.graphql` → `yarn gql` → `src/graphql/graphql.ts`

Import via: `import { FrameworkAlignmentStatus } from '@/graphql/graphql'`

## Usage

```tsx
import { FrameworkAlignmentStatus, IssueSeverity } from '@/graphql/graphql'

// Type annotation
interface Props { status: FrameworkAlignmentStatus }

// Comparison
if (status === FrameworkAlignmentStatus.Aligned) { ... }

// Iteration
Object.values(FrameworkAlignmentStatus).forEach(status => { ... })

// Record key
const labels: Record<FrameworkAlignmentStatus, string> = {
    [FrameworkAlignmentStatus.Aligned]: 'Aligned',
    ...
}
```

## Rules

1. **Never define enums in the frontend** — always in GraphQL schema
2. **Single import** — `@/graphql/graphql` for both type and value use
3. **Use enum members** — `FrameworkAlignmentStatus.Aligned`, never the string `'aligned'`
4. **Type guards** live in `src/constants/enums.ts`

## Available Enums

| Enum                           | Members                                                                     |
| ------------------------------ | --------------------------------------------------------------------------- |
| `AssessmentResult`             | `Conditional`, `Failed`, `Passed`                                           |
| `AssessmentStatus`             | `Completed`, `InProgress`, `NotStarted`                                     |
| `BusinessCriticality`          | `Critical`, `High`, `Low`                                                   |
| `CheckStatus`                  | `NoIssue`, `Open`, `Resolved`                                               |
| `ComplianceStatusType`         | `Badge`, `Compliant`, `NotApplicable`, `NotCompliant`, `PartiallyCompliant` |
| `FrameworkAlignmentStatus`     | `Aligned`, `Ignored`, `InProgress`, `NotAligned`                            |
| `FrameworkQualificationStatus` | `InProgress`, `NotQualified`, `Pending`, `Qualified`                        |
| `IssueSeverity`                | `Critical`, `High`, `Low`, `Medium`                                         |
| `IssueStatus`                  | `InProgress`, `Open`, `Resolved`                                            |
| `Status`                       | `Active`, `Inactive`, `NeedsReview`, `UnderAssessment`                      |
| `SensitiveDataEnum`            | `Critical`, `High`, `Low`, `Moderate`                                       |
| `VendorStatus`                 | `InProgress`, `NotInitiated`, `Reviewed`                                    |
| `VettingStepStatus`            | `Completed`, `InProgress`, `NotStarted`                                     |
| `FrameworkApplicabilityEnum`   | `Required`, `Recommended`, `WorthConsidering`, `GapToClose`, `NotApplicable` |
| `ComplianceProfileStatusEnum`  | `NotStarted`, `InProgress`, `Completed`, `Failed`                           |

## Adding a New Enum

1. Add to `src/graphql/mock/schema.graphql`
2. Run `yarn gql`
3. Add i18n translations — see `.claude/rules/i18n.md`

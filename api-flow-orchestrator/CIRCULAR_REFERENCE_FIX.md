# Circular Reference Fix

## Problem
The backend server was experiencing a `StackOverflowError` due to infinite JSON serialization loops caused by circular references in JPA entity relationships.

## Root Cause
The following bidirectional relationships created circular references:
1. `ApiGroup` ↔ `ApiNode` (OneToMany/ManyToOne)
2. `ApiGroup` ↔ `HookVariable` (OneToMany/ManyToOne)
3. `ApiGroup` ↔ `AuthProfile` (OneToOne/OneToOne)
4. `ExecutionRun` ↔ `ApiRunResult` (OneToMany/ManyToOne)

When Jackson tried to serialize these entities to JSON, it would infinitely loop between parent and child entities.

## Solution
Added Jackson annotations to break the circular references:

### Parent Entities (use `@JsonManagedReference`)
- **ApiGroup.java**: Added `@JsonManagedReference` to:
  - `apiNodes` collection
  - `hookVariables` collection
  - `authProfile` reference

- **ExecutionRun.java**: Added `@JsonManagedReference` to:
  - `apiRunResults` collection

### Child Entities (use `@JsonBackReference`)
- **ApiNode.java**: Added `@JsonBackReference` to `apiGroup` field
- **HookVariable.java**: Added `@JsonBackReference` to `apiGroup` field
- **AuthProfile.java**: Added `@JsonBackReference` to `apiGroup` field
- **ApiRunResult.java**: Added `@JsonBackReference` to `executionRun` field

## How It Works
- `@JsonManagedReference`: Forward part of reference (serialized normally)
- `@JsonBackReference`: Back part of reference (omitted from serialization)

This ensures that when serializing an `ApiGroup`, it includes its `apiNodes`, but when serializing each `ApiNode`, it doesn't include the parent `ApiGroup`, thus breaking the cycle.

## Files Modified
1. `backend/src/main/java/com/apiflow/model/ApiGroup.java`
2. `backend/src/main/java/com/apiflow/model/ApiNode.java`
3. `backend/src/main/java/com/apiflow/model/HookVariable.java`
4. `backend/src/main/java/com/apiflow/model/AuthProfile.java`
5. `backend/src/main/java/com/apiflow/model/ExecutionRun.java`
6. `backend/src/main/java/com/apiflow/model/ApiRunResult.java`

## Verification
Compilation successful with `mvn clean compile` - no errors.

## Next Steps
The backend server can now be started without the StackOverflowError. The API endpoints will properly serialize entities to JSON without infinite loops.
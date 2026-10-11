## Summary

Briefly describe what this PR does.

Example:
Adds the initial `placements` table and related migration.

## Changes

- Added ...
- Updated ...
- Removed ...

## Why

Explain why this change is needed.

Example:
Placements are the central relationship between a foster and a pet, so this schema is required before building weekly updates.

## Testing

Describe how you tested the changes.

- [ ] Ran `npm run lint`
- [ ] Ran `npx tsc --noEmit`
- [ ] Ran `npm run build`
- [ ] Tested manually

Additional testing notes:

## Screenshots

Include screenshots if this PR changes the UI.

If there are no UI changes, write:

N/A

## Database Changes

- [ ] No database changes
- [ ] Includes a new migration
- [ ] Modifies an existing schema

If applicable, describe the migration:

## Environment Variables

- [ ] No new environment variables
- [ ] New environment variables added to `.env.example`

List any new variables:

## Related Issue / Task

Closes #

or

Related to:

## Notes for Reviewer

Anything the reviewer should pay particular attention to.

## Checklist

- [ ] My branch is up to date with `main`
- [ ] I did not commit secrets or `.env` files
- [ ] I kept the PR focused on one task
- [ ] I added/updated types where needed
- [ ] I added a migration for schema changes
- [ ] I did not put business logic directly in route handlers
- [ ] I tested my changes
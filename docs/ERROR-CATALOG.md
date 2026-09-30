# Error Catalog

All errors use:

```json
{"error":{"code":"VALIDATION_ERROR","message":"Readable message","details":[]}}
```

`details` contains `{field,reason}` entries and never secrets. Codes map to HTTP status as follows:

| Code | HTTP | Meaning |
|---|---:|---|
| VALIDATION_ERROR | 400 | Malformed or missing input |
| INVALID_AMOUNT | 400 | Amount is negative, zero where prohibited, or exceeds precision |
| INVALID_DATE | 400 | Invalid date/month |
| CATEGORY_TYPE_MISMATCH | 400 | Transaction/allocation type does not match category |
| ALLOCATION_EXCEEDS_AVAILABLE | 400 | Expense allocations plus saving exceed available planned money |
| DUPLICATE_MONTHLY_PLAN | 409 | Plan already exists when creation is requested |
| INVALID_CREDENTIALS | 401 | Generic login failure |
| UNAUTHORIZED | 401 | No valid session |
| FORBIDDEN | 403 | Authenticated user lacks access |
| OWNERSHIP_VIOLATION | 403 | Referenced record belongs to another user; may be mapped to FORBIDDEN externally |
| NOT_FOUND | 404 | Resource does not exist |
| EMAIL_ALREADY_EXISTS | 409 | Normalized email is already registered |
| WALLET_ARCHIVED | 409 | Archived wallet cannot receive new transactions |
| CATEGORY_ARCHIVED | 409 | Archived category cannot receive new transactions/allocations |
| RATE_LIMITED | 429 | Login/request rate limit exceeded |
| INTERNAL_ERROR | 500 | Unexpected server failure; no internals exposed |

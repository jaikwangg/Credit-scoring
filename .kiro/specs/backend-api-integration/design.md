# Design Document: Backend API Integration

## Overview

This design document outlines the architecture for adding backend API capabilities to the Next.js credit scoring application. The system will transition from client-side-only processing to a server-side API architecture using Next.js 13+ App Router conventions.

The API will expose a POST endpoint at `/api/credit/calculate` that accepts user financial data (CreditInput), validates it, processes it through the existing scoring algorithm, and returns structured results (CreditScore). This enables server-side processing, better security, and prepares the application for future external service integrations.

Key design principles:
- Reuse existing scoring logic without modification
- Maintain type safety throughout the request/response pipeline
- Provide consistent, predictable error handling
- Follow Next.js App Router best practices
- Separate concerns between validation, processing, and response formatting

## Architecture

### High-Level Architecture

The API follows a layered architecture pattern:

```
Client (Browser)
    ↓ HTTP POST /api/credit/calculate
API Handler (route.ts)
    ↓ validates request
Validator (validation.ts)
    ↓ processes data
Credit Processor (scoring.ts)
    ↓ formats response
Response Formatter (response.ts)
    ↓ HTTP 200/400/500
Client (Browser)
```

### Request Flow

1. Client sends POST request with JSON body containing CreditInput
2. API Handler receives request and extracts body
3. Validator checks request method, content-type, and validates data schema
4. If validation fails → Error Handler formats error response (400)
5. If validation succeeds → Credit Processor calculates score
6. Response Formatter wraps result in standard success format
7. API Handler returns response to client

### Technology Stack

- Next.js 13+ App Router for API routes
- TypeScript for type safety
- Zod for runtime schema validation
- Existing scoring.ts algorithm (no changes)
- Native Next.js error handling

## Components and Interfaces

### 1. API Handler (`app/api/credit/calculate/route.ts`)

The main entry point for the credit calculation API.

**Responsibilities:**
- Handle POST requests to `/api/credit/calculate`
- Coordinate validation, processing, and response formatting
- Catch and handle unexpected errors
- Set appropriate HTTP status codes and headers

**Interface:**
```typescript
export async function POST(request: Request): Promise<Response>
```

**Implementation approach:**
- Use Next.js App Router route handler convention
- Extract JSON body from request
- Delegate validation to Validator module
- Delegate processing to existing scoreCredit function
- Delegate response formatting to Response Formatter
- Wrap in try-catch for unexpected errors

### 2. Validator (`app/api/lib/validation.ts`)

Validates incoming request data against the CreditInput schema.

**Responsibilities:**
- Define Zod schema matching CreditInput interface
- Validate all required fields are present
- Validate field types and formats
- Validate enum values (Sex, Marital_status, Coapplicant)
- Validate numeric string formats
- Return detailed validation errors

**Interface:**
```typescript
export interface ValidationResult {
  success: boolean;
  data?: CreditInput;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCreditInput(data: unknown): ValidationResult
```

**Validation Rules:**
- Sex: required, must be "Male", "Female", or "Other"
- Occupation: required, non-empty string
- Salary: required, numeric string format (e.g., "50000" or "50000.00")
- Marital_status: required, must be "Single", "Married", "Divorced", or "Widowed"
- credit_score: optional, if provided must be numeric string between 0-1000
- credit_grade: optional, string
- outstanding: required, numeric string format
- overdue: required, numeric string format
- loan_amount: required, numeric string format
- Coapplicant: required, must be "Yes" or "No"
- Interest_rate: required, numeric string format

**Zod Schema Design:**
```typescript
const creditInputSchema = z.object({
  Sex: z.enum(['Male', 'Female', 'Other']),
  Occupation: z.string().min(1),
  Salary: z.string().regex(/^\d+(\.\d{1,2})?$/),
  Marital_status: z.enum(['Single', 'Married', 'Divorced', 'Widowed']),
  credit_score: z.string().regex(/^\d*$/).optional().or(z.literal('')),
  credit_grade: z.string().optional(),
  outstanding: z.string().regex(/^\d+(\.\d{1,2})?$/),
  overdue: z.string().regex(/^\d+(\.\d{1,2})?$/),
  loan_amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  Coapplicant: z.enum(['Yes', 'No']),
  Interest_rate: z.string().regex(/^\d+(\.\d{1,2})?$/),
});
```

### 3. Response Formatter (`app/api/lib/response.ts`)

Formats API responses in a consistent structure.

**Responsibilities:**
- Create success response format
- Create error response format
- Set appropriate HTTP status codes
- Set Content-Type headers

**Interface:**
```typescript
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
  validationErrors?: ValidationError[];
}

export function successResponse<T>(data: T): Response
export function errorResponse(
  message: string,
  status: number,
  validationErrors?: ValidationError[]
): Response
```

**Response Formats:**

Success (200):
```json
{
  "success": true,
  "data": {
    "score": 750,
    "grade": "Good",
    "factors": [
      "Low debt-to-salary ratio indicates strong financial position",
      "No overdue payments - excellent payment history",
      "Loan amount is reasonable relative to income"
    ]
  }
}
```

Validation Error (400):
```json
{
  "success": false,
  "error": "Validation failed",
  "validationErrors": [
    {
      "field": "Salary",
      "message": "Please enter a valid number"
    }
  ]
}
```

Generic Error (400/500):
```json
{
  "success": false,
  "error": "Error message here"
}
```

### 4. Credit Processor

The existing `utils/scoring.ts` module will be reused without modification. The API handler will import and call the `scoreCredit` function directly.

**Interface (existing):**
```typescript
export function scoreCredit(input: CreditInput): CreditScore
```

### 5. Error Handler

Error handling will be integrated into the API handler and response formatter.

**Error Categories:**
- 400 Bad Request: Invalid data, missing fields, validation failures
- 405 Method Not Allowed: Non-POST requests
- 415 Unsupported Media Type: Missing or incorrect Content-Type
- 500 Internal Server Error: Unexpected errors during processing

**Error Logging:**
- All errors will be logged to console with sufficient detail
- Sensitive information will not be exposed in responses
- Stack traces only logged server-side, never sent to client

## Data Models

### Request Body (CreditInput)

Defined in `types/credit.ts` (existing):

```typescript
export interface CreditInput {
  Sex: string;              // "Male" | "Female" | "Other"
  Occupation: string;       // Any non-empty string
  Salary: string;           // Numeric string (e.g., "50000.00")
  Marital_status: string;   // "Single" | "Married" | "Divorced" | "Widowed"
  credit_score: string;     // Optional numeric string "0"-"1000"
  credit_grade: string;     // Optional, any string
  outstanding: string;      // Numeric string
  overdue: string;          // Numeric string
  loan_amount: string;      // Numeric string
  Coapplicant: string;      // "Yes" | "No"
  Interest_rate: string;    // Numeric string (percentage)
}
```

### Response Body (CreditScore)

Defined in `types/credit.ts` (existing):

```typescript
export interface CreditScore {
  score: number;      // 0-1000
  grade: string;      // "Excellent" | "Good" | "Fair" | "Poor"
  factors: string[];  // Array of 3 contributing factors
}
```

### API Response Wrappers

New types for API responses:

```typescript
// Success wrapper
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

// Error wrapper
interface ApiErrorResponse {
  success: false;
  error: string;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
}

// Union type for all responses
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Valid input produces valid score

For any valid CreditInput payload, when sent to the API endpoint, the response should contain a CreditScore with score between 0-1000, a grade string, and exactly 3 factors.

**Validates: Requirements 1.2, 1.4**

### Property 2: API algorithm matches direct function call

For any valid CreditInput, the score returned by the API should match the score returned by calling scoreCredit() directly with the same input.

**Validates: Requirements 1.3**

### Property 3: Missing required fields rejected

For any CreditInput with one or more required fields missing or empty, the API should return HTTP 400 with validation errors identifying the missing fields.

**Validates: Requirements 2.1, 2.7**

### Property 4: Invalid enum values rejected

For any CreditInput where Sex, Marital_status, or Coapplicant contains a value outside the allowed set, the API should return HTTP 400 with field-specific validation errors.

**Validates: Requirements 2.2, 2.3, 2.5**

### Property 5: Invalid numeric strings rejected

For any CreditInput where Salary, outstanding, overdue, loan_amount, or Interest_rate contains a non-numeric string, the API should return HTTP 400 with field-specific validation errors.

**Validates: Requirements 2.4**

### Property 6: Credit score range validation

For any CreditInput where credit_score is provided and is outside the range 0-1000, the API should return HTTP 400 with a validation error for the credit_score field.

**Validates: Requirements 2.6**

### Property 7: Non-POST methods rejected

For any HTTP request to /api/credit/calculate using a method other than POST (GET, PUT, DELETE, PATCH, etc.), the API should return HTTP 405.

**Validates: Requirements 3.3**

### Property 8: Error responses hide sensitive information

For any error response (400, 405, 415, 500), the response body should not contain stack traces, file paths, or internal system details.

**Validates: Requirements 3.6**

### Property 9: Success response structure

For any successful credit calculation, the response should have HTTP 200, Content-Type application/json, and a JSON body with success=true and a data field containing the CreditScore object.

**Validates: Requirements 4.1, 4.2, 7.1**

### Property 10: Error response structure

For any failed request (validation error, method error, etc.), the response should have Content-Type application/json and a JSON body with success=false and an error field containing a descriptive message.

**Validates: Requirements 4.3, 4.4, 7.1**

### Property 11: Validation error details included

For any request that fails validation, the response should include a validationErrors field containing an array of objects with field and message properties.

**Validates: Requirements 3.1, 4.5**

### Property 12: Validation schema matches TypeScript types

For any object that satisfies the CreditInput TypeScript interface with valid values, the Zod validation schema should accept it, and for any object that violates the interface constraints, the schema should reject it.

**Validates: Requirements 5.3**

## Error Handling

### Error Categories and Responses

The API implements comprehensive error handling across multiple layers:

**1. Request Method Validation (405 Method Not Allowed)**
- Triggered when: Request uses non-POST method
- Response: `{ success: false, error: "Method not allowed. Use POST." }`
- HTTP Status: 405
- Logged: Yes, with method and path

**2. Content-Type Validation (415 Unsupported Media Type)**
- Triggered when: Content-Type header is not application/json
- Response: `{ success: false, error: "Content-Type must be application/json" }`
- HTTP Status: 415
- Logged: Yes, with received content-type

**3. Request Body Parsing Errors (400 Bad Request)**
- Triggered when: JSON body is malformed or missing
- Response: `{ success: false, error: "Invalid JSON in request body" }`
- HTTP Status: 400
- Logged: Yes, with parsing error details

**4. Validation Errors (400 Bad Request)**
- Triggered when: Request body fails Zod schema validation
- Response: 
```json
{
  "success": false,
  "error": "Validation failed",
  "validationErrors": [
    { "field": "Salary", "message": "Please enter a valid number" },
    { "field": "Sex", "message": "Must be Male, Female, or Other" }
  ]
}
```
- HTTP Status: 400
- Logged: Yes, with all validation errors

**5. Unexpected Server Errors (500 Internal Server Error)**
- Triggered when: Unexpected exception during processing
- Response: `{ success: false, error: "An unexpected error occurred" }`
- HTTP Status: 500
- Logged: Yes, with full error details and stack trace (server-side only)

### Error Handling Strategy

**Layered Error Handling:**
1. Route handler validates HTTP method and content-type first
2. Request body parsing wrapped in try-catch
3. Zod validation catches schema violations
4. Processing wrapped in try-catch for unexpected errors
5. All errors formatted through Response Formatter

**Security Considerations:**
- Never expose stack traces to clients
- Never expose file paths or internal structure
- Generic messages for 500 errors
- Detailed validation errors only for 400 (safe to expose)
- All errors logged server-side with full context

**Logging Strategy:**
- Use console.error for all errors
- Include timestamp, request path, method
- Include error type and message
- Include stack trace for 500 errors
- Include validation details for 400 errors
- Never log sensitive user data (PII)

### Error Recovery

The API is stateless, so no recovery is needed. Each request is independent:
- Failed requests do not affect subsequent requests
- No cleanup required after errors
- Client can retry immediately
- No server-side state to corrupt

## Testing Strategy

### Dual Testing Approach

This feature will use both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of valid inputs and expected outputs
- Edge cases (empty strings, boundary values, special characters)
- Error conditions (missing content-type, wrong method, malformed JSON)
- Integration between components (handler → validator → processor → formatter)

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Validating correctness properties defined in this document

### Property-Based Testing Configuration

**Library:** fast-check (TypeScript/JavaScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with comment referencing design property
- Tag format: `// Feature: backend-api-integration, Property {number}: {property_text}`

**Example Property Test Structure:**
```typescript
// Feature: backend-api-integration, Property 1: Valid input produces valid score
test('valid CreditInput produces valid CreditScore', async () => {
  await fc.assert(
    fc.asyncProperty(validCreditInputArbitrary(), async (input) => {
      const response = await POST(createRequest(input));
      const body = await response.json();
      
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.score).toBeGreaterThanOrEqual(0);
      expect(body.data.score).toBeLessThanOrEqual(1000);
      expect(body.data.factors).toHaveLength(3);
    }),
    { numRuns: 100 }
  );
});
```

### Test Organization

**Unit Tests Location:** `app/api/credit/calculate/__tests__/route.test.ts`

**Property Tests Location:** `app/api/credit/calculate/__tests__/route.properties.test.ts`

**Shared Test Utilities:** `app/api/lib/__tests__/test-utils.ts`
- Arbitrary generators for fast-check
- Mock request builders
- Response assertion helpers

### Unit Test Coverage

Unit tests will cover:

1. **Happy Path Examples:**
   - Valid complete input → 200 with score
   - Valid input with optional fields omitted → 200 with score
   - Various valid enum combinations

2. **Validation Edge Cases:**
   - Empty string for required field → 400
   - Invalid enum value → 400
   - Non-numeric string in numeric field → 400
   - credit_score = "1001" → 400
   - credit_score = "-1" → 400

3. **HTTP Error Cases:**
   - GET request → 405
   - PUT request → 405
   - Missing Content-Type → 415
   - Content-Type: text/plain → 415
   - Malformed JSON → 400

4. **Response Format Verification:**
   - Success response has correct structure
   - Error response has correct structure
   - Validation errors include field details

5. **Integration:**
   - End-to-end request through all layers
   - Validator correctly rejects/accepts
   - Response formatter produces consistent output

### Property Test Coverage

Property tests will verify all 12 correctness properties:

1. Valid input produces valid score (Property 1)
2. API matches direct function call (Property 2)
3. Missing required fields rejected (Property 3)
4. Invalid enum values rejected (Property 4)
5. Invalid numeric strings rejected (Property 5)
6. Credit score range validation (Property 6)
7. Non-POST methods rejected (Property 7)
8. Error responses hide sensitive info (Property 8)
9. Success response structure (Property 9)
10. Error response structure (Property 10)
11. Validation error details (Property 11)
12. Schema matches TypeScript types (Property 12)

### Test Data Generation

**Arbitrary Generators (fast-check):**

```typescript
// Valid CreditInput generator
const validCreditInputArbitrary = () => fc.record({
  Sex: fc.constantFrom('Male', 'Female', 'Other'),
  Occupation: fc.string({ minLength: 1, maxLength: 50 }),
  Salary: fc.double({ min: 0, max: 1000000 }).map(n => n.toFixed(2)),
  Marital_status: fc.constantFrom('Single', 'Married', 'Divorced', 'Widowed'),
  credit_score: fc.option(fc.integer({ min: 0, max: 1000 }).map(String), { nil: '' }),
  credit_grade: fc.option(fc.string(), { nil: '' }),
  outstanding: fc.double({ min: 0, max: 500000 }).map(n => n.toFixed(2)),
  overdue: fc.double({ min: 0, max: 100000 }).map(n => n.toFixed(2)),
  loan_amount: fc.double({ min: 0, max: 1000000 }).map(n => n.toFixed(2)),
  Coapplicant: fc.constantFrom('Yes', 'No'),
  Interest_rate: fc.double({ min: 0, max: 30 }).map(n => n.toFixed(2)),
});

// Invalid enum value generator
const invalidEnumCreditInput = () => 
  validCreditInputArbitrary().chain(input => 
    fc.constantFrom('Sex', 'Marital_status', 'Coapplicant').map(field => ({
      ...input,
      [field]: 'INVALID_VALUE'
    }))
  );

// Missing required field generator
const missingFieldCreditInput = () =>
  validCreditInputArbitrary().chain(input => {
    const requiredFields = ['Sex', 'Occupation', 'Salary', 'Marital_status', 
                            'outstanding', 'overdue', 'loan_amount', 
                            'Coapplicant', 'Interest_rate'];
    return fc.constantFrom(...requiredFields).map(field => {
      const copy = { ...input };
      delete copy[field as keyof CreditInput];
      return copy;
    });
  });
```

### Testing Tools

- **Test Framework:** Jest (or Vitest)
- **Property Testing:** fast-check
- **HTTP Mocking:** Next.js test utilities / node-mocks-http
- **Assertions:** Jest matchers / expect
- **Coverage:** Jest coverage reports

### Success Criteria

Tests pass when:
- All unit tests pass (100% of examples)
- All property tests pass (100 iterations each)
- Code coverage > 90% for API routes and lib modules
- No unhandled errors in test runs
- All 12 correctness properties verified

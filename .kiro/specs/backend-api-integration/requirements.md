# Requirements Document

## Introduction

This document defines the requirements for adding backend API capabilities to the Next.js credit scoring application. The system will enable server-side processing of user input data through API endpoints, replacing the current client-side-only processing. This includes creating API routes for credit score calculation, data validation, and potential future integration with external services.

## Glossary

- **API_Handler**: The Next.js API route handler that processes HTTP requests
- **Credit_Processor**: The backend service that calculates credit scores from user input
- **Validator**: The component that validates incoming request data against schema rules
- **Response_Formatter**: The component that structures API responses in a consistent format
- **Error_Handler**: The component that manages error conditions and returns appropriate error responses
- **CreditInput**: The data structure containing user financial information (Sex, Occupation, Salary, Marital_status, credit_score, credit_grade, outstanding, overdue, loan_amount, Coapplicant, Interest_rate)
- **CreditScore**: The data structure containing calculated score, grade, and contributing factors

## Requirements

### Requirement 1: Credit Score Calculation API

**User Story:** As a frontend developer, I want a POST API endpoint to calculate credit scores, so that I can submit user financial data and receive calculated results

#### Acceptance Criteria

1. THE API_Handler SHALL accept POST requests at the endpoint /api/credit/calculate
2. WHEN a valid CreditInput payload is received, THE Credit_Processor SHALL calculate the credit score and return a CreditScore response
3. THE Credit_Processor SHALL apply the same scoring algorithm currently implemented in utils/scoring.ts
4. THE Response_Formatter SHALL return responses with HTTP status 200 and a JSON body containing the CreditScore object
5. WHEN the calculation completes, THE API_Handler SHALL return the response within 500 milliseconds

### Requirement 2: Request Validation

**User Story:** As a backend developer, I want to validate incoming API requests, so that invalid data is rejected before processing

#### Acceptance Criteria

1. WHEN an API request is received, THE Validator SHALL verify that all required CreditInput fields are present
2. THE Validator SHALL verify that Sex is one of: Male, Female, Other
3. THE Validator SHALL verify that Marital_status is one of: Single, Married, Divorced, Widowed
4. THE Validator SHALL verify that Salary, outstanding, overdue, loan_amount, and Interest_rate are valid numeric strings
5. THE Validator SHALL verify that Coapplicant is either Yes or No
6. WHERE credit_score is provided, THE Validator SHALL verify it is a numeric string between 0 and 1000
7. IF validation fails, THEN THE Error_Handler SHALL return HTTP status 400 with a descriptive error message

### Requirement 3: Error Handling

**User Story:** As a frontend developer, I want consistent error responses, so that I can handle errors appropriately in the UI

#### Acceptance Criteria

1. IF a request contains invalid data, THEN THE Error_Handler SHALL return HTTP status 400 with a JSON body containing an error message and field-specific validation errors
2. IF a request is missing the Content-Type application/json header, THEN THE Error_Handler SHALL return HTTP status 415 with an error message
3. IF the request method is not POST, THEN THE Error_Handler SHALL return HTTP status 405 with an error message
4. IF an unexpected server error occurs, THEN THE Error_Handler SHALL return HTTP status 500 with a generic error message
5. THE Error_Handler SHALL log all errors with sufficient detail for debugging
6. THE Error_Handler SHALL NOT expose sensitive system information in error responses

### Requirement 4: Response Format Consistency

**User Story:** As a frontend developer, I want consistent API response formats, so that I can reliably parse responses

#### Acceptance Criteria

1. THE Response_Formatter SHALL return all successful responses with a JSON body containing a "success" boolean field set to true
2. THE Response_Formatter SHALL include the "data" field containing the CreditScore object in successful responses
3. THE Response_Formatter SHALL return all error responses with a JSON body containing a "success" boolean field set to false
4. THE Response_Formatter SHALL include an "error" field containing the error message in error responses
5. WHERE validation errors exist, THE Response_Formatter SHALL include a "validationErrors" field containing field-specific error details

### Requirement 5: Type Safety

**User Story:** As a developer, I want type-safe API handlers, so that I can catch type errors at compile time

#### Acceptance Criteria

1. THE API_Handler SHALL use TypeScript types for all request and response data structures
2. THE API_Handler SHALL reuse the existing CreditInput and CreditScore types from types/credit.ts
3. THE Validator SHALL use a type-safe validation schema that matches the CreditInput interface
4. THE Response_Formatter SHALL use typed response structures for both success and error cases
5. THE Credit_Processor SHALL maintain type compatibility with the existing scoring.ts implementation

### Requirement 6: API Route Organization

**User Story:** As a developer, I want organized API routes, so that the codebase is maintainable and scalable

#### Acceptance Criteria

1. THE API_Handler SHALL be located at app/api/credit/calculate/route.ts following Next.js App Router conventions
2. WHERE shared validation logic exists, THE Validator SHALL be implemented in a reusable module at app/api/lib/validation.ts
3. WHERE shared response formatting logic exists, THE Response_Formatter SHALL be implemented in a reusable module at app/api/lib/response.ts
4. THE Credit_Processor SHALL import and use the existing scoreCredit function from utils/scoring.ts
5. THE API_Handler SHALL separate concerns between request handling, validation, processing, and response formatting

### Requirement 7: CORS and Security Headers

**User Story:** As a security-conscious developer, I want appropriate security headers, so that the API is protected against common vulnerabilities

#### Acceptance Criteria

1. THE API_Handler SHALL set the Content-Type response header to application/json
2. WHERE the application is deployed, THE API_Handler SHALL respect Next.js default security headers
3. THE API_Handler SHALL NOT expose sensitive server information in response headers
4. THE API_Handler SHALL validate request origin when deployed to production
5. THE API_Handler SHALL implement rate limiting considerations for future enhancement

### Requirement 8: Frontend Integration

**User Story:** As a frontend developer, I want to integrate the API with existing forms, so that user data is processed server-side

#### Acceptance Criteria

1. WHEN the CreditForm is submitted, THE frontend SHALL send a POST request to /api/credit/calculate with the CreditInput data
2. THE frontend SHALL set the Content-Type header to application/json
3. WHEN the API returns a successful response, THE frontend SHALL display the CreditScore results
4. IF the API returns an error response, THEN THE frontend SHALL display appropriate error messages to the user
5. WHILE the API request is in progress, THE frontend SHALL display a loading indicator


# Medora — Medical Consultation Manager

A full-stack medical appointment platform: an **Angular 20** single-page application on top of a
**Spring Boot 3 / Spring Security** REST API, with **JWT authentication** and **role-based access
control** across three separate consoles (patient, practitioner, administrator), a **MySQL**
persistence layer, and a French-language assistant backed by a **locally hosted Mistral model**
through **langchain4j + Ollama**.

| | |
|---|---|
| **Backend** | Java 17 · Spring Boot 3.4.4 · Spring Security · Spring Data JPA · MySQL 8 |
| **Frontend** | Angular 20 (standalone components, signals) · TypeScript 5.9 · plain CSS design system |
| **Auth** | JWT (JJWT, HS256) · BCrypt · `@PreAuthorize` method security · route guards |
| **AI** | langchain4j 0.35 → Ollama → `mistral` (local inference) |

![Patient dashboard](docs/screenshots/02-patient-overview.png)

---

## Overview

Booking a medical appointment by phone is lossy: the patient has no record of what was agreed, and
the practitioner has no single place to see the day's requests. Medora replaces that exchange with a
request/approval workflow backed by a single source of truth.

**The core workflow**

1. A patient and a practitioner each register an account (`/api/auth/signup/...`).
2. The practitioner attaches the patient to their patient list, by email.
3. The patient requests an appointment. It is stored with status `PENDING`.
4. The practitioner accepts or rejects it — status becomes `APPROVED` or `REJECTED`.
5. Both sides see the result on their own dashboard; the patient can reschedule or cancel.

The constraint that shapes the whole system is that **a patient can only request an appointment from
a practitioner who has already attached them**. This is not a UI rule — the server re-checks the
`Patient → Medecin` association on every booking and rejects the request otherwise.

**The most technically interesting part** is the authorisation layer. Three controllers are guarded
by three distinct authorities, and beyond that coarse check, every service method re-derives the
caller's identity from the JWT and verifies *ownership* of the specific row being touched. A
practitioner holding a valid `ROLE_MEDECIN` token still cannot approve an appointment that is not
theirs, and a patient cannot cancel someone else's.

**Who it is for:** a personal side project — a complete, self-contained system covering
requirements, design, implementation, testing and documentation end to end.

---

## Features

### Authentication & access control
- Registration and login for three roles, each with its own endpoint and its own console.
- Stateless JWT sessions; passwords stored BCrypt-hashed.
- Method-level authorisation (`@PreAuthorize`) per controller, plus URL-level rules in the filter chain.
- Per-row ownership checks in the service layer, independent of the role check.
- Angular route guards that mirror the server's role split, and an HTTP interceptor that attaches the
  token and drops the session on `401`.

### Patient
- Dashboard: next appointment, upcoming list, recorded health values, recent activity.
- Five-step booking flow (practitioner → consultation type → date → time slot → confirmation).
- Reschedule and cancel; rescheduling resets the request to `PENDING`.
- Practitioner directory with search, specialty/city/consultation-type filters and sorting.
- Medical records, prescriptions, lab results, secure messaging, notifications, settings,
  and an emergency-information card.

### Practitioner
- Console: appointment and patient counters, pending-request queue, recent consultations.
- Accept / reject requests; reschedule or delete any appointment on the schedule.
- Patient list management: attach by email, edit, detach.

### Administrator
- Aggregate counters (users, appointments, practitioners, patients) and account breakdown.
- A read-only view of how the API's authorities map to URL prefixes.

### Assistant
- Floating assistant answering questions about the service in French, grounded in a configured
  site description, served by a local Mistral model.

---

## Technology Stack

| Area | Technologies |
|---|---|
| Backend framework | Spring Boot 3.4.4 (Web, Data JPA, Security) |
| Language / build | Java 17, Maven (wrapper: `./mvnw`) |
| Persistence | MySQL 8, Hibernate (`ddl-auto=update`), Spring Data JPA repositories |
| Authentication | JJWT 0.11.5 (HS256), `BCryptPasswordEncoder`, `OncePerRequestFilter` |
| Authorisation | Spring Security filter chain + `@EnableMethodSecurity` / `@PreAuthorize` |
| Validation | Bean Validation (Hibernate Validator) via `spring-boot-starter-validation` |
| AI | langchain4j 0.35 (`langchain4j-ollama`) → Ollama runtime → `mistral` model |
| Frontend framework | Angular 20.3 — standalone components, signals, built-in control flow |
| Frontend HTTP/state | `HttpClient` + functional interceptor, signal-based stores, RxJS |
| Styling | Hand-written CSS design system (custom properties); no UI framework |
| Testing | JUnit 5, Mockito, Spring Boot Test, H2 (in-memory, test scope) |

Supporting libraries: Lombok (boilerplate) and SLF4J (logging).

---

## Architecture

```mermaid
flowchart TB
    subgraph Browser["Angular 20 SPA — localhost:4200"]
        Cli["Route guards + Auth service<br/><i>decode JWT · gate routes by authority</i>"]
        Pag["Role consoles<br/><i>patient · praticien · admin</i>"]
        Api["Api client + authInterceptor<br/><i>typed calls · Bearer header · 401 handling</i>"]
        Cli --> Pag --> Api
    end

    Api -->|"Authorization: Bearer token<br/>CORS allow-list"| Sec

    subgraph Server["Spring Boot 3 REST API — localhost:8787"]
        Sec["<b>Security layer</b><br/>JwtAuthFilter → SecurityFilterChain → @PreAuthorize<br/><i>stateless · verifies signature + expiry · ROLE_ check</i>"]
        Ctl["<b>Controllers</b><br/>Auth · Patient · Medecin · Admin · Chat<br/><i>identity taken from the token, never the payload</i>"]
        Srv["<b>Services</b><br/>AuthenticationService · PatientService · MedecinService · AdminService<br/><i>business rules + per-row ownership checks</i>"]
        Rep["<b>Repositories</b> (Spring Data JPA)<br/>User · Patient · Medecin · Rendezvous"]
        Sec --> Ctl --> Srv --> Rep
    end

    Rep -->|JDBC| DB[("MySQL 8<br/>schema: appointment")]
    Ctl -->|langchain4j| Oll["Ollama — localhost:11434<br/>model: mistral"]

    style Browser fill:#e6f0ee,stroke:#115e59
    style Server fill:#f5f4f1,stroke:#77878f
    style DB fill:#eaf1f5,stroke:#3f6d8c
    style Oll fill:#eaf3ee,stroke:#6fa98d
```

### Component responsibilities

| Component | Responsibility |
|---|---|
| **`JwtAuthFilter`** | Runs before `UsernamePasswordAuthenticationFilter`. Skips `/api/auth/**`, otherwise parses the `Bearer` token, loads the user, and populates the `SecurityContext`. |
| **`SecurityConfig`** | Stateless session policy, CORS for `http://localhost:4200`, CSRF disabled (no cookies), URL-level role rules, filter registration. |
| **Controllers** | HTTP surface only. They resolve the caller's entity from `Authentication.getName()` (the JWT subject) and delegate; they never trust an id supplied by the client. |
| **Services** | All business rules: the patient↔practitioner association, duplicate-date prevention, status transitions, and per-row ownership checks. |
| **Repositories** | Spring Data JPA interfaces; derived queries (`findByIdAndMedecinId`, `findTop5ByMedecinIdOrderByDateDesc`, `countDistinctByMedecinId`). |
| **`Auth` (Angular)** | Decodes the JWT payload client-side to read subject and authority, exposes them as signals, and derives the per-role home route. |
| **`Api` (Angular)** | A flat, typed client — one method per backend endpoint, mirroring the controller surface. |

---

## How the System Works

### 1 · Authentication

```
POST /api/auth/login  →  AuthController  →  AuthenticationService
                                             ↓
                              AuthenticationManager.authenticate()
                                             ↓
                                DaoAuthenticationProvider
                                   ↓                    ↓
                        UserDetailsService        BCrypt compare
                                             ↓
                              JwtService.generateToken()
                                             ↓
                                    { "token": "eyJ..." }
```

1. The client posts `{ email, password, role }`. The `role` selects which branch runs, so an account
   can only be used through the console it belongs to.
2. `AuthenticationManager` delegates to `DaoAuthenticationProvider`, which loads the user via
   `UserDetailsService` and compares the submitted password against the stored BCrypt hash.
3. On success the service re-loads the concrete entity (`Patient`, `Medecin` or `Administateur`)
   and `JwtService` signs a token whose subject is the email and whose `role` claim holds the
   granted authority.
4. Angular stores the token, decodes the payload to read subject and authority, and redirects to the
   console for that role.

### 2 · An authorised request, end to end

```
Angular  →  authInterceptor  →  CORS  →  JwtAuthFilter  →  SecurityFilterChain
         →  @PreAuthorize  →  Controller  →  Service (ownership check)  →  Repository  →  MySQL
```

Taking `POST /api/medecin/42/approve` as the example:

1. **Interceptor** — attaches `Authorization: Bearer <token>` to every non-auth call to the API.
2. **`JwtAuthFilter`** — parses the token, verifies the HMAC signature and expiry, loads the
   `UserDetails`, and sets the `SecurityContext` with authority `ROLE_MEDECIN`.
3. **Filter chain** — the request is authenticated, so it passes `anyRequest().authenticated()`.
4. **`@PreAuthorize("hasRole('MEDECIN')")`** — coarse check on `MedecinController`. A patient token
   is rejected with `403` here, before any controller code runs.
5. **Controller** — resolves the practitioner from `authentication.getName()`, *not* from a request
   parameter. The client cannot act as another practitioner by changing a payload field.
6. **Service** — `MedecinService.AcceptRendezVous` re-checks that appointment 42 belongs to *this*
   practitioner, that the patient is on their list, and that the status is not already `APPROVED`.
   Any failure raises a domain exception.
7. **Repository → MySQL** — the status transition is persisted inside a `@Transactional` method.
8. **`GlobalExceptionHandler`** maps domain exceptions to status codes; the Angular layer turns the
   response body into a readable message and surfaces it as a toast.

### 3 · Booking, and why it can be refused

`POST /api/patient/assign` overwrites `patientEmail` with the JWT subject before the service runs, so
a patient can only ever book for themselves. `PatientService.assignRendezVous` then rejects the
request when the practitioner does not exist, when the patient is not attached to that practitioner,
or when the patient already has an appointment on that calendar day. The appointment is saved as
`PENDING` — never as confirmed.

### 4 · Assistant inference

`ChatController` builds an `OllamaLanguageModel` (base URL `127.0.0.1:11434`, model `mistral`,
60 s timeout) and, on each call, renders a French prompt that embeds the `website.info` configuration
value as the sole source of truth, then returns the completion as `text/plain`. The endpoint is
public. If Ollama is not running the call returns `500` and the widget shows an "assistant
unavailable" message rather than breaking the page.

---

## Key Technical Decisions

| Decision | Implementation | Trade-off |
|---|---|---|
| **Stateless JWT with a refresh pair** | `SessionCreationPolicy.STATELESS`; a short-lived access token carries subject + authority, a longer-lived refresh token renews it at `/api/auth/refresh`. A `typ` claim keeps the two from being substituted for one another. | Keeps the API horizontally scalable with no session store, and bounds the damage of a leaked access token to one hour. The cost is that revocation before expiry would need server-side state. |
| **Two layers of authorisation** | `@PreAuthorize` for the role, explicit ownership checks in each service method. | More code per method, but a valid token for the right role still cannot reach another user's rows. |
| **Identity from the token, never from the payload** | Controllers call `authentication.getName()` and re-load the entity. | An extra query per request; removes a whole class of horizontal-privilege bugs. |
| **JOINED inheritance for users** | `User` is `@Inheritance(JOINED)`; `Patient`, `Medecin`, `Administateur` extend it. | One `user` table plus a table per subtype — normalised and queryable per role, at the cost of a join on every load. |
| **Request/approval instead of direct booking** | `Status` enum `PENDING → APPROVED / REJECTED`; patient writes, practitioner transitions. | The patient never gets an instant confirmation, which matches how a real practice works. |
| **Angular standalone + signals, no state library** | Components own their state via `signal`/`computed`; `Api` returns observables. | No NgRx ceremony for an app this size; shared cross-page state would need a rethink if it grew. |
| **Hand-written CSS design system** | Tokens in `styles.css`, reusable components in `app/ui`. | No framework weight or visual defaults; more CSS to maintain. |
| **Local LLM instead of a hosted API** | langchain4j + Ollama on `localhost:11434`. | No API key, no data leaving the machine, no per-call cost; requires the operator to run Ollama and adds a hard local dependency. |
| **Lazy-loaded routes per role** | `loadComponent` on every route; guards on the parent. | Smaller initial bundle (≈108 kB transferred); each page costs one extra request on first visit. |

---

## Security

What is actually implemented, in the order a request meets it:

| Mechanism | Implementation |
|---|---|
| **Password storage** | `BCryptPasswordEncoder`; only the hash is persisted. Login compares via `DaoAuthenticationProvider`. |
| **Token issuance** | `JwtService` signs with HS256 using a Base64 key read from the `JWT_SECRET_KEY` environment variable; subject = email, `role` claim = granted authority, `typ` claim separates access from refresh tokens. |
| **Token lifetime** | Access tokens expire after `JWT_EXPIRATION_MS` (1 h by default); refresh tokens after `JWT_REFRESH_EXPIRATION_MS` (7 days). A refresh token cannot be replayed as an access token, or the reverse — the `typ` claim is checked on every validation. |
| **Session renewal** | `POST /api/auth/refresh` exchanges a refresh token for a fresh pair. The Angular interceptor does this automatically on a `401`, replays the original request once, and only signs the user out if the refresh also fails. |
| **Token validation** | `JwtAuthFilter` parses and verifies signature + expiry on every non-auth request, then re-loads the user from the database before trusting the token's subject. |
| **Session policy** | `STATELESS` — no `JSESSIONID`, no server-side session. |
| **CSRF** | Disabled deliberately: the token travels in an `Authorization` header, not a cookie, so there is no ambient authority to forge. |
| **CORS** | Explicit allow-list — origin `http://localhost:4200`, methods `GET/POST/PUT/DELETE/OPTIONS`, headers `Authorization`/`Content-Type`/`Accept`, 1 h preflight cache. |
| **URL-level authorisation** | `SecurityConfig`: `/api/auth/**` and `/api/chat/**` public; `/admin/**` requires `ADMIN`; everything else requires authentication. |
| **Method-level authorisation** | `@EnableMethodSecurity` + `@PreAuthorize` on `AdminController` (`ADMIN`), `MedecinController` (`MEDECIN`), `PatientControler` (`PATIENT`). |
| **Object-level authorisation** | Every service method that touches a row verifies the caller owns it — e.g. `deleteRendezVous` compares `rdv.getPatient().getId()` against the authenticated patient before deleting. |
| **Input validation** | Bean Validation runs on every request body (`@Valid`): e-mail format, required fields, password length. `GlobalExceptionHandler` maps failures to `400` with one message per rejected field. Service-layer rules (ownership, the patient↔practitioner link, one appointment per day) are enforced independently of the annotations. |
| **Secret handling** | No credential is committed. The datasource password and the JWT signing key come from the environment, and the application refuses to start without `JWT_SECRET_KEY` rather than falling back to a shared default. |
| **Error disclosure** | `GlobalExceptionHandler` returns domain messages with appropriate status codes instead of stack traces. |
| **Client-side enforcement** | `roleGuard` blocks routes the token's authority does not allow and redirects to that role's home; `guestGuard` keeps signed-in users off the auth screens. These are UX guards — the server check is the real one. |

### Authorisation model

| Authority | Protected prefix | Scope |
|---|---|---|
| `ROLE_ADMIN` | `/admin/**` | Aggregate counters only |
| `ROLE_MEDECIN` | `/api/medecin/**` | Own patient list and own schedule |
| `ROLE_PATIENT` | `/api/patient/**` | Own dashboard and own appointments |
| *(public)* | `/api/auth/**`, `/api/chat` | Registration, login, assistant |

![Administrator console](docs/screenshots/20-admin.png)

---

## Data and Persistence

MySQL 8 with Hibernate; the schema is generated from the entities (`spring.jpa.hibernate.ddl-auto=update`).

```mermaid
erDiagram
    USER ||--o| PATIENT : "JOINED subtype"
    USER ||--o| MEDECIN : "JOINED subtype"
    USER ||--o| ADMINISTATEUR : "JOINED subtype"
    MEDECIN ||--o{ PATIENT : "follows"
    PATIENT ||--o{ RENDEZVOUS : "requests"
    MEDECIN ||--o{ RENDEZVOUS : "hosts"

    USER {
        bigint id PK
        string name
        string email
        string password "BCrypt hash"
        string ROLE_ "PATIENT|MEDECIN|ADMIN"
        date created_at
        date updated_at
    }
    MEDECIN {
        bigint id PK,FK
        string specialite
    }
    PATIENT {
        bigint id PK,FK
        bigint medecin_id FK "nullable until attached"
    }
    RENDEZVOUS {
        bigint id PK
        datetime date
        bigint patient_id FK
        bigint medecin_id FK
        string STATUS_ "PENDING|APPROVED|REJECTED"
        string reason
    }
```

- **Inheritance** — `User` uses `InheritanceType.JOINED`, so each role has its own table keyed on the
  shared `user.id`.
- **`patient.medecin_id` is nullable**, and that nullability drives real behaviour: until a
  practitioner attaches the patient, `PatientService.dashboard` raises `Medecinnotfound` (`404`) and
  the UI shows a "no practitioner yet" state instead of an error.
- **Transactions** — every write path is `@Transactional` at the service level; `saveAndFlush` is used
  when the generated id is needed immediately.
- **No migration tool.** Schema changes are applied by Hibernate on boot. Flyway or Liquibase would be
  the next step for anything beyond a development database.

---

## AI / Assistant Component

Four distinct things, kept separate on purpose:

| Layer | What it is here |
|---|---|
| **Model** | `mistral` — an open-weights LLM |
| **Runtime** | **Ollama**, serving that model locally on port `11434` |
| **Library** | **langchain4j** (`langchain4j-ollama`) — the Java client that talks to the runtime |
| **Application logic** | `ChatController` — input sanitisation, prompt construction, error handling |

The flow is a single-turn, grounded completion — there is no retrieval, no embeddings, no agent and
no tool calling:

1. The request body is rejected if the message is empty.
2. The message is stripped to letters, digits, French accented characters and basic punctuation
   before it reaches the prompt.
3. A French system prompt embeds the `website.info` property and instructs the model to answer only
   from that text and not to speculate.
4. `model.generate(prompt)` calls Ollama; the completion is returned as `text/plain`.
5. Any failure is logged and returned as `500` with a French fallback message.

The controller is annotated `@Async` and `@Cacheable`, but neither `@EnableAsync` nor `@EnableCaching`
is present, so in practice the call runs synchronously and uncached.

---

## Project Structure

```text
medicalconsultationmanager/
├── pom.xml                         Maven build — Spring Boot 3.4.4, Java 17
├── mvnw / mvnw.cmd                 Maven wrapper
├── src/main/java/org/example/gestionrendezvousmedic/
│   ├── GestionRendezVousmedicApplication.java
│   ├── configs/
│   │   ├── SecurityConfig.java            Filter chain, CORS, URL rules
│   │   └── ApplicationConfiguration.java  UserDetailsService, BCrypt, AuthenticationManager
│   ├── security/
│   │   ├── JwtAuthFilter.java             Per-request token validation
│   │   ├── CustomUserDetails.java
│   │   └── CustomUserDetailsService.java
│   ├── Controller/                        HTTP surface (Auth, Patient, Medecin, Admin, Chat)
│   ├── services/                          Business rules, ownership checks, JwtService
│   ├── repos/                             Spring Data JPA repositories
│   ├── models/                            JPA entities + Role / Status enums
│   ├── dtos/                              Request and response payloads
│   └── Exception/                         Domain exceptions + GlobalExceptionHandler
├── src/main/resources/application.properties
├── src/test/java/.../GestionRendezVousmedicApplicationTests.java
├── frontend/
│   ├── angular.json · package.json · tsconfig.json
│   └── src/
│       ├── styles.css                     Design tokens + component classes
│       └── app/
│           ├── app.routes.ts              Lazy routes, guards per role
│           ├── app.config.ts              Router + HttpClient + interceptor
│           ├── core/
│           │   ├── api.ts                 One method per backend endpoint
│           │   ├── auth.ts                Token store, JWT decode, role signals
│           │   ├── auth-interceptor.ts    Bearer header, 401 handling, error mapping
│           │   ├── guards.ts              roleGuard / guestGuard
│           │   ├── models.ts              Types mirroring the backend DTOs
│           │   ├── format.ts              Date/time formatting helpers
│           │   └── mock/                  Demonstration data (see note below)
│           ├── layout/                    Shell, role-driven navigation, assistant widget
│           ├── ui/                         Reusable primitives (avatar, modal, toasts, …)
│           └── pages/
│               ├── patient/  praticien/  admin/   Role consoles
│               └── login · register · messages · settings
└── docs/screenshots/                       Interface captures used in this README
```

> **On mock data.** The backend covers authentication, patients, appointments and dashboards. The
> patient-facing surfaces that have no backend equivalent — medical records, prescriptions, lab
> results, messaging, notifications, the practitioner directory and health readings — are rendered
> from typed fixtures under `frontend/src/app/core/mock/`. Everything else on those screens
> (identity, role, navigation, the appointment data itself) comes from the live API.

---

## API Overview

Base URL `http://localhost:8787`. All authenticated calls expect `Authorization: Bearer <token>`.

### Public

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/signup/patient` | Register a patient → token pair |
| `POST` | `/api/auth/signup/medecin` | Register a practitioner → token pair + profile |
| `POST` | `/api/auth/signup/admin` | Register an administrator → token pair |
| `POST` | `/api/auth/login` | Authenticate `{ email, password, role }` → `{ token, refreshToken, expiresIn }` |
| `POST` | `/api/auth/refresh` | Exchange a refresh token for a new token pair |
| `POST` | `/api/chat` | Assistant completion → `text/plain` |
| `GET` | `/api/auth/democon` | Liveness ping |

### Patient — `ROLE_PATIENT`

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/patient/dashboard` | Profile, assigned practitioner, appointment list |
| `POST` | `/api/patient/assign` | Request an appointment (saved as `PENDING`) |
| `PUT` | `/api/patient/update/{id}` | Reschedule — server forces status back to `PENDING` |
| `DELETE` | `/api/patient/delete/{id}` | Cancel an own appointment |

### Practitioner — `ROLE_MEDECIN`

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/medecin/dashboard` | Counters, five most recent appointments, patient list |
| `PUT` | `/api/medecin/getallpatients` | List attached patients |
| `PUT` | `/api/medecin/patients/getpatient/{id}` | One patient |
| `POST` | `/api/medecin/addpatient/{email}` | Attach an existing patient account |
| `PUT` | `/api/medecin/updatePatient/{id}` | Update a patient record |
| `DELETE` | `/api/medecin/deletePatient/{id}` | Detach a patient (id read from the body) |
| `GET` | `/api/medecin/rendezvous/getallrendezvous` | Full schedule |
| `GET` | `/api/medecin/rendezvous/getrendezvous/{id}` | One appointment |
| `PUT` | `/api/medecin/rendezvous/updaterendezvous/{id}` | Reschedule / set status |
| `DELETE` | `/api/medecin/rendezvous/deleterendezvous/{id}` | Delete an appointment |
| `POST` | `/api/medecin/{id}/approve` | `PENDING → APPROVED` |
| `POST` | `/api/medecin/{id}/reject` | `PENDING → REJECTED` |

### Administrator — `ROLE_ADMIN`

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/admin/dashboard` | Total users, appointments, practitioners, patients |

> Two read endpoints use `PUT` (`getallpatients`, `patients/getpatient/{id}`). That is the shape the
> controller exposes, and the Angular client matches it.

---

## Local Development

### Prerequisites

| Requirement | Version | Needed for |
|---|---|---|
| JDK | 17+ (a full JDK, not a JRE) | Building and running the API |
| Node.js | ^20.19 or ^22.12 | Angular 20 toolchain |
| MySQL | 8.x, reachable on `localhost:3306` | Persistence |
| Ollama + `mistral` | optional | The assistant only |

### 1 · Clone

```bash
git clone https://github.com/Iliassmalki/medicalconsultationmanager.git
cd medicalconsultationmanager
```

### 2 · Database

The application expects a schema named `appointment`; Hibernate creates the tables on first boot.

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS appointment;"
```

Or with Docker:

```bash
docker run -d --name medora-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=sa -e MYSQL_DATABASE=appointment mysql:8.0
```

### 3 · Backend

The signing key is read from the environment and has no default, so generate one first:

```bash
export JWT_SECRET_KEY=$(openssl rand -base64 32)
export DB_PASSWORD=your-mysql-password
./mvnw spring-boot:run
```

It starts on **http://localhost:8787**. Check it with:

```bash
curl http://localhost:8787/api/auth/democon
```

### 4 · Frontend

```bash
cd frontend && npm install && npm start
```

It serves **http://localhost:4200** and calls the API at the base URL in
`frontend/src/app/core/api-url.ts`.

### 5 · Assistant (optional)

```bash
ollama pull mistral && ollama serve
```

Without it, every page works; only the assistant widget reports that it is unavailable.

---

## Configuration

Every value in `src/main/resources/application.properties` reads from an environment
variable, with a development default where one is safe. **No credential is committed.**

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `JWT_SECRET_KEY` | **yes** | *none* | Base64 HMAC key, 256 bits or more. The application will not start without it. |
| `DB_URL` | no | `jdbc:mysql://localhost:3306/appointment` | JDBC URL |
| `DB_USERNAME` | no | `root` | Database user |
| `DB_PASSWORD` | no | *empty* | Database password |
| `JWT_EXPIRATION_MS` | no | `3600000` (1 h) | Access-token lifetime |
| `JWT_REFRESH_EXPIRATION_MS` | no | `604800000` (7 days) | Refresh-token lifetime |
| `SERVER_PORT` | no | `8787` | HTTP port |
| `ASSISTANT_BASE_URL` | no | `http://localhost:11434` | Ollama runtime |
| `ASSISTANT_MODEL` | no | `mistral` | Model served by that runtime |
| `WEBSITE_INFO` | no | built-in French description | Grounding text injected into the assistant prompt |
| `SHOW_SQL` / `SQL_LOG_LEVEL` | no | `false` / `WARN` | SQL logging |

```bash
export JWT_SECRET_KEY=$(openssl rand -base64 32)
export DB_PASSWORD=your-mysql-password
```

The signing key deliberately has no fallback: a missing secret fails the boot rather than
silently signing tokens with a value that is public in the repository.

The frontend has one setting — the API base URL in `frontend/src/app/core/api-url.ts`.

## Running the System

Start order matters — the API will not boot without the database:

```
MySQL (:3306)  →  Spring Boot API (:8787)  →  Angular dev server (:4200)
                                              ↑
                       Ollama (:11434) ───────┘  (optional, assistant only)
```

| Service | Port | Required |
|---|---|---|
| MySQL | 3306 | Yes — the API fails to start without it |
| Spring Boot API | 8787 | Yes |
| Angular dev server | 4200 | Yes — and it is the only origin the API's CORS policy allows |
| Ollama | 11434 | No |

To exercise the full workflow after a clean start: register a practitioner and a patient, sign in as
the practitioner and attach the patient by email, then sign in as the patient and request an
appointment — it appears in the practitioner's pending queue.

---

## Testing

**30 tests, all green, with no external services required** — the suite runs on an in-memory
H2 database and mocked repositories.

```bash
./mvnw test
```

```
Tests run: 30, Failures: 0, Errors: 0, Skipped: 0
```

| Suite | Tests | What it covers |
|---|---|---|
| `JwtServiceTest` | 6 | Subject and authority claims, validity for the right user, rejection for another user, rejection of a token signed with a different key, rejection of a tampered payload. |
| `PatientServiceTest` | 12 | Bookings are created `PENDING`; the doctor and patient ids land in their own fields; booking is refused without an attached practitioner, for a practitioner who does not follow the patient, on behalf of another patient, and twice on the same day. Cancelling and reading another patient's appointment is refused; a missing appointment is reported. The dashboard fails cleanly with no practitioner and exposes the practitioner's e-mail. |
| `MedecinServiceTest` | 11 | Approve/reject transitions; a practitioner cannot act on another practitioner's appointment or for a patient not on their list; double approval is refused; the ownership check compares ids so the bidirectional JPA association cannot recurse; the schedule and patient list return every row; attaching an unknown or already-attached patient is refused. |
| `GestionRendezVousmedicApplicationTests` | 1 | The full Spring context — security filter chain, repositories and controllers — boots against H2. |

Two details worth noting:

- **`src/test/resources/application.properties`** overrides the datasource with H2 and supplies a
  test-only signing key, so the suite needs neither MySQL nor a real secret.
- **Surefire passes the Mockito agent explicitly** (`-javaagent:${org.mockito:mockito-core:jar}`).
  Java 21 and later restrict an agent attaching to its own JVM, which otherwise breaks the inline
  mock maker.

The Angular workspace is configured for Karma/Jasmine (`npm test`) but no specs are committed yet.

## Build and Packaging

```bash
./mvnw -DskipTests package      # → target/gestionrendezvousmedic-0.0.1-SNAPSHOT.jar
java -jar target/gestionrendezvousmedic-0.0.1-SNAPSHOT.jar

cd frontend && npm run build    # → frontend/dist/frontend  (~108 kB transferred, initial)
```

The backend packages as an executable Spring Boot fat JAR via `spring-boot-maven-plugin`. The
frontend builds to static assets with per-route lazy chunks.

There is **no Dockerfile, no Docker Compose file and no CI/CD pipeline** in the repository; both
artefacts are produced and run manually.

---

## Interface

Captured against the running stack with seeded data.

### Authentication and patient experience

| | |
|---|---|
| ![Login](docs/screenshots/01-login.png) | ![Appointments](docs/screenshots/03-patient-appointments.png) |
| **Sign-in** — role selector; the chosen role is sent to the API, which authenticates against that account type. | **My appointments** — live data from `/api/patient/dashboard`, split into upcoming and past. |

### Booking flow

| | |
|---|---|
| ![Booking step 1](docs/screenshots/04-booking-step1.png) | ![Slot selection](docs/screenshots/05-booking-slots.png) |
| **Step 1 — practitioner.** Only the attached practitioner can receive a request; others are shown but not selectable, mirroring the server-side rule. | **Step 4 — time slot.** The confirmed request is posted to `/api/patient/assign` and stored as `PENDING`. |

### Clinical surfaces

| | |
|---|---|
| ![Directory](docs/screenshots/06-doctors.png) | ![Practitioner profile](docs/screenshots/07-doctor-profile.png) |
| **Practitioner directory** — search, specialty, city, consultation type and sorting. | **Profile** — biography, qualifications, consultation types, availability and reviews. |
| ![Medical records](docs/screenshots/08-records.png) | ![Document preview](docs/screenshots/09-record-preview.png) |
| **Medical records** — categorised documents with search and status filters. | **Preview** — document viewer with an explicit demonstration-data notice. |
| ![Prescriptions](docs/screenshots/10-prescriptions.png) | ![Lab results](docs/screenshots/11-labs.png) |
| **Prescriptions** — active, completed and suspended, with treatment progress. | **Lab results** — each value shown against the laboratory's own reference range. |
| ![Result detail](docs/screenshots/12-lab-detail.png) | ![Messaging](docs/screenshots/13-messages.png) |
| **Result detail** — position within the reference band plus history. Status wording is neutral and never implies a diagnosis. | **Secure messaging** — conversations, attachments, and a persistent emergency notice. |
| ![Notifications](docs/screenshots/14-notifications.png) | ![Emergency information](docs/screenshots/15-settings-emergency.png) |
| **Notifications** — categorised, with read/unread state. | **Emergency information** — declared blood type, allergies, treatments and contacts. |

### Assistant

![Assistant](docs/screenshots/16-assistant.png)

The floating assistant posts to `/api/chat`, which runs `mistral` locally through langchain4j and
Ollama, grounded in the configured service description.

### Practitioner console

| | |
|---|---|
| ![Practitioner console](docs/screenshots/17-medecin-console.png) | ![Schedule](docs/screenshots/18-medecin-appointments.png) |
| **Console** — counters, the pending-request queue with accept/reject, recent consultations and the patient list. | **Schedule** — every appointment by status; accept, reject, reschedule or delete. |

![Patient list](docs/screenshots/19-medecin-patients.png)

**Patient list** — attaching a patient by email is the step that unlocks booking for that patient.

### Responsive

| Mobile — 390 px | Mobile — booking | Tablet — 768 px |
|---|---|---|
| ![Mobile dashboard](docs/screenshots/21-mobile-overview.png) | ![Mobile booking](docs/screenshots/22-mobile-booking.png) | ![Tablet directory](docs/screenshots/23-tablet-doctors.png) |

The sidebar is replaced by a bottom navigation bar below 1024 px, tables collapse into card lists,
and footer actions stack to full width rather than overflowing.

---

## Engineering Challenges

**Preventing horizontal privilege escalation.** A role check alone is not enough: every practitioner
holds `ROLE_MEDECIN`, so `@PreAuthorize` cannot distinguish one practitioner's appointments from
another's. The approach taken is to never accept an identifying id from the client — controllers
resolve the caller from the JWT subject, and every service method that mutates a row compares its
owner against that caller before proceeding.

**Modelling three user types without duplicating the account.** `JOINED` inheritance keeps one
identity, one email uniqueness domain and one `UserDetailsService`, while still giving `Medecin` its
`specialite` and `Patient` its practitioner link and appointment collection.

**Keeping the SPA honest about server-side rules.** The booking flow could have shown every
practitioner as selectable and let the server reject the request. Instead the UI reads the assigned
practitioner from the dashboard response and presents the others as informational, so the interface
expresses the same constraint the server enforces — while still handling the rejection path.

**Handling a partially-provisioned patient.** A patient with no practitioner gets a `404` from the
dashboard endpoint. Rather than surfacing an error, the client treats that specific status as a
distinct state and explains what has to happen next.

**Integrating a local model.** Running inference locally removes API keys and per-call cost but makes
the runtime a hard dependency. The assistant is isolated behind one public endpoint, and the client
degrades to an explanatory message when Ollama is absent, so no other feature depends on it.

**Renewing a session without a session store.** Enforcing a one-hour access token would have
logged users out mid-task. The fix is a refresh token with a longer life and a `typ` claim, plus an
interceptor that catches a `401`, exchanges the refresh token, replays the original request once,
and only tears the session down if that fails too — so the expiry is invisible until the refresh
token itself runs out.

**Making the test suite runnable anywhere.** The only test that existed needed a live MySQL. Adding
an H2 profile under `src/test/resources` and mocking the repositories brought the suite to 30 tests
that run on a clean checkout. Getting there also meant diagnosing a Mockito failure specific to
Java 21, where the inline mock maker can no longer attach an agent to its own JVM, and passing the
agent explicitly through Surefire instead.

**Type-mirroring an API without a shared schema.** With no OpenAPI generation, `core/models.ts`
mirrors the Java DTOs by hand — including the exact JSON property names Jackson derives from Lombok
getters (`nombreRendezvous`, `listerendezVous`, `listofclients`).

---

## Future Improvements

- **Frontend tests** — component specs for the guards, the interceptor's refresh path, and the
  booking flow's step transitions.
- **Web-layer tests** — `@WebMvcTest` slices asserting each role receives `403` on the other
  roles' endpoints, complementing the service-level tests.
- **Token revocation** — a server-side deny list so a refresh token can be invalidated before
  it expires (sign-out everywhere, credential compromise).
- **Migrations** — replace `ddl-auto=update` with Flyway before any shared environment.
- **Packaging** — a Dockerfile per service plus a Compose file covering MySQL, API and frontend.
- **CI** — build both halves and run the suite on push.

## Skills Demonstrated

**Backend** — Java 17 and Spring Boot 3; layered REST API (controller → service → repository);
Spring Data JPA with derived queries and JPA inheritance; transaction boundaries; centralised
exception handling with meaningful status codes; DTO-based API contracts.

**Security** — Spring Security filter chain configuration; a custom `OncePerRequestFilter` for JWT;
access/refresh token pair with a type claim that prevents substitution; BCrypt password hashing;
stateless session policy; CORS allow-listing; method-level authorisation with `@PreAuthorize`;
object-level ownership checks; Bean Validation at the trust boundary; secrets read from the
environment with fail-fast startup; reasoning about CSRF in a token-based API.

**Frontend** — Angular 20 with standalone components and signals; lazy-loaded, guard-protected
routes; a functional HTTP interceptor; typed API client mirroring backend DTOs; a hand-built CSS
design system with reusable primitives (modals, toasts, skeletons, empty states); responsive layouts
from 390 px to 1440 px; accessibility basics — semantic markup, labelled controls, visible focus
states, `aria` attributes on tabs and dialogs.

**Data** — relational modelling of a role hierarchy; nullable-association semantics driving
application behaviour; Hibernate mapping and schema generation.

**AI integration** — langchain4j against a locally hosted Mistral model via Ollama; prompt
construction with grounding text; input sanitisation; graceful degradation when the runtime is
unavailable.

**Testing** — JUnit 5 and Mockito unit tests targeting the authorisation and state-transition
rules rather than getters; regression tests pinned to real defects (id ordering, `Optional`
finders consumed as collections, `equals` recursion across a bidirectional association); an
in-memory H2 profile so the whole suite runs with no external service; diagnosing the Java 21
agent-attachment restriction that breaks Mockito's inline mock maker.

**Software engineering** — separating enforcement (server) from expression (client); consistent
error handling across the stack; configuration through the environment with fail-fast on a missing
secret; API design under real-world workflow constraints; documentation written for two audiences.

---

*Personal side project. Practitioner profiles, clinics, prices, reviews and all clinical data shown
in the screenshots are fictional demonstration content.*

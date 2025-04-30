# APQP/PPAP Manager - Task List

**Total Estimated Time:** ~7-14 days (highly dependent on developer experience and exact requirements)

**Overall Difficulty:** Medium-Hard (due to interconnectedness and history tracking)

**Note:** Ensure the database in `apqp_manager/settings.py` is correctly configured (likely PostgreSQL) before starting. Remember to implement history tracking for all Create, Update, Delete operations using the History model/service.

---

## 1. Department Management (CRUD)

*   **Estimate:** M
*   **Difficulty:** Medium
*   **Tasks:**
    *   **Create:** Implement API endpoint to create a new Department (name, responsible person, team association). Generate `historyId`.
    *   **Edit:** Implement API endpoint to update Department details. Track changes in History.
    *   **Delete:** Implement API endpoint to delete a Department. Check for dependencies (assigned persons) before deletion. Track deletion in History.
    *   **Get:** Implement API endpoints to list Departments (with filters) and retrieve single Department details (including members, teams).
*   **Hints:** Use DRF `ModelViewSet`. Handle relationships to User (responsible) and Team. Implement dependency checks in the delete method.
*   **Relevant Files:**
    *   `core/models/organization/department.py` (Define Model)
    *   `core/serializers/department_serializer.py` (Define Serializer)
    *   `core/views/department_view.py` (Define ViewSet - *Needs Creation*)
    *   `core/urls.py` (Register URL)
    *   `core/models/history.py` (For tracking)
    *   `core/services/history/` (Service for history creation - *if exists*)

---

## 2. Team Management (CRUD)

*   **Estimate:** M
*   **Difficulty:** Medium
*   **Tasks:**
    *   **Create:** Implement API endpoint to create a Team (name, description, members, department association). Generate `historyId`.
    *   **Edit:** Implement API endpoint to update Team details and manage membership/roles. Track changes in History.
    *   **Delete:** Implement API endpoint to delete a Team. Check for dependencies (active projects). Handle member reassignment/retention. Track deletion in History.
    *   **Get:** Implement API endpoints to list Teams (with filters) and retrieve single Team details (members, projects, history).
*   **Hints:** Use DRF `ModelViewSet`. Manage ManyToMany relationships (members, departments). Implement dependency checks.
*   **Relevant Files:**
    *   `core/models/organization/team.py` (Define Model)
    *   `core/serializers/team_serializer.py` (Define Serializer)
    *   `core/views/team_view.py` (Define ViewSet)
    *   `core/urls.py` (Register URL)
    *   `core/models/history.py`
    *   `core/models/organization/person.py` (Team members)
    *   `core/models/organization/department.py` (Association)

---

## 3. Person Management (CRUD)

*   **Estimate:** M
*   **Difficulty:** Medium
*   **Tasks:**
    *   **Create:** Implement API endpoint to create a Person (name, contact details via Contact model, team/department assignment, isUser flag). Generate `personId`, `contactId`, `historyId`.
    *   **Edit:** Implement API endpoint to update Person details, assignments, and contact info. Track changes in History.
    *   **Delete:** Implement API endpoint to delete a Person. Check dependencies. Handle associated User and Contact records. Track deletion in History.
    *   **Get:** Implement API endpoints to list Persons (with filters) and retrieve single Person details (affiliations, assignments).
*   **Hints:** Use DRF `ModelViewSet`. Handle the creation/linking of the associated `Contact` record. Consider implications if `isUser` is true (linking to `core.User`).
*   **Relevant Files:**
    *   `core/models/organization/person.py` (Define Model)
    *   `core/serializers/person_serializer.py` (Define Serializer)
    *   `core/views/person_view.py` (Define ViewSet - *Needs Creation*)
    *   `core/urls.py` (Register URL)
    *   `core/models/organization/contact.py` (Associated Contact)
    *   `core/models/organization/team.py` (Assignment)
    *   `core/models/organization/department.py` (Assignment)
    *   `core/models/history.py`

---

## 4. Contact Management (CRUD)

*   **Estimate:** S
*   **Difficulty:** Easy-Medium
*   **Tasks:**
    *   **Create:** Implement API endpoint to create Contact details, linking to a Person, Client, or User based on type. Generate `contactId`.
    *   **Edit:** Implement API endpoint to update Contact details. Track changes in History.
    *   **Delete:** Implement API endpoint to delete a Contact. Check dependencies. Track deletion in History.
    *   **Get:** Implement API endpoints to list Contacts (with filters) and retrieve single Contact details.
*   **Hints:** This model seems primarily for storing address/phone/email. Ensure it links correctly to the parent entity (Person/Client/User). History tracking might be less critical here unless contact changes need auditing.
*   **Relevant Files:**
    *   `core/models/organization/contact.py` (Define Model)
    *   `core/serializers/contact_serializer.py` (Define Serializer)
    *   `core/views/contact_view.py` (Define ViewSet - *Needs Creation*)
    *   `core/urls.py` (Register URL)
    *   `core/models/history.py`

---

## 5. Client Management (CRUD)

*   **Estimate:** M
*   **Difficulty:** Medium
*   **Tasks:**
    *   **Create:** Implement API endpoint to create a Client (name, address, codes, primary contact, client team). Generate `clientId`, `historyId`. Create associated Contact.
    *   **Edit:** Implement API endpoint to update Client details, contact info, team association. Track changes in History.
    *   **Delete:** Implement API endpoint to delete a Client. Check dependencies (active projects). Handle associated team/contacts. Track deletion in History.
    *   **Get:** Implement API endpoints to list Clients (with filters) and retrieve single Client details (contacts, team, projects).
*   **Hints:** Use DRF `ModelViewSet`. Handle creation/linking of Contact and potentially Team. Implement dependency checks.
*   **Relevant Files:**
    *   `core/models/project/client.py` (Define Model)
    *   `core/serializers/client_serializer.py` (Define Serializer)
    *   `core/views/client_view.py` (Define ViewSet)
    *   `core/urls.py` (Register URL)
    *   `core/models/organization/contact.py` (Associated Contact)
    *   `core/models/organization/team.py` (Associated Team)
    *   `core/models/history.py`

---

## 6. Phase Template Management (CRUD)

*   **Estimate:** M
*   **Difficulty:** Medium
*   **Tasks:**
    *   **Create:** Implement API endpoint to create Phase Templates (name, description, order, duration, PPAP level association).
    *   **Edit:** Implement API endpoint to update Phase Templates. Consider versioning.
    *   **Delete:** Implement API endpoint to delete Phase Templates. Check usage in active projects (may need archiving or replacement logic).
    *   **Get:** Implement API endpoints to list Phase Templates (with filters) and retrieve details (associated Output Templates).
*   **Hints:** Use DRF `ModelViewSet`. Define relationships to PPAP Levels and Output Templates. Deletion logic needs care.
*   **Relevant Files:**
    *   `core/models/phase/template.py` (Define Model)
    *   `core/serializers/phase_template_serializer.py` (Define Serializer)
    *   `core/views/phase_template_view.py` (Define ViewSet - *Needs Creation*)
    *   `core/urls.py` (Register URL)
    *   `core/models/output/template.py` (Association)
    *   `core/models/ppap/ppap.py` (PPAP Level Association - *Verify model*)

---

## 7. Output Template Management (CRUD)

*   **Estimate:** M
*   **Difficulty:** Medium
*   **Tasks:**
    *   **Create:** Implement API endpoint to create Output Templates (name, phase template association, PPAP element link, configuration, document requirements).
    *   **Edit:** Implement API endpoint to update Output Templates. Consider versioning.
    *   **Delete:** Implement API endpoint to delete Output Templates. Check usage.
    *   **Get:** Implement API endpoints to list Output Templates (with filters) and retrieve details.
*   **Hints:** Use DRF `ModelViewSet`. Handle associations (Phase Template, PPAP Element). Configuration might be a JSONField.
*   **Relevant Files:**
    *   `core/models/output/template.py` (Define Model)
    *   `core/serializers/output_template_serializer.py` (Define Serializer)
    *   `core/views/output_template_view.py` (Define ViewSet - *Needs Creation*)
    *   `core/urls.py` (Register URL)
    *   `core/models/phase/template.py` (Association)
    *   `core/models/ppap/element.py` (PPAP Element Association)

---

## 8. Document Management (CRUD)

*   **Estimate:** L
*   **Difficulty:** Hard
*   **Tasks:**
    *   **Create:** Implement API endpoint for file upload, storing the file (check `MEDIA_ROOT`), creating Document record (metadata, version, output association, status). Generate `documentId`, `historyId`.
    *   **Edit:** Implement API endpoint to upload new versions (replace file, update version, retain old versions if needed) and update metadata. Track changes in History.
    *   **Delete:** Implement API endpoint to delete Document record and optionally the file. Check permissions/status. Track deletion in History.
    *   **Get:** Implement API endpoints to list Documents (with filters), retrieve details (version history), and download files.
*   **Hints:** Use DRF `ModelViewSet` with file upload handling (`parsers.MultiPartParser`). Configure `MEDIA_URL` and `MEDIA_ROOT` in `settings.py`. Implement versioning logic. Secure file downloads.
*   **Relevant Files:**
    *   `core/models/output/document.py` (Define Model)
    *   `core/serializers/document_serializer.py` (Define Serializer)
    *   `core/views/document_view.py` (Define ViewSet)
    *   `core/urls.py` (Register URL)
    *   `core/models/output/output.py` (Association - *Verify model*)
    *   `core/models/history.py`
    *   `apqp_manager/settings.py` (MEDIA settings)

---

## 9. Todo Management (CRUD)

*   **Estimate:** M
*   **Difficulty:** Medium
*   **Tasks:**
    *   **Create:** Implement API endpoint to create a Todo item, linking User and Output, setting permissions. Notify user (optional).
    *   **Edit:** Implement API endpoint to update assigned user, permissions, status (in progress, completed), priority.
    *   **Delete:** Implement API endpoint to delete a Todo. Check permissions.
    *   **Get:** Implement API endpoints to list Todos (personal list, all todos for admin) with filters (status, user, output) and retrieve details.
*   **Hints:** Use DRF `ModelViewSet`. Filter lists based on the requesting user. Consider how notifications would be implemented (email, in-app).
*   **Relevant Files:**
    *   `core/models/organization/todo.py` (Define Model)
    *   `core/serializers/todo_serializer.py` (Define Serializer)
    *   `core/views/todo_view.py` (Define ViewSet - *Needs Creation*)
    *   `core/urls.py` (Register URL)
    *   `core.User` (Assignee)
    *   `core/models/output/output.py` (Association - *Verify model*)

---

## 10. History Tracking Module (Get/Delete)

*   **Estimate:** S
*   **Difficulty:** Easy-Medium
*   **Tasks:**
    *   **(Create):** This is implicitly done when implementing CUD operations for other models. Ensure the history service/logic is called correctly.
    *   **Delete:** Implement API endpoint for *admins* to delete history records (potentially with warnings).
    *   **Get:** Implement API endpoints to list History records (chronological, with filters by entity, user, date, event type) and view details (including before/after for edits if stored). Implement Timeline view if required.
*   **Hints:** Use DRF `ReadOnlyModelViewSet` or custom views. Implement robust filtering. Admin permission required for deletion.
*   **Relevant Files:**
    *   `core/models/history.py` (Define Model)
    *   `core/serializers/history_serializer.py` (Define Serializer)
    *   `core/views/history_view.py` (Define ViewSet)
    *   `core/urls.py` (Register URL)
    *   `core/services/history/` (Service for history creation - *if exists*)

# TODO (Prescription + Upload Records Fix)

- [x] Fix FormData upload failing by removing forced `Content-Type: application/json` header in `frontend/src/services/api.js` (multipart needs browser to set boundary).
- [ ] Ensure UploadRecordModal sends correct fields (`file`, `patientId`, `type`, `description`).
- [ ] Add basic frontend error logging for upload/prescription requests (optional, only if needed).
- [ ] Verify prescription fetching/creation endpoints: `/api/prescriptions/create` and `/api/prescriptions/my`.
- [ ] Verify doctor record upload endpoint: `POST /api/doctors/records`.
- [ ] Run backend + frontend and confirm:
  - Create prescription works
  - Upload record works
  - Patient detail modal shows records (if UI wired)

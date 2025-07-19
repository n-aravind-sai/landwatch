# Landwatch

Landwatch is a full-stack land monitoring platform that enables users to monitor land plots for changes using satellite imagery, receive alerts, upload and manage documents, and visualize data on an interactive map. It integrates a Node.js/Express backend, a React/TypeScript frontend, and a Python-based ML microservice for change detection using Google Earth Engine.

---

## Features
- **User Authentication:** Secure registration and login with JWT.
- **Plot Management:** Create, view, and monitor land plots.
- **Document Management:** Upload, download, and view documents (stored in AWS S3) with user-specific access.
- **Change Detection:** Manual and automated detection of land changes using Sentinel-2 imagery and NDVI, powered by a Python ML service.
- **Alerts & Notifications:** Automated and manual alerts for detected changes, with email notifications (via SMTP/Nodemailer).
- **Interactive Map:** Visualize plots, changes, and alerts using React-Leaflet.
- **Modern UI:** Built with React, Tailwind CSS, and shadcn/ui for a monitoring dashboard experience.

---

## Architecture
- **Backend:** Node.js, Express, MongoDB (Mongoose), AWS S3, Nodemailer, JWT, Multer-S3
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React-Leaflet
- **ML Service:** Python, FastAPI, Google Earth Engine, Uvicorn

```
[Frontend] <-> [Backend API] <-> [MongoDB, S3, ML Service]
                                 |
                                 +--> [ML Service (FastAPI, GEE)]
```

---

## Setup & Local Development

### 1. Clone the Repository
```sh
git clone <YOUR_GIT_URL>
cd landwatch
```

### 2. Environment Variables
Create `.env` files in `backend/` and `ml_service/`:

**backend/.env**
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
ML_SERVICE_URL=http://localhost:8000
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_bucket
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM=alerts@landwatch.com
ADMIN_EMAIL=admin@landwatch.com
```

**ml_service/.env**
```
GEE_JSON_B64=your_base64_encoded_gee_service_account_json
```

### 3. Install Dependencies
- **Backend:**
  ```sh
  cd backend
  npm install
  ```
- **Frontend:**
  ```sh
  cd ../frontend
  npm install
  ```
- **ML Service:**
  ```sh
  cd ../ml_service
  pip install -r requirements.txt
  pip install uvicorn
  ```

### 4. Run Services Locally
- **ML Service:**
  ```sh
  cd ml_service
  uvicorn main:app --host 0.0.0.0 --port 8000
  ```
- **Backend:**
  ```sh
  cd backend
  npm run dev
  ```
- **Frontend:**
  ```sh
  cd frontend
  npm run dev
  ```

---

## Docker & Production Deployment

### 1. Build and Run with Docker Compose
Create `Dockerfile` and `docker-compose.yml` as described in the deployment section above.

```sh
docker-compose up --build -d
```

### 2. Access
- **Backend API:** http://localhost:5000
- **Frontend:** http://localhost:8080 (if served separately)
- **ML Service:** http://localhost:8000/health-check

---

## Troubleshooting
- **ML Service errors:** Ensure `uvicorn` is installed and `GEE_JSON_B64` is set.
- **Email issues:** Check SMTP credentials and network access.
- **S3 issues:** Verify AWS credentials and bucket permissions.
- **Frontend API errors:** Ensure Vite proxy is set and backend is reachable.

---

## Credits
- Satellite imagery: [Google Earth Engine](https://earthengine.google.com/)
- UI: [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- Map: [React-Leaflet](https://react-leaflet.js.org/)

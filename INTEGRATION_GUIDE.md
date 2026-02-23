# คู่มือการเชื่อมต่อ Frontend กับ Backend

## ภาพรวม

โปรเจกต์นี้มี 2 ส่วนหลัก:
- **Frontend**: Next.js 14 (TypeScript, React, Tailwind CSS)
- **Backend**: FastAPI (Python, ML Model, RAG Service)

## สถาปัตยกรรม

```
Frontend (Next.js)
    ↓
Option 1: Direct API Call → FastAPI Backend
    ↓
Option 2: Next.js API Route (Proxy) → FastAPI Backend
    ↓
ML Service + RAG Service
```

## การตั้งค่า Backend

### 1. ติดตั้ง Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `backend/.env`:

```env
# ML Model Endpoint
ML_ENDPOINT_URL=https://your-ml-endpoint.com/predict
ML_API_KEY=your-api-key-here

# LLM API Keys (ต้องมีอย่างน้อย 1 อัน)
OPENAI_API_KEY=sk-...
# หรือ
ANTHROPIC_API_KEY=sk-ant-...

# Frontend URL (สำหรับ CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. รัน Backend Server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Backend จะรันที่: http://localhost:8000

## การตั้งค่า Frontend

### 1. ติดตั้ง Dependencies

```bash
cd frontend
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `frontend/.env.local`:

```env
# สำหรับ Option 1: เรียก Backend โดยตรง
NEXT_PUBLIC_API_URL=http://localhost:8000

# สำหรับ Option 2: ผ่าน Next.js API Route
BACKEND_URL=http://localhost:8000
```

### 3. รัน Frontend Server

```bash
cd frontend
npm run dev
```

Frontend จะรันที่: http://localhost:3000

## วิธีการเชื่อมต่อ

### Option 1: เรียก Backend โดยตรง (แนะนำสำหรับ Development)

**ข้อดี:**
- ง่ายและรวดเร็ว
- ไม่ต้องผ่าน middleware
- เหมาะสำหรับ development

**ข้อเสีย:**
- ต้องตั้งค่า CORS ใน backend
- API key จะถูกเปิดเผยใน browser (ถ้ามี)

**วิธีใช้:**

ใน `frontend/app/page.tsx` ให้ uncomment โค้ดส่วน Option 2:

```typescript
// Option 2: Call backend API
const inputText = JSON.stringify(data);
const prediction = await predictCredit(inputText, data);

const score: CreditScore = {
  score: Math.round(prediction.confidence * 1000),
  grade: prediction.confidence >= 0.8 ? 'Excellent' : 
         prediction.confidence >= 0.65 ? 'Good' : 
         prediction.confidence >= 0.5 ? 'Fair' : 'Poor',
  factors: [prediction.explanation]
};
```

### Option 2: ผ่าน Next.js API Route (แนะนำสำหรับ Production)

**ข้อดี:**
- ปลอดภัยกว่า (API key ซ่อนอยู่ใน server)
- ไม่มีปัญหา CORS
- สามารถเพิ่ม caching, rate limiting ได้

**ข้อเสีย:**
- มี latency เพิ่มขึ้นเล็กน้อย
- ต้องจัดการ error handling 2 ชั้น

**วิธีใช้:**

แก้ไข `frontend/utils/api.ts`:

```typescript
const API_BASE_URL = '/api'; // เปลี่ยนจาก backend URL เป็น Next.js API

export async function predictCredit(
  inputText: string,
  extraFeatures?: Record<string, any>
): Promise<PredictResponse> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input_text: inputText,
      extra_features: extraFeatures,
    }),
  });
  // ... rest of the code
}
```

## API Endpoints

### Backend (FastAPI)

#### POST /predict
คำนวณ credit score และสร้างคำอธิบาย

**Request:**
```json
{
  "input_text": "JSON string of credit data",
  "extra_features": {
    "Sex": "Male",
    "Salary": "50000",
    ...
  }
}
```

**Response:**
```json
{
  "prediction": "approved",
  "confidence": 0.85,
  "shap_values": {
    "Salary": 0.25,
    "outstanding": -0.15,
    ...
  },
  "explanation": "Based on your financial profile..."
}
```

#### GET /health
ตรวจสอบสถานะของ backend

**Response:**
```json
{
  "status": "healthy"
}
```

### Frontend API Routes (Next.js)

#### POST /api/predict
Proxy ไปยัง backend /predict

#### GET /api/health
ตรวจสอบสถานะของทั้ง frontend และ backend

## การทดสอบ

### 1. ทดสอบ Backend

```bash
# ทดสอบ health endpoint
curl http://localhost:8000/health

# ทดสอบ predict endpoint
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "test",
    "extra_features": {
      "Sex": "Male",
      "Salary": "50000",
      "outstanding": "10000",
      "overdue": "0"
    }
  }'
```

### 2. ทดสอบ Frontend

เปิด browser ไปที่ http://localhost:3000 และกรอกฟอร์ม

### 3. ตรวจสอบ Console

- Backend logs: ดูใน terminal ที่รัน uvicorn
- Frontend logs: ดูใน browser console (F12)

## Troubleshooting

### CORS Error
**ปัญหา:** Browser แสดง CORS error

**แก้ไข:**
1. ตรวจสอบว่า `FRONTEND_URL` ใน backend/.env ถูกต้อง
2. ตรวจสอบว่า backend มี CORS middleware
3. ลองใช้ Option 2 (Next.js API Route) แทน

### Connection Refused
**ปัญหา:** Frontend ไม่สามารถเชื่อมต่อ backend

**แก้ไข:**
1. ตรวจสอบว่า backend รันอยู่ที่ port 8000
2. ตรวจสอบ `NEXT_PUBLIC_API_URL` หรือ `BACKEND_URL` ใน .env.local
3. ลอง curl ทดสอบ backend โดยตรง

### ML Endpoint Error
**ปัญหา:** Backend ส่ง 502/503 error

**แก้ไข:**
1. ตรวจสอบ `ML_ENDPOINT_URL` ใน backend/.env
2. ตรวจสอบว่า ML endpoint พร้อมใช้งาน
3. ตรวจสอบ `ML_API_KEY` ถูกต้อง

### LLM API Error
**ปัญหา:** RAG service ไม่ทำงาน

**แก้ไข:**
1. ตรวจสอบ `OPENAI_API_KEY` หรือ `ANTHROPIC_API_KEY`
2. ตรวจสอบ API quota/credits
3. ดู error logs ใน backend terminal

## Production Deployment

### Backend (FastAPI)

แนะนำ deploy บน:
- Railway
- Render
- Google Cloud Run
- AWS Lambda (with Mangum)

### Frontend (Next.js)

แนะนำ deploy บน:
- Vercel (แนะนำ)
- Netlify
- Railway

### Environment Variables

อย่าลืมตั้งค่า environment variables ใน production:
- Backend: ML_ENDPOINT_URL, ML_API_KEY, OPENAI_API_KEY, FRONTEND_URL
- Frontend: NEXT_PUBLIC_API_URL หรือ BACKEND_URL

## สรุป

1. รัน backend ที่ port 8000
2. รัน frontend ที่ port 3000
3. เลือกใช้ Option 1 (direct) หรือ Option 2 (proxy)
4. ตั้งค่า environment variables ให้ครบ
5. ทดสอบการเชื่อมต่อ

หากมีปัญหา ให้ตรวจสอบ logs และ environment variables ก่อน

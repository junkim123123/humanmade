# 🔧 NexSupply 문제 해결 가이드

## Gemini API 키 오류 해결

### 문제: "API key not valid"

**원인:** 환경 변수 이름 불일치
- `.env.local`에 `GOOGLE_GEMINI_API_KEY`로 설정됨
- 코드는 `GEMINI_API_KEY`를 사용

**해결 방법:**

1. ✅ 환경 변수 이름 수정 완료
   - `.env.local` 파일의 `GOOGLE_GEMINI_API_KEY`를 `GEMINI_API_KEY`로 변경했습니다.

2. **서버 재시작 필요**
   ```bash
   # 터미널에서 Ctrl+C로 서버 중지 후
   npm run dev
   ```

3. **환경 변수 확인**
   `.env.local` 파일에 다음이 있는지 확인:
   ```bash
   GEMINI_API_KEY="your-api-key-here"
   ```

### API 키 발급 방법

1. https://aistudio.google.com/app/apikey 접속
2. "Create API Key" 클릭
3. API 키 복사
4. `.env.local` 파일에 `GEMINI_API_KEY="복사한-키"` 형식으로 저장

### 추가 확인 사항

- ✅ API 키가 올바르게 복사되었는지 확인 (따옴표 포함)
- ✅ `.env.local` 파일이 프로젝트 루트(`nexsupply/`)에 있는지 확인
- ✅ 서버를 재시작했는지 확인

---

## 기타 일반적인 오류

### "Failed to fetch image"
- 이미지 URL이 공개적으로 접근 가능한지 확인
- CORS 문제일 수 있음

### "No supplier matches found"
- Supabase에 테스트 데이터가 있는지 확인
- `supabase/seed_data.sql` 실행

### "Row Level Security policy violation"
- Supabase 인증 설정 확인
- RLS 정책 확인

### Storage bucket missing or upload fails
- Ensure a bucket named `uploads` exists in Supabase Dashboard → Storage.
- For cloud projects, create buckets in the Dashboard (recommended). We do not call `storage.create_bucket` in SQL.
- App uploads to the `uploads` bucket under the user-id prefix. If the bucket is missing, the UI will show a clear error message on analyze submit.


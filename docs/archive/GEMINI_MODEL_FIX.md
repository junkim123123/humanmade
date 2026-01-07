# 🔧 Gemini 모델 이름 수정 가이드

## 문제
`gemini-1.5-flash` 모델이 `v1beta` API에서 찾을 수 없어 404 에러 발생

## 해결 방법

### 현재 수정 사항
모델 이름을 `gemini-pro-vision`으로 변경했습니다. 이 모델은 이미지 분석을 지원합니다.

### 다른 옵션들

만약 `gemini-pro-vision`도 작동하지 않는다면, 다음 모델들을 시도해보세요:

1. **gemini-1.5-pro** (최신 모델)
   ```typescript
   const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
   ```

2. **gemini-pro** (기본 모델, 이미지 지원 제한적)
   ```typescript
   const model = genAI.getGenerativeModel({ model: "gemini-pro" });
   ```

### 사용 가능한 모델 확인

API 키로 사용 가능한 모델을 확인하려면:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const models = await genAI.listModels();
console.log(models);
```

### API 키 권한 확인

1. https://aistudio.google.com/app/apikey 접속
2. API 키의 권한 확인
3. Vision API 접근 권한이 있는지 확인

### 참고
- 최신 Gemini API 문서: https://ai.google.dev/docs
- 모델 목록: https://ai.google.dev/models


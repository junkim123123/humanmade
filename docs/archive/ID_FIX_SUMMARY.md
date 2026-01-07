# ID 불일치 문제 해결 패치

## 문제
- `/api/analyze`에서 저장은 성공하지만
- `/api/reports/{id}`에서 DB에서 못 찾아서 mock fallback으로 떨어짐
- 저장한 id와 조회할 때 사용하는 id가 다르거나, 조회가 다른 클라이언트를 사용

## 해결책

### 1. analyze 저장을 "DB가 돌려준 id"로 확정
- **변경 전**: reportId를 먼저 만들고, lookup하고, 그 다음 upsert
- **변경 후**: upsert 후 `.select("id").single()`로 DB가 최종 id를 돌려주게 함
- **결과**: 같은 `input_key`면 항상 같은 id (dedupe 자동 충족)

### 2. reports 조회는 admin client로 고정
- **변경 전**: `createClient()` 사용 (RLS 영향 가능)
- **변경 후**: `createAdminClient()` 사용 (RLS 우회)
- **결과**: mock fallback 로그 사라짐

### 3. mock fallback 제거
- **변경 전**: 개발 환경에서 mock fallback 사용
- **변경 후**: mock fallback 완전 제거, DB가 source of truth

## 변경된 파일

### `src/app/api/analyze/route.ts`
```typescript
// 변경 전: id를 미리 만들고 upsert
const reportId = existingReport?.id ?? crypto.randomUUID();
await supabaseAdmin.from("reports").upsert({ id: reportId, ... });

// 변경 후: id 없이 upsert하고 DB가 돌려준 id 사용
const payload = { input_key: inputKey, ... }; // id 제외
const { data: upserted } = await supabaseAdmin
  .from("reports")
  .upsert(payload, { onConflict: "input_key" })
  .select("id")
  .single();
const finalReportId = upserted.id; // DB가 돌려준 실제 id
```

### `src/app/api/reports/[reportId]/route.ts`
```typescript
// 변경 전: createClient() 사용, mock fallback 있음
const supabase = await createClient();
if (error || !reportData) {
  if (process.env.NODE_ENV === "development") {
    const mockReport = getMockReport(reportId);
    // ...
  }
}

// 변경 후: createAdminClient() 사용, mock fallback 없음
const supabaseAdmin = createAdminClient();
const { data: reportData, error } = await supabaseAdmin
  .from("reports")
  .select("*")
  .eq("id", reportId)
  .maybeSingle();
// DB가 source of truth, validation/repair 제거
```

## 테스트 체크리스트

1. **분석 1회 실행 후 reports 테이블에 row 생성 확인**
   ```sql
   SELECT id, input_key, created_at
   FROM public.reports
   ORDER BY created_at DESC
   LIMIT 5;
   ```

2. **같은 입력으로 2회 실행 시 reportId 동일 확인**
   - 같은 이미지, 같은 파라미터로 2번 실행
   - 같은 `reportId`로 라우팅되는지 확인
   - 서버 로그에 "Report saved successfully: {id}" 메시지 확인

3. **mock fallback 로그가 사라졌는지 확인**
   - 서버 로그에서 `[API] Report not found in DB, trying mock fallback` 메시지 없음
   - 모든 리포트가 DB에서 조회됨

4. **화면에서 리포트가 완전히 로드되는지 확인**
   - 리포트 카드 1개만 있고 나머지가 비어 보이는 현상 해결
   - 모든 섹션이 정상적으로 표시됨

## 핵심 계약 (고정된 규칙)

1. **analyze 응답은 reportId를 준다** (DB가 돌려준 실제 id)
2. **reports는 reportId로 항상 DB에서 꺼낸다** (admin client 사용)
3. **mock fallback은 개발에서도 웬만하면 꺼둔다** (DB가 source of truth)

이 3개가 고정되면, 이제부터 바뀌는 건 "내용 퀄리티"만 남고 시스템이 안 흔들림.


# UI 및 저장/조회 안정화 패치

## 문제
1. 저장은 성공했는데 조회가 가끔 DB에서 안 잡힘
2. UI가 슬라이드 덱이라 첫 화면이 "Product" 슬라이드만 크게 떠서 내용이 없는 것처럼 보임

## 해결책

### 1. 저장 후 readback으로 검증
- `/api/analyze`에서 저장 후 즉시 readback으로 실제 저장 여부 확인
- `savedReport` 플래그를 readback 결과로 설정
- Supabase URL 불일치 감지 가능

### 2. `/api/reports` 에러 로깅 강화
- 상세한 에러 로그 추가
- 404 시 "NOT_FOUND" 에러 코드 반환
- Supabase URL 불일치 가능성 로그에 명시

### 3. UI 구조 개선
- **Product 슬라이드 제거**: Summary 위로 Product confirmation block 통합
- **빈 슬라이드 조건부 렌더**: HS Code, Suppliers는 데이터 있을 때만 표시
- **SlideShell 정렬 변경**: 가운데 정렬 → 위 정렬 (`justify-start`)
- **자동 스크롤**: 페이지 로드 시 Summary로 자동 스크롤

## 변경된 파일

### `src/app/api/analyze/route.ts`
```typescript
// 저장 후 readback으로 검증
const { data: readback, error: readbackError } = await supabaseAdmin
  .from("reports")
  .select("id,input_key")
  .eq("id", finalReportId)
  .maybeSingle();

const savedReport = !!readback?.id && !readbackError;
```

### `src/app/api/reports/[reportId]/route.ts`
```typescript
// 에러 로깅 강화
if (error) {
  console.error("[Reports API] Read error:", error);
  console.error("[Reports API] ReportId:", reportId);
  console.error("[Reports API] Error details:", JSON.stringify(error, null, 2));
}

if (!reportData) {
  console.error("[Reports API] Report not found, reportId:", reportId);
  console.error("[Reports API] This may indicate a Supabase URL mismatch or the report was never saved");
  return NextResponse.json(
    { success: false, error: "NOT_FOUND" },
    { status: 404 }
  );
}
```

### `src/components/report/SlideShell.tsx`
```typescript
// 위 정렬로 변경
<div className="max-w-7xl mx-auto px-6 pt-8 md:pt-10 pb-10 md:pb-12 flex-1 flex flex-col justify-start">
```

### `src/app/reports/[reportId]/ReportClient.tsx`
- Product 슬라이드 제거, Summary에 통합
- 조건부 렌더링: `hasHs`, `hasSuppliers` 체크
- 자동 스크롤: 페이지 로드 시 Summary로 이동
- 섹션 인덱스 재조정

## 테스트 체크리스트

1. **저장 후 readback 확인**
   - 서버 로그에 "Save readback OK" 메시지 확인
   - `savedReport: true` 응답 확인

2. **Supabase URL 불일치 감지**
   - 서버 로그에 "Save readback failed" 메시지가 있으면 환경변수 확인
   - `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`의 URL 일치 확인

3. **UI 개선 확인**
   - 페이지 로드 시 Summary로 자동 스크롤
   - Product 슬라이드 없음 (Summary 상단에 통합)
   - 빈 슬라이드(HS Code, Suppliers)는 데이터 있을 때만 표시
   - 카드 밀도 증가로 내용이 더 잘 보임

4. **Supabase에서 직접 확인**
   ```sql
   SELECT id, input_key, created_at
   FROM public.reports
   WHERE id = '{reportId}';
   ```

## 핵심 개선사항

1. **저장 검증**: readback으로 실제 저장 여부 확인
2. **에러 진단**: 상세한 로그로 문제 원인 파악 가능
3. **UI 밀도**: 빈 공간 제거, 내용 중심 레이아웃
4. **조건부 렌더링**: 데이터가 있는 섹션만 표시


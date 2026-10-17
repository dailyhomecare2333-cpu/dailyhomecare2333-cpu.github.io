/**
 * 데일리홈케어 견적 문의 → 구글 스프레드시트 저장 + 이메일 알림
 *
 * 설치 순서
 *  1) 구글 스프레드시트를 새로 만든다 (이름 예: 데일리홈케어 견적문의)
 *  2) 메뉴 [확장 프로그램] → [Apps Script] 를 열고, 기존 내용을 지운 뒤 이 파일 전체를 붙여 넣고 저장
 *  2-1) 함수 목록에서 setupTest 를 골라 [실행] → 권한 승인 → 테스트 메일이 오는지 확인
 *  3) 오른쪽 위 [배포] → [새 배포] → 유형 "웹 앱"
 *       - 실행 계정 : 나
 *       - 액세스 권한 : 모든 사용자
 *     [배포] 를 누르고 권한 요청을 승인한다
 *  4) 나오는 "웹 앱 URL" (https://script.google.com/macros/s/…/exec) 을 복사
 *  5) inquiry.html 의 <form … action="FORM_ENDPOINT_HERE"> 에서 FORM_ENDPOINT_HERE 를 그 URL 로 교체
 *
 * 코드를 고친 뒤에는 [배포] → [배포 관리] → 연필 아이콘 → 버전 "새 버전" 으로 다시 배포해야 반영됩니다.
 */
const SHEET_NAME = '견적문의';
const NOTIFY_EMAIL = 'jwe9787@naver.com';   // 새 문의 알림을 받을 주소 (쉼표로 여러 개 가능)

const HEADERS = ['접수일시', '서비스', '함께 진행', '지역', '시·구·동', '건물 형태', '크기',
                 '희망 작업일', '이름', '연락처', '전달 내용', '개인정보 동의', '처리 상태'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const p = e.parameter || {};
    const multi = e.parameters || {};
    if (p.company_site) return json({ ok: true });                 // 자동 입력 봇은 조용히 무시
    if (!p.name || !p.phone || !p.service || p.agree !== '동의') {
      return json({ ok: false, error: '필수 항목 누락' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }

    const addon = (multi.addon || []).join(', ');
    const row = [new Date(), p.service, addon, p.region, p.area, p.building, p.size,
                 p.date, p.name, p.phone, p.memo, p.agree, '상담 대기'].map(safe);
    sheet.appendRow(row);

    // 알림 메일은 따로 처리 : 메일이 실패해도(하루 100통 한도 등) 접수는 이미 시트에 저장됐으므로 고객에게는 접수 완료로 안내
    if (NOTIFY_EMAIL) {
      try {
        const lines = HEADERS.map(function (h, i) {
          return h + ' : ' + (i === 0 ? Utilities.formatDate(row[0], 'Asia/Seoul', 'yyyy-MM-dd HH:mm') : (row[i] || '-'));
        });
        MailApp.sendEmail(NOTIFY_EMAIL,
          '[견적 문의] ' + p.service + ' · ' + p.region + ' ' + (p.area || ''),
          lines.join('\n') + '\n\n시트 열기 : ' + ss.getUrl());
      } catch (mailErr) {
        sheet.getRange(sheet.getLastRow(), HEADERS.length).setValue('상담 대기 (메일 알림 실패)');
      }
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 처음 한 번 편집기에서 실행 : 위쪽 함수 목록에서 setupTest 를 고르고 [실행]
 *  - 권한 요청 창이 뜨면 대표님 계정으로 승인
 *  - '견적문의' 시트에 제목 줄을 만들고, 알림 주소로 테스트 메일을 보냄
 *  - 메일이 오면 연결 준비 완료. 그다음 [배포] → [새 배포] 진행
 */
function setupTest() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#111F44').setFontColor('#FFFFFF');
    sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
  }
  MailApp.sendEmail(NOTIFY_EMAIL, '[견적 문의] 연결 테스트',
    '홈페이지 견적 문의 연결 테스트 메일입니다. 이 메일이 보이면 알림 설정이 끝난 것입니다.\n\n시트 열기 : ' + ss.getUrl());
  Logger.log('완료: 시트 제목 줄 확인, 테스트 메일 발송 → ' + NOTIFY_EMAIL);
}

/** 시트에서 수식으로 실행될 수 있는 입력(=, +, -, @ 로 시작)은 글자로만 저장 */
function safe(v) {
  if (v instanceof Date) return v;
  v = (v == null ? '' : String(v)).slice(0, 600);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

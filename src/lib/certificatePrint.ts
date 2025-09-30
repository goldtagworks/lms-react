// 간단한 수료증 프린트/다운로드 목업 유틸
// 실제 서버 PDF 생성 이전까지 window.print() 기반
import type { Certificate } from '@main/types/exam';

import { getAttemptMeta } from '@main/lib/repository';
import { t } from '@main/lib/i18n';

interface PrintParams {
    certificate: Certificate;
    courseTitle: string;
}

export function openCertificatePrintView({ certificate, courseTitle }: PrintParams) {
    const meta = getAttemptMeta(certificate.exam_attempt_id);
    const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1200');

    if (!win) return;

    const issued = new Date(certificate.issued_at).toLocaleString();
    const score = meta?.score != null ? meta.score + '점' : '—';
    const passScore = meta?.pass_score != null ? meta.pass_score + '점' : '—';
    const passedLabel = meta?.passed == null ? '—' : meta.passed ? t('exam.pass', undefined, '합격') : t('exam.fail', undefined, '불합격');

    win.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8" />
<title>${t('certificate.demoTitle', undefined, '수료증 (Demo)')} ${certificate.serial_no}</title>
<style>
body { font-family: system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; margin:40px; color:#222; }
.hdr { text-align:center; margin-bottom:40px; }
.cert-box { border:2px solid #0b7285; padding:40px 48px; border-radius:12px; position:relative; }
.label { font-size:12px; color:#666; letter-spacing:0.5px; }
.value { font-weight:600; }
.row { margin:12px 0; }
.footer { margin-top:40px; font-size:12px; color:#777; text-align:center; }
.badge { display:inline-block; padding:4px 10px; border-radius:20px; background:#e6fcf5; color:#087f5b; font-size:12px; font-weight:600; }
.badge.fail { background:#ffe3e3; color:#c92a2a; }
hr { border:none; border-top:1px solid #ddd; margin:32px 0; }
.print-btn { position:fixed; top:12px; right:12px; }
@media print { .print-btn { display:none; } body { margin:0; } }
</style>
</head><body>
<button class="print-btn" onclick="window.print()">${t('certificate.print', undefined, '인쇄')}</button>
<div class="hdr">
  <h1 style="margin:0 0 8px; font-size:32px;">${t('certificate.demoTitle', undefined, '수료증 (Demo)')}</h1>
  <div class="label">CERTIFICATE OF COMPLETION</div>
</div>
<div class="cert-box">
  <div class="row"><span class="label">COURSE</span><br/><span class="value" style="font-size:20px;">${escapeHtml(courseTitle)}</span></div>
  <div class="row"><span class="label">SERIAL</span><br/><span class="value">${certificate.serial_no}</span></div>
  <div class="row"><span class="label">ISSUED AT</span><br/><span class="value">${issued}</span></div>
  <div class="row"><span class="label">SCORE / PASS</span><br/><span class="value">${score} / ${passScore}</span></div>
  <div class="row"><span class="label">RESULT</span><br/><span class="badge ${meta?.passed ? '' : 'fail'}">${passedLabel}</span></div>
  <hr />
  <p style="line-height:1.5; font-size:14px;">${t('certificate.demoDisclaimer', undefined, '본 수료증은 데모 환경에서 생성된 것으로 법적 효력이 없으며, 실제 서비스 도입 시 서버에서 서명된 PDF와 검증 API가 제공될 예정입니다.')}</p>
</div>
<div class="footer">© Demo LMS • This mock certificate is for presentation only.</div>
<script>window.focus()</script>
</body></html>`);

    win.document.close();
}

function escapeHtml(str: string) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

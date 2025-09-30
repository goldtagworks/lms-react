import { useParams } from 'react-router-dom';
import { useSupportMessagesPaged, useSupportTicket } from '@main/features/support/hooks';
import { useState, FormEvent } from 'react';
import { createSupportMessage } from '@main/features/support/api';
import PaginationBar from '@main/components/PaginationBar';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@main/lib/i18n';

export default function SupportTicketDetailPage() {
    const { id = '' } = useParams();
    const { t } = useI18n();
    const { data: ticket } = useSupportTicket(id);
    const [page, setPage] = useState(1);
    const pageSize = 15;
    const { data: paged } = useSupportMessagesPaged(id, page, pageSize);
    const [body, setBody] = useState('');
    const qc = useQueryClient();

    if (!ticket) return <div>{t('common.loading')}</div>;

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!body.trim()) return;
        if (!ticket) return;
        createSupportMessage(ticket.id, { body }).then(() => {
            setBody('');
            qc.invalidateQueries();
            setPage(1); // 새 메시지 추가 후 첫 페이지(오래된 순)로 이동 유지 (정책 변경 가능)
        });
    }

    return (
        <div>
            <h1>{ticket.title}</h1>
            <p>{t('support.detail.status', { status: ticket.status })}</p>
            <ul>
                {(paged?.items ?? []).map((m) => (
                    <li key={m.id}>
                        <strong>{m.author_id}</strong>: {m.body}
                        {m.is_private && <em> ({t('support.detail.private')})</em>}
                    </li>
                ))}
            </ul>
            {paged && <PaginationBar page={paged.page} totalPages={paged.pageCount} onChange={setPage} />}
            <form onSubmit={onSubmit}>
                <textarea required value={body} onChange={(e) => setBody(e.target.value)} />
                <button type="submit">{t('support.detail.reply')}</button>
            </form>
        </div>
    );
}

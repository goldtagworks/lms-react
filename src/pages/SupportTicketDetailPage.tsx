import { useParams } from 'react-router-dom';
import { useSupportMessages, useSupportTicket } from '@main/features/support/hooks';
import { useState, FormEvent } from 'react';
import { createSupportMessage } from '@main/features/support/api';
import { useTranslation } from 'react-i18next';

export default function SupportTicketDetailPage() {
    const { id = '' } = useParams();
    const { t } = useTranslation();
    const { data: ticket } = useSupportTicket(id);
    const { data: messages } = useSupportMessages(id);
    const [body, setBody] = useState('');

    if (!ticket) return <div>{t('common.loading')}</div>;

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!body.trim()) return;
        if (!ticket) return;
        createSupportMessage(ticket.id, { body }).then(() => {
            setBody('');
            // 간단한 재조회 (임시): 실제 react-query 사용 시 invalidate 대체
            // 여기서는 페이지 reload 대신 훅 강제 갱신이 없으므로 임시로 location.reload 유지
            location.reload();
        });
    }

    return (
        <div>
            <h1>{ticket.title}</h1>
            <p>{t('support.detail.status', { status: ticket.status })}</p>
            <ul>
                {(messages ?? []).map((m) => (
                    <li key={m.id}>
                        <strong>{m.author_id}</strong>: {m.body}
                        {m.is_private && <em> ({t('support.detail.private')})</em>}
                    </li>
                ))}
            </ul>
            <form onSubmit={onSubmit}>
                <textarea required value={body} onChange={(e) => setBody(e.target.value)} />
                <button type="submit">{t('support.detail.reply')}</button>
            </form>
        </div>
    );
}

import { useSupportTicketsPaged } from '@main/features/support/hooks';
import { Link } from 'react-router-dom';
import { useI18n } from '@main/lib/i18n';
import { useState } from 'react';
import PaginationBar from '@main/components/PaginationBar';

export default function SupportTicketsPage() {
    const { t } = useI18n();
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const { data } = useSupportTicketsPaged(page, pageSize);

    return (
        <div>
            <h1>{t('support.title')}</h1>
            <p>{t('support.subtitle')}</p>
            <Link to="/support/new">{t('support.newTicket')}</Link>
            <ul>
                {(data?.items ?? []).map((tkt) => (
                    <li key={tkt.id}>
                        <Link to={`/support/${tkt.id}`}>{tkt.title}</Link> - {tkt.status}
                    </li>
                ))}
            </ul>
            {data && <PaginationBar page={data.page} totalPages={data.pageCount} onChange={setPage} />}
        </div>
    );
}

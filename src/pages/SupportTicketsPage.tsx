import { useSupportTickets } from '@main/features/support/hooks';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SupportTicketsPage() {
    const { data } = useSupportTickets();
    const { t } = useTranslation();

    return (
        <div>
            <h1>{t('support.title')}</h1>
            <p>{t('support.subtitle')}</p>
            <Link to="/support/new">{t('support.newTicket')}</Link>
            <ul>
                {(data ?? []).map((tkt) => (
                    <li key={tkt.id}>
                        {tkt.title} - {tkt.status}
                    </li>
                ))}
            </ul>
        </div>
    );
}

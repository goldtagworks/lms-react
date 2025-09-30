import { useI18n } from '@main/lib/i18n';
import { useSupportTickets } from '@main/features/support/hooks';
import { updateTicketStatus } from '@main/features/support/api';
import { useState } from 'react';

export default function AdminSupportPage() {
    const { t } = useI18n();
    const { data } = useSupportTickets();
    const [updating, setUpdating] = useState<string | null>(null);

    function changeStatus(id: string, status: 'OPEN' | 'ANSWERED' | 'CLOSED') {
        setUpdating(id);
        updateTicketStatus(id, status).finally(() => setUpdating(null));
    }

    return (
        <div>
            <h1>{t('support.admin.title')}</h1>
            <table>
                <thead>
                    <tr>
                        <th>{t('support.admin.col.title')}</th>
                        <th>{t('support.admin.col.status')}</th>
                        <th>{t('support.admin.col.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {(data ?? []).map((tkt) => (
                        <tr key={tkt.id}>
                            <td>
                                <a href={`/support/${tkt.id}`}>{tkt.title}</a>
                            </td>
                            <td>{tkt.status}</td>
                            <td>
                                {['OPEN', 'ANSWERED', 'CLOSED'].map((s) => (
                                    <button key={s} disabled={updating === tkt.id || tkt.status === s} style={{ marginRight: 4 }} onClick={() => changeStatus(tkt.id, s as any)}>
                                        {t(`support.status.${s}`)}
                                    </button>
                                ))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

import { FormEvent, useState } from 'react';
import { useCreateSupportTicket } from '@main/features/support/hooks';
import { useI18n } from '@main/lib/i18n';
import { useNavigate } from 'react-router-dom';

export default function SupportNewPage() {
    const { t } = useI18n();
    const nav = useNavigate();
    const createMutation = useCreateSupportTicket();

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        createMutation.mutate(
            { title, body },
            {
                onSuccess: () => nav('/support')
            }
        );
    }

    return (
        <form onSubmit={onSubmit}>
            <h1>{t('support.newTicketTitle')}</h1>
            <div>
                <label>{t('support.form.titleLabel')}</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
                <label>{t('support.form.bodyLabel')}</label>
                <textarea required value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <button disabled={createMutation.isPending} type="submit">
                {t('common.submit')}
            </button>
        </form>
    );
}

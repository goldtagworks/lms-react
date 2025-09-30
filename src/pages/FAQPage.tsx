import { useTranslation } from 'react-i18next';

interface FAQItem {
    question: string;
    answer: string;
}

const FAQ_DATA: FAQItem[] = [
    { question: 'faq.q1', answer: 'faq.a1' },
    { question: 'faq.q2', answer: 'faq.a2' },
    { question: 'faq.q3', answer: 'faq.a3' }
];

export default function FAQPage() {
    const { t } = useTranslation();

    return (
        <div>
            <h1>{t('faq.title')}</h1>
            <p>{t('faq.subtitle')}</p>
            <dl>
                {FAQ_DATA.map((item) => (
                    <div key={item.question}>
                        <dt>{t(item.question)}</dt>
                        <dd>{t(item.answer)}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

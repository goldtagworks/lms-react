import { Anchor, Checkbox, Divider, Group, Stack, Text, Modal, Tabs, ScrollArea } from '@mantine/core';
import { instructorPolicyKo } from '@main/lib/legalTexts';
import { loadMarketingConsent, saveMarketingConsent } from '@main/lib/consentStore';
import { useState, useEffect, ChangeEvent } from 'react';
import TermsOfService from '@main/pages/mdx/ko/terms.mdx';
import PrivacyPolicy from '@main/pages/mdx/ko/privacy-policy.mdx';

import classes from './mdx.module.css';

export interface ConsentState {
    terms: boolean;
    privacy: boolean;
    marketing: boolean;
    age?: boolean;
    all: boolean;
}

interface ConsentCheckboxesProps {
    onChange?: (s: ConsentState) => void;
    showMarketing?: boolean;
    requireAge?: boolean;
    compact?: boolean;
    requireInstructorPolicy?: boolean; // for instructor apply page
}

export function ConsentCheckboxes({ onChange, showMarketing = true, requireAge = false, compact = false, requireInstructorPolicy = false }: ConsentCheckboxesProps) {
    const [state, setState] = useState<ConsentState>({ terms: false, privacy: false, marketing: loadMarketingConsent() || false, age: !requireAge, all: false });
    const [opened, setOpened] = useState(false);
    const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'instructor'>('terms');

    // 일부 환경(이중 렌더/StrictMode) 또는 Mantine 내부 위임에서 이벤트 currentTarget이 사라져 null 참조가 발생하는 사례 방어
    const getChecked = (e: ChangeEvent<HTMLInputElement> | { target?: any; currentTarget?: any } | null): boolean => {
        if (!e) return false;

        const target = (e as any).currentTarget || (e as any).target;

        if (target && typeof target.checked === 'boolean') return !!target.checked;

        return false;
    };

    useEffect(() => {
        // '|| true' 로 인해 marketing 여부가 무시되던 버그 수정
        const allComputed = state.terms && state.privacy && (!requireAge || !!state.age) && (!showMarketing || state.marketing);

        if (allComputed !== state.all) {
            setState((s) => ({ ...s, all: allComputed }));
            onChange?.({ ...state, all: allComputed });
        } else {
            onChange?.({ ...state, all: state.all });
        }
    }, [state.terms, state.privacy, state.marketing, state.age, requireAge, showMarketing, state.all, onChange]);

    const toggleAll = (checked: boolean) => {
        setState((s) => ({
            ...s,
            terms: checked,
            privacy: checked,
            marketing: showMarketing ? checked : s.marketing,
            age: requireAge ? checked : s.age,
            all: checked
        }));
    };

    return (
        <>
            <Stack gap={compact ? 6 : 'sm'}>
                <Checkbox checked={state.all} label="모두 동의" size="xs" onChange={(e) => toggleAll(getChecked(e))} />
                <Divider my={4} />
                <Checkbox
                    checked={state.terms}
                    label={
                        <LabelWithLink
                            label="(필수) 이용약관 동의"
                            onOpen={() => {
                                setActiveTab('terms');
                                setOpened(true);
                            }}
                        />
                    }
                    size="xs"
                    onChange={(e) => setState((s) => ({ ...s, terms: getChecked(e) }))}
                />
                <Checkbox
                    checked={state.privacy}
                    label={
                        <LabelWithLink
                            label="(필수) 개인정보 수집·이용 동의"
                            onOpen={() => {
                                setActiveTab('privacy');
                                setOpened(true);
                            }}
                        />
                    }
                    size="xs"
                    onChange={(e) => setState((s) => ({ ...s, privacy: getChecked(e) }))}
                />
                {requireAge && <Checkbox checked={!!state.age} label="(필수) 만 14세 이상입니다" size="xs" onChange={(e) => setState((s) => ({ ...s, age: getChecked(e) }))} />}
                {showMarketing && (
                    <Checkbox
                        checked={state.marketing}
                        label="(선택) 마케팅 정보 수신 동의"
                        size="xs"
                        onChange={(e) => {
                            const checked = getChecked(e);

                            saveMarketingConsent(checked);
                            setState((s) => ({ ...s, marketing: checked }));
                        }}
                    />
                )}
                {requireInstructorPolicy && <Checkbox disabled checked={state.terms && state.privacy} label="(필수) 강사 정책 동의 (구현 예정)" size="xs" />}
            </Stack>
            <Modal centered className={classes.legalModal} opened={opened} radius="md" size="xl" title="약관 전문" onClose={() => setOpened(false)}>
                <Tabs defaultValue="terms" value={activeTab} onChange={(v) => v && setActiveTab(v as any)}>
                    <Tabs.List aria-label="약관 종류 선택">
                        <Tabs.Tab value="terms">이용약관</Tabs.Tab>
                        <Tabs.Tab value="privacy">개인정보 처리방침</Tabs.Tab>
                        {requireInstructorPolicy && <Tabs.Tab value="instructor">강사 정책</Tabs.Tab>}
                    </Tabs.List>
                    <Tabs.Panel pt="xs" value="terms">
                        <ScrollArea aria-label="이용약관 전문" h={300} p="xs" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 6 }} type="auto">
                            <div className={`${classes.markdown} ${classes.legalModalInnerPadding}`} style={{ whiteSpace: 'pre-wrap' }}>
                                <TermsOfService />
                            </div>
                        </ScrollArea>
                    </Tabs.Panel>
                    <Tabs.Panel pt="xs" value="privacy">
                        <ScrollArea aria-label="개인정보 처리방침 전문" h={300} p="xs" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 6 }} type="auto">
                            <div className={`${classes.markdown} ${classes.legalModalInnerPadding}`} style={{ whiteSpace: 'pre-wrap' }}>
                                <PrivacyPolicy />
                            </div>
                        </ScrollArea>
                    </Tabs.Panel>
                    {requireInstructorPolicy && (
                        <Tabs.Panel pt="xs" value="instructor">
                            <ScrollArea aria-label="강사 정책 전문" h={300} p="xs" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 6 }} type="auto">
                                <div className={`${classes.markdown} ${classes.legalModalInnerPadding}`} style={{ whiteSpace: 'pre-wrap' }}>
                                    <Text c="dimmed" component="div" size="xs">
                                        {instructorPolicyKo}
                                    </Text>
                                </div>
                            </ScrollArea>
                        </Tabs.Panel>
                    )}
                </Tabs>
            </Modal>
        </>
    );
}

const LabelWithLink = ({ label, onOpen }: { label: string; onOpen?: () => void }) => (
    <Group gap={6} wrap="nowrap">
        <Text size="xs">{label}</Text>
        <Anchor
            fz={12}
            href="#"
            td="underline"
            onClick={(e) => {
                e.preventDefault();
                onOpen?.();
            }}
        >
            전문 보기
        </Anchor>
    </Group>
);

export default ConsentCheckboxes;

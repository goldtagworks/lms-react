import { ActionIcon, Badge, Button, Group, Modal, Notification, Stack, Table, TextInput, Tooltip } from '@mantine/core';
import { TextBody, TextMeta } from '@main/components/typography';
import { RefreshCw, RotateCcw, Search, Save, X } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import PaginationBar from '@main/components/PaginationBar';
import { useAdminCertificates } from '@main/hooks/admin/useAdminCertificates';

// 간단 mock 목록 소스: sessionStorage 에 누적된 certificate 전체 (페이징은 클라이언트 slicing)
// (이전 로컬 로딩/필터 타입 제거: 훅 사용)

export default function AdminCertificatesPage() {
    const {
        paged,
        page: pageSafe,
        totalPages,
        q,
        setQ,
        resetFilters,
        reissueTarget,
        reissueNote,
        reissueErr,
        setReissueNote,
        setReissueErr,
        openReissue,
        commitReissue,
        deactivated,
        toggleDeactivate,
        setPage
    } = useAdminCertificates({ pageSize: 20 });

    return (
        <PageContainer roleMain py={48} size="lg">
            <PageHeader
                actions={
                    <Group gap="xs">
                        <TextInput
                            aria-label="검색"
                            leftSection={<Search size={14} />}
                            placeholder="ID/일련번호"
                            radius="md"
                            size="sm"
                            value={q}
                            onChange={(e) => {
                                setQ(e.currentTarget.value);
                                setPage(1);
                            }}
                        />
                        <Tooltip label="필터 초기화">
                            <ActionIcon aria-label="필터 초기화" variant="light" onClick={resetFilters}>
                                <RefreshCw size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                }
                description="발급된 수료증을 조회/재발급/비활성(Mock) 합니다. (mock)"
                title="수료증 관리"
            />

            <Stack gap="lg" mt="md">
                <Table highlightOnHover striped withColumnBorders withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: 220 }} ta="center">
                                일련번호
                            </Table.Th>
                            <Table.Th style={{ width: 140 }} ta="center">
                                발급일
                            </Table.Th>
                            <Table.Th style={{ width: 160 }} ta="center">
                                Enrollment
                            </Table.Th>
                            <Table.Th style={{ width: 170 }} ta="center">
                                ExamAttempt
                            </Table.Th>
                            <Table.Th style={{ width: 90 }} ta="center">
                                상태
                            </Table.Th>
                            <Table.Th style={{ width: 140 }} ta="center">
                                액션
                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {paged.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={6}>
                                    <TextMeta py={20} ta="center">
                                        수료증이 없습니다.
                                    </TextMeta>
                                </Table.Td>
                            </Table.Tr>
                        )}
                        {paged.map((c) => {
                            const isDeact = !!deactivated[c.id];

                            return (
                                <Table.Tr key={c.id} style={{ opacity: isDeact ? 0.55 : 1 }}>
                                    <Table.Td>
                                        <TextBody fw={600} sizeOverride="sm">
                                            {c.serial_no}
                                        </TextBody>
                                    </Table.Td>
                                    <Table.Td>
                                        <TextMeta>{c.issued_at.slice(0, 10)}</TextMeta>
                                    </Table.Td>
                                    <Table.Td>
                                        <TextMeta>{c.enrollment_id.slice(0, 8)}</TextMeta>
                                    </Table.Td>
                                    <Table.Td>
                                        <TextMeta>{c.exam_attempt_id.slice(0, 8)}</TextMeta>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Badge color={isDeact ? 'gray' : 'green'} size="sm" variant="light">
                                            {isDeact ? '비활성' : '정상'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Group gap={4} justify="center">
                                            <Tooltip label="재발급(Mock)">
                                                <ActionIcon aria-label="재발급" size="sm" variant="subtle" onClick={() => openReissue(c)}>
                                                    <RotateCcw size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label={isDeact ? '활성화' : '비활성화'}>
                                                <ActionIcon aria-label="활성 토글" color={isDeact ? 'green' : 'red'} size="sm" variant="subtle" onClick={() => toggleDeactivate(c)}>
                                                    {isDeact ? <Save size={14} /> : <X size={14} />}
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
                <PaginationBar page={pageSafe} totalPages={totalPages} onChange={(p) => setPage(p)} />
            </Stack>

            <Modal centered opened={!!reissueTarget} radius="md" size="sm" title="수료증 재발급(Mock)" onClose={() => openReissue as any}>
                {reissueTarget && (
                    <Stack gap="sm">
                        {reissueErr && (
                            <Notification color="red" title="오류" onClose={() => setReissueErr(null)}>
                                {reissueErr}
                            </Notification>
                        )}
                        <TextMeta>기존 일련번호: {reissueTarget.serial_no}</TextMeta>
                        <TextInput aria-label="메모" label="관리 메모 (옵션)" placeholder="사유/메모" value={reissueNote} onChange={(e) => setReissueNote(e.currentTarget.value)} />
                        <Group justify="flex-end" mt="sm">
                            <Button leftSection={<RotateCcw size={14} />} size="sm" onClick={commitReissue}>
                                재발급
                            </Button>
                            <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={() => setReissueErr(null)}>
                                취소
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </PageContainer>
    );
}

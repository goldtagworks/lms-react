import type { IssueCertificateRequest } from '@main/types/certificate';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@main/lib/auth';
import { qk } from '@main/lib/queryKeys';
import { getCertificatesByUser, getCertificateByEnrollment, issueCertificate } from '@main/services/certificateService';

/**
 * 사용자별 수료증 목록 조회 Hook
 */
export function useCertificates() {
    const { user } = useAuth();

    return useQuery({
        queryKey: qk.certificates(user?.id),
        queryFn: () => getCertificatesByUser(user!.id),
        enabled: !!user?.id
    });
}

/**
 * 특정 수강신청의 수료증 조회 Hook
 */
export function useCertificateByEnrollment(enrollmentId: string) {
    return useQuery({
        queryKey: qk.certificate(enrollmentId),
        queryFn: () => getCertificateByEnrollment(enrollmentId),
        enabled: !!enrollmentId
    });
}

/**
 * 수료증 발급 Mutation Hook
 */
export function useIssueCertificate() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: (request: IssueCertificateRequest) => issueCertificate(request),
        onSuccess: (data, variables) => {
            // 관련 쿼리들 무효화
            queryClient.invalidateQueries({
                queryKey: qk.certificates(user?.id)
            });
            queryClient.invalidateQueries({
                queryKey: qk.certificate(variables.enrollmentId)
            });
        }
    });
}

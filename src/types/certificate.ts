export interface Certificate {
    id: string;
    enrollmentId: string;
    examAttemptId: string;
    issuedAt: string;
    pdfPath: string;
    serialNo: string;
}

export interface CertificateWithDetails extends Certificate {
    enrollment: {
        id: string;
        course: {
            id: string;
            title: string;
            instructorName: string;
        };
        user: {
            id: string;
            displayName: string;
        };
    };
    examAttempt: {
        id: string;
        score: number;
        passed: boolean;
    };
}

export interface IssueCertificateRequest {
    enrollmentId: string;
    examAttemptId: string;
}

export interface IssueCertificateResponse {
    certificateId: string;
    serialNo: string;
    pdfPath: string;
    issuedAt: string;
}

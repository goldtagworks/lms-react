import { Navigate, useParams } from 'react-router-dom';

// 단일 Checkout 전환에 따라 기존 /payment/:id 는 /enroll/:id 로 리다이렉트
export default function PaymentPageRedirect() {
    const { id } = useParams();

    return <Navigate replace to={`/enroll/${id}`} />;
}

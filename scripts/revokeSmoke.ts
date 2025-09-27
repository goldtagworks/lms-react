/*
 * Minimal manual smoke test for revoke flow.
 * Run with: ts-node (if available) or temporary compile & node.
 * This avoids full test framework.
 */
import { applyInstructor, approveInstructorApplication, revokeInstructorApplication, listInstructorApplications } from '../src/lib/repository';

function assert(cond: any, msg: string) {
    if (!cond) throw new Error('ASSERT FAIL: ' + msg);
}

// simple sessionStorage polyfill if missing
if (!(globalThis as any).sessionStorage) {
    class SimpleStorage {
        private m = new Map<string, string>();
        getItem(k: string) {
            return this.m.get(k) || null;
        }
        setItem(k: string, v: string) {
            this.m.set(k, v);
        }
        removeItem(k: string) {
            this.m.delete(k);
        }
        clear() {
            this.m.clear();
        }
    }
    // @ts-ignore
    globalThis.sessionStorage = new SimpleStorage();
}

sessionStorage.clear();

const user: any = { id: 'u-smoke', name: 'Smoke', email: 's@example.com', role: 'user' };

const app = applyInstructor(user, { display_name: 'SmokeUser' });
assert(app.status === 'PENDING', 'initial status PENDING');

approveInstructorApplication(app.id);
let current = listInstructorApplications().find((a) => a.id === app.id)!;
assert(current.status === 'APPROVED', 'should be APPROVED');

revokeInstructorApplication(app.id, '테스트 회수');
current = listInstructorApplications().find((a) => a.id === app.id)!;
assert(current.status === 'REVOKED', 'should be REVOKED');
assert(current.revoke_reason === '테스트 회수', 'reason persisted');

const firstRevokedAt = current.revoked_at;
revokeInstructorApplication(app.id, '변경 시도');
current = listInstructorApplications().find((a) => a.id === app.id)!;
assert(current.revoked_at === firstRevokedAt, 'revoked_at unchanged on idempotent call');
assert(current.revoke_reason === '테스트 회수', 'reason not overwritten');

console.log('✅ revoke smoke OK');

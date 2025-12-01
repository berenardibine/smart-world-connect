// src/api/mockSubscriptionApi.ts
import { User, SubscriptionRequest } from '@/type/subscription';
import { v4 as uuid } from 'uuid';

const USERS_KEY = 'rsm_users_v1';
const REQS_KEY = 'rsm_sub_requests_v1';

function readUsers(): User[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}
function writeUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function readReqs(): SubscriptionRequest[] {
  const raw = localStorage.getItem(REQS_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}
function writeReqs(reqs: SubscriptionRequest[]) {
  localStorage.setItem(REQS_KEY, JSON.stringify(reqs));
}

export const mockApi = {
  getUsers(): Promise<User[]> {
    return Promise.resolve(readUsers());
  },
  getUser(userId: string): Promise<User | undefined> {
    return Promise.resolve(readUsers().find(u => u.id === userId));
  },
  saveUser(u: User) {
    const users = readUsers();
    const idx = users.findIndex(x => x.id === u.id);
    if (idx >= 0) users[idx] = u;
    else users.push(u);
    writeUsers(users);
    return Promise.resolve(u);
  },
  submitSubscriptionRequest(payload: {
    userId: string;
    requestedPlan: string;
    amountFrw: number;
    paymentReference?: string;
    phonePaidTo?: string;
    message?: string;
  }): Promise<SubscriptionRequest> {
    const req: SubscriptionRequest = {
      id: uuid(),
      userId: payload.userId,
      requestedPlan: payload.requestedPlan as any,
      amountFrw: payload.amountFrw,
      paymentReference: payload.paymentReference,
      phonePaidTo: payload.phonePaidTo,
      message: payload.message,
      status: 'pending',
      createdAtISO: new Date().toISOString(),
    };
    const reqs = readReqs();
    reqs.push(req);
    writeReqs(reqs);
    return Promise.resolve(req);
  },
  getRequests(): Promise<SubscriptionRequest[]> {
    return Promise.resolve(readReqs().sort((a,b)=>a.createdAtISO < b.createdAtISO ? 1:-1));
  },
  reviewRequest(requestId: string, admin: { name: string }, approve: boolean, adminNote?: string) {
    const reqs = readReqs();
    const r = reqs.find(x=>x.id === requestId);
    if (!r) return Promise.reject(new Error('Request not found'));
    r.status = approve ? 'approved' : 'rejected';
    r.reviewedAtISO = new Date().toISOString();
    r.reviewedBy = admin.name;
    r.adminNote = adminNote;
    writeReqs(reqs);

    if (approve) {
      // update user plan
      const users = readUsers();
      const u = users.find(x => x.id === r.userId);
      if (u) {
        u.plan = r.requestedPlan;
        // reset activity monthly counters on plan change
        u.activity = {
          postsThisMonth: 0,
          updatesThisMonth: 0,
          editsThisMonth: 0,
          lastResetISO: new Date().toISOString()
        };
        writeUsers(users);
      }
    }

    return Promise.resolve(r);
  }
};

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';

test('Store Slices: test slices using mock useState runner', async () => {
  const storeModule = await import('../store/index.ts');
  assert.ok(storeModule.useAuthSlice);

  let stateStore = [];
  let hookIndex = 0;

  const mockDispatcher = {
    useState: (initial) => {
      const idx = hookIndex++;
      if (stateStore[idx] === undefined) {
        stateStore[idx] = typeof initial === 'function' ? initial() : initial;
      }
      const setState = (val) => {
        stateStore[idx] = typeof val === 'function' ? val(stateStore[idx]) : val;
      };
      return [stateStore[idx], setState];
    },
  };

  if (React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE) {
    React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = mockDispatcher;
  }
  if (React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher = {
      current: mockDispatcher,
    };
  }

  // Test useAuthSlice
  hookIndex = 0;
  stateStore = [];
  const auth = storeModule.useAuthSlice();
  assert.equal(auth.currentRole, 'CUSTOMER');
  auth.switchRole('PROVIDER');
  assert.equal(stateStore[0], 'PROVIDER');

  // Test useSocietySlice
  hookIndex = 0;
  stateStore = [];
  const soc = storeModule.useSocietySlice([{ id: 'soc-1', name: 'Soc 1' }], []);
  assert.equal(soc.societies.length, 1);
  soc.selectSociety('soc-1');
  soc.addNotice({
    title: 'Alert',
    content: 'Notice',
    type: 'ALERT',
    priority: 'NORMAL',
    societyId: 'soc-1',
    societyName: 'Soc 1',
    authorName: 'Admin',
    isActive: true,
  });
  assert.equal(stateStore[2].length, 1);

  // Test useCatalogSlice
  hookIndex = 0;
  stateStore = [];
  const cat = storeModule.useCatalogSlice([], [], [{ id: 'p-1', businessName: 'Old' }]);
  cat.setSearchQuery('cleaning');
  cat.updateProvider('p-1', { businessName: 'New' });
  assert.equal(stateStore[3], 'cleaning');
  assert.equal(stateStore[2][0].businessName, 'New');

  // Test useOrderSlice
  hookIndex = 0;
  stateStore = [];
  const orders = storeModule.useOrderSlice([{ id: 'o-1', status: 'PENDING' }]);
  orders.updateOrderStatus('o-1', 'COMPLETED');
  orders.addOrder({ id: 'o-2', status: 'ACCEPTED' });
  assert.equal(stateStore[0].length, 2);
  assert.equal(stateStore[0][0].status, 'ACCEPTED');
  assert.equal(stateStore[0][1].status, 'COMPLETED');

  // Test useSubscriptionSlice
  hookIndex = 0;
  stateStore = [];
  const subs = storeModule.useSubscriptionSlice([{ id: 's-1', status: 'ACTIVE' }]);
  subs.updateSubscriptionStatus('s-1', 'PAUSED');
  subs.addSubscription({ id: 's-2', status: 'ACTIVE' });
  assert.equal(stateStore[0].length, 2);
  assert.equal(stateStore[0][0].status, 'ACTIVE');
  assert.equal(stateStore[0][1].status, 'PAUSED');

  // Test useDispatchSlice
  hookIndex = 0;
  stateStore = [];
  const dispatch = storeModule.useDispatchSlice([{ id: 'j-1', status: 'OPEN' }]);
  dispatch.updateJobRequest('j-1', { status: 'CLAIMED' });
  dispatch.addJobRequest({ id: 'j-2', status: 'OPEN' });
  assert.equal(stateStore[0].length, 2);
  assert.equal(stateStore[0][0].status, 'OPEN');
  assert.equal(stateStore[0][1].status, 'CLAIMED');

  // Test useWalletSlice
  hookIndex = 0;
  stateStore = [];
  const wallet = storeModule.useWalletSlice();
  wallet.creditReward(50);
  assert.equal(stateStore[0].balance, 200);
  const ok = wallet.debitCredit(30);
  assert.equal(ok, true);
  assert.equal(stateStore[0].balance, 170);
  const fail = wallet.debitCredit(1000);
  assert.equal(fail, false);

  // Test useReviewSlice
  hookIndex = 0;
  stateStore = [];
  const rev = storeModule.useReviewSlice([], []);
  rev.addReview({ id: 'r-1', rating: 5 });
  rev.addComplaint({ id: 'c-1', category: 'POOR_SERVICE' });
  assert.equal(stateStore[0].length, 1);
  assert.equal(stateStore[1].length, 1);
});

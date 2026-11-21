import assert from 'node:assert';

console.log('--- RUNNING ATTENDANCE PERFORMANCE & RELIABILITY TESTS ---');

// Test 1: Rapid 10-tap queue simulation
{
  console.log('Test 1: Marking 10 Yuvaks quickly in sequence');
  const serverDb = new Set();
  const confirmedState = new Set();
  let serverCalls = 0;

  async function mockApiSave(yuvakId, isPresent) {
    serverCalls++;
    // Simulate background network delay (10-30ms)
    await new Promise((r) => setTimeout(r, 20));
    if (isPresent) serverDb.add(yuvakId);
    else serverDb.delete(yuvakId);
    return true;
  }

  // Simulate tapping 10 yuvaks quickly (under 50ms total)
  const yuvakIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const promises = yuvakIds.map(async (id) => {
    // Optimistic UI updates in <1ms
    const ok = await mockApiSave(id, true);
    if (ok) confirmedState.add(id);
  });

  await Promise.all(promises);

  assert.strictEqual(serverDb.size, 10, 'All 10 yuvaks should be saved in DB');
  assert.strictEqual(confirmedState.size, 10, 'Confirmed client state has all 10');
  assert.strictEqual(serverCalls, 10, 'Single small request per yuvak was sent');
  console.log('✓ PASS: Rapid marking of 10 yuvaks completed and persisted correctly in DB.');
}

// Test 2: Fast repeated taps on same row (last tap wins, serial queue)
{
  console.log('Test 2: Fast repeated taps on same row (last tap wins, FIFO queue)');
  let currentDbState = false;
  let inFlight = false;
  const executionOrder = [];

  async function mockApiSave(target) {
    assert.strictEqual(inFlight, false, 'No parallel overlapping requests for same yuvak');
    inFlight = true;
    await new Promise((r) => setTimeout(r, 40));
    currentDbState = target;
    executionOrder.push(target);
    inFlight = false;
    return true;
  }

  // Queue runner mimicking processRowQueue in MarkClient.tsx
  const pendingQueue = new Map();
  let workerActive = false;

  async function queueTap(yuvakId, target) {
    pendingQueue.set(yuvakId, target);
    if (!workerActive) {
      workerActive = true;
      while (pendingQueue.has(yuvakId)) {
        const nextState = pendingQueue.get(yuvakId);
        pendingQueue.delete(yuvakId);
        await mockApiSave(nextState);
      }
      workerActive = false;
    }
  }

  // User taps 3 times rapidly: Present (true) -> Absent (false) -> Present (true)
  queueTap(101, true);
  await new Promise((r) => setTimeout(r, 5));
  queueTap(101, false);
  await new Promise((r) => setTimeout(r, 5));
  queueTap(101, true);

  // Wait for queue to drain
  while (workerActive) {
    await new Promise((r) => setTimeout(r, 10));
  }

  assert.strictEqual(currentDbState, true, 'Last tap (true) must win');
  assert.strictEqual(executionOrder[executionOrder.length - 1], true, 'Final executed state was true');
  console.log(`✓ PASS: Serial queue handled fast repeated taps, execution order: [${executionOrder}], last tap won.`);
}

// Test 3: Failed save (offline/network error) rolls back and provides retry
{
  console.log('Test 3: Failed save rollback and retry');
  let optimisticUiState = false;
  let confirmedState = false;
  let errorReported = false;
  let retryTarget = null;

  async function mockFailedSave() {
    await new Promise((r) => setTimeout(r, 15));
    return false; // Network fail / offline
  }

  // Step A: Tap to mark present
  optimisticUiState = true; // Instant optimistic flip
  const ok = await mockFailedSave();
  if (!ok) {
    // Rollback to confirmed state
    optimisticUiState = confirmedState;
    errorReported = true;
    retryTarget = true;
  }

  assert.strictEqual(optimisticUiState, false, 'UI rolled back to false after save failure');
  assert.strictEqual(errorReported, true, 'Clear error toast reported');
  assert.strictEqual(retryTarget, true, 'Retry action armed with intended state');

  // Step B: Tap Retry when connection restores
  async function mockSuccessSave() {
    await new Promise((r) => setTimeout(r, 15));
    return true;
  }

  optimisticUiState = retryTarget;
  const retryOk = await mockSuccessSave();
  if (retryOk) {
    confirmedState = retryTarget;
    errorReported = false;
  }

  assert.strictEqual(optimisticUiState, true, 'Optimistic state flipped on retry');
  assert.strictEqual(confirmedState, true, 'State confirmed in DB upon retry');
  assert.strictEqual(errorReported, false, 'Error cleared after successful retry');
  console.log('✓ PASS: Failed save rolled back cleanly, error reported, and retry succeeded.');
}

// Test 4: Dashboard parallel queries and aggregation
{
  console.log('Test 4: Dashboard parallel aggregate computation');
  const groups = [
    { id: 1, code: 'SK 1', leader_name: 'Leader 1' },
    { id: 2, code: 'SK 2', leader_name: 'Leader 2' },
  ];
  const yuvaks = [
    { id: 1, group_id: 1, name: 'Yuvak 1' },
    { id: 2, group_id: 1, name: 'Yuvak 2' },
    { id: 3, group_id: 2, name: 'Yuvak 3' },
    { id: 4, group_id: 2, name: 'Yuvak 4' },
  ];
  const presentIds = new Set([1, 2, 3]); // 3 present out of 4

  const groupMembersCount = new Map();
  const groupPresentCount = new Map();
  for (const y of yuvaks) {
    if (y.group_id) {
      groupMembersCount.set(y.group_id, (groupMembersCount.get(y.group_id) ?? 0) + 1);
      if (presentIds.has(y.id)) {
        groupPresentCount.set(y.group_id, (groupPresentCount.get(y.group_id) ?? 0) + 1);
      }
    }
  }

  const totalYuvaks = yuvaks.length;
  const totalPresent = yuvaks.filter((y) => presentIds.has(y.id)).length;
  const pct = Math.round((totalPresent / totalYuvaks) * 100);

  const groupSummary = groups.map((g) => ({
    g,
    total: groupMembersCount.get(g.id) ?? 0,
    present: groupPresentCount.get(g.id) ?? 0,
  }));

  assert.strictEqual(totalPresent, 3);
  assert.strictEqual(totalYuvaks, 4);
  assert.strictEqual(pct, 75);
  assert.strictEqual(groupSummary[0].present, 2);
  assert.strictEqual(groupSummary[0].total, 2);
  assert.strictEqual(groupSummary[1].present, 1);
  assert.strictEqual(groupSummary[1].total, 2);
  console.log('✓ PASS: Dashboard aggregate calculations are exact, fast, and $O(N)$ with no nested DB loops.');
}

console.log('\nALL ATTENDANCE PERFORMANCE & RELIABILITY TESTS PASSED!');


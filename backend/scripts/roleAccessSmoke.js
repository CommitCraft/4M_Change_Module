/* eslint-disable no-console */

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://192.168.1.33:5000';

const ACCOUNTS = [
  {
    email: 'superadmin@example.com',
    password: process.env.SMOKE_SUPERADMIN_PASSWORD || 'Super@123',
    expectedRole: 'SuperAdmin',
    expects: { approvalsApprove: true, usersRead: true, rolesRead: true },
  },
  {
    email: 'quality.approver@example.com',
    password: 'Password@123',
    expectedRole: 'Admin',
    expects: { approvalsApprove: true, usersRead: true, rolesRead: true },
  },
  {
    email: 'manager.approver@example.com',
    password: 'Password@123',
    expectedRole: 'Manager',
    expects: { approvalsApprove: true, usersRead: false, rolesRead: false },
  },
  {
    email: 'user@example.com',
    password: 'Password@123',
    expectedRole: 'User',
    expects: { approvalsApprove: false, usersRead: false, rolesRead: false },
  },
  {
    email: 'man.user@example.com',
    password: 'Password@123',
    expectedRole: 'ManUser',
    expects: { approvalsApprove: false, usersRead: false, rolesRead: false },
  },
  {
    email: 'machine.user@example.com',
    password: 'Password@123',
    expectedRole: 'MachineUser',
    expects: { approvalsApprove: false, usersRead: false, rolesRead: false },
  },
  {
    email: 'method.user@example.com',
    password: 'Password@123',
    expectedRole: 'MethodUser',
    expects: { approvalsApprove: false, usersRead: false, rolesRead: false },
  },
  {
    email: 'material.user@example.com',
    password: 'Password@123',
    expectedRole: 'MaterialUser',
    expects: { approvalsApprove: false, usersRead: false, rolesRead: false },
  },
  {
    email: 'general.user@example.com',
    password: 'Password@123',
    expectedRole: 'GeneralUser',
    expects: { approvalsApprove: false, usersRead: false, rolesRead: false },
  },
];

const endpointChecks = [
  {
    key: 'changesRead',
    description: 'GET /api/change-requests',
    expectAlwaysAllow: true,
    run: (token) =>
      fetch(`${BASE_URL}/api/change-requests`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
  {
    key: 'changesCreatePermission',
    description: 'POST /api/change-requests (validation probe)',
    expectAlwaysAllow: true,
    run: (token) =>
      fetch(`${BASE_URL}/api/change-requests`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }),
    // If permission exists, this returns 400 (validation). If missing, 403.
    passCondition: (status) => status !== 403,
  },
  {
    key: 'approvalsApprove',
    description: 'POST /api/approvals',
    run: (token) =>
      fetch(`${BASE_URL}/api/approvals`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: 999999, status: 'Approved', remarks: 'smoke-test' }),
      }),
    passCondition: (status, expected) => (expected ? status !== 403 : status === 403),
  },
  {
    key: 'usersRead',
    description: 'GET /api/users',
    run: (token) =>
      fetch(`${BASE_URL}/api/users`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }),
    passCondition: (status, expected) => (expected ? status !== 403 : status === 403),
  },
  {
    key: 'rolesRead',
    description: 'GET /api/roles',
    run: (token) =>
      fetch(`${BASE_URL}/api/roles`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }),
    passCondition: (status, expected) => (expected ? status !== 403 : status === 403),
  },
];

const doLogin = async (email, password) => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.data?.token || !body?.data?.user) {
    throw new Error(`Login failed (${res.status})`);
  }

  return body.data;
};

const run = async () => {
  let totalChecks = 0;
  let failedChecks = 0;

  console.log(`Role access smoke started: ${BASE_URL}`);

  for (const account of ACCOUNTS) {
    process.stdout.write(`\n- ${account.email}: `);

    try {
      const loginData = await doLogin(account.email, account.password);
      const actualRole = loginData.user.role;
      const roleOk = actualRole === account.expectedRole;
      process.stdout.write(`login OK, role=${actualRole}${roleOk ? '' : ` (expected ${account.expectedRole})`}\n`);

      if (!roleOk) {
        totalChecks += 1;
        failedChecks += 1;
        continue;
      }

      for (const check of endpointChecks) {
        totalChecks += 1;

        const expected = check.expectAlwaysAllow ? true : account.expects[check.key];
        const response = await check.run(loginData.token);
        const status = response.status;

        const passed = check.passCondition
          ? check.passCondition(status, expected)
          : expected
          ? status !== 403
          : status === 403;

        if (!passed) failedChecks += 1;

        console.log(
          `  [${passed ? 'PASS' : 'FAIL'}] ${check.description} -> ${status} (expected ${expected ? 'allow' : 'deny'})`
        );
      }
    } catch (error) {
      totalChecks += 1;
      failedChecks += 1;
      console.log(`login FAILED (${error.message})`);
    }
  }

  console.log(`\nSummary: ${totalChecks - failedChecks}/${totalChecks} checks passed`);
  if (failedChecks > 0) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error(`Smoke run crashed: ${error.message}`);
  process.exit(1);
});

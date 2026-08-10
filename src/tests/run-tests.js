import { runSelfTests } from './self-tests.js';

const results = runSelfTests();
results.forEach((test) => {
  console.log(`${test.ok ? 'PASS' : 'FAIL'} ${test.name}${test.err ? `: ${test.err}` : ''}`);
});

const passed = results.filter((test) => test.ok).length;
console.log(`\n${passed}/${results.length} tests passed`);
if (passed !== results.length) process.exitCode = 1;

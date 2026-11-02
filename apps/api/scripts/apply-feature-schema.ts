import '../src/env';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { redactDiagnostics } from '../src/lib/logger';
const require = createRequire(import.meta.url);
try {
  for (const file of [
    'prisma/migrations/20261102013000_media_calendar/migration.sql',
    'prisma/migrations/20261102083000_meeting_page_index/migration.sql',
    'prisma/migrations/20261102100000_meeting_collaboration/migration.sql',
  ]) {
    const output = execFileSync(
      process.execPath,
      [
        require.resolve('prisma/build/index.js'),
        'db',
        'execute',
        '--schema',
        'prisma/schema.prisma',
        '--file',
        file,
      ],
      { encoding: 'utf8', windowsHide: true },
    );
    console.log(redactDiagnostics(output));
  }
} catch {
  console.error(
    'Could not apply additive feature schema. Check database connectivity and migration documentation.',
  );
  process.exitCode = 1;
}

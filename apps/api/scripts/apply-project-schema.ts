import '../src/env';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { prisma } from '../src/lib/prisma';
const require = createRequire(import.meta.url);
try {
  const marker = await prisma.$queryRaw<
    { present: boolean }[]
  >`SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='instance_state') AS present`;
  if (marker[0]?.present)
    console.log('Project execution schema is already applied.');
  else {
    execFileSync(
      process.execPath,
      [
        require.resolve('prisma/build/index.js'),
        'db',
        'execute',
        '--schema',
        'prisma/schema.prisma',
        '--file',
        'prisma/migrations/20261102110000_project_execution/migration.sql',
      ],
      { stdio: 'pipe', windowsHide: true },
    );
    console.log(
      'Project execution schema and explicit legacy-review backfill applied.',
    );
  }
} catch {
  console.error(
    'Project migration could not finish. No reset was performed; review database connectivity and migration diagnostics before retrying.',
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

import { prisma } from '../lib/prisma';
let context:
  Promise<{ userId: string; workspaceId: string; email: string }> | undefined;
export function instanceContext() {
  context ??= prisma.instanceState
    .findUniqueOrThrow({ where: { id: 'primary' } })
    .then(async (state) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: state.userId },
        select: { email: true },
      });
      return {
        userId: state.userId,
        workspaceId: state.workspaceId,
        email: user.email,
      };
    })
    .catch((error: unknown) => {
      context = undefined;
      throw error;
    });
  return context;
}

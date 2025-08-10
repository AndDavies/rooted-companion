export async function getOrCreateUserPlanByTemplate(args: {
  templateName: string
  version: number
  startDate: string
  mode: 'template' | 'agent' | 'hybrid'
}) {
  void args
  throw new Error('Not implemented in this PR')
}

export async function markPlanItemComplete(
  planItemId: string,
  moodBefore?: number,
  moodAfter?: number,
  notes?: string
) {
  void planItemId
  void moodBefore
  void moodAfter
  void notes
  throw new Error('Not implemented in this PR')
}

export async function markPlanItemSkip(planItemId: string, notes?: string) {
  void planItemId
  void notes
  throw new Error('Not implemented in this PR')
}



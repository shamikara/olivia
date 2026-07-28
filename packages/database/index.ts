export type EntityId = string;
export type AuditRecord = { id: EntityId; action: string; actorId: EntityId; createdAt: Date };

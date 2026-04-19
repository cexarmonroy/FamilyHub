/** Tres niveles: óptimo para UI (semáforo) y reglas simples. */
export type AlertLevel = "ok" | "warning" | "critical";

export type AlertDomain = "school" | "health";

export type DashboardAlert = {
  id: string;
  domain: AlertDomain;
  level: AlertLevel;
  message: string;
  memberId: string | null;
  memberName: string;
};

export type AgendaEventPayload = {
  id: string;
  title: string;
  at: string;
  tone: string;
};

export type MemberDashboardStatus = {
  id: string;
  name: string;
  status: AlertLevel;
  /** Primer mensaje representativo (si hay). */
  highlight: string | null;
  alerts: DashboardAlert[];
};

export type DashboardState = {
  globalStatus: AlertLevel;
  summary: { school: string; health: string };
  priorityAlerts: DashboardAlert[];
  members: MemberDashboardStatus[];
  agendaEvents: AgendaEventPayload[];
  /** Conteo de alertas no triviales (para badge “prioritarias”). */
  alertCount: number;
};

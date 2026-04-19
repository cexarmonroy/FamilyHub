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
  /** Ruta en la app para profundizar (escuela/salud del familiar o notificaciones). */
  detailHref: string | null;
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

export type DashboardSummaryLine = {
  message: string;
  detailHref: string | null;
};

export type DashboardState = {
  globalStatus: AlertLevel;
  summary: { school: DashboardSummaryLine; health: DashboardSummaryLine };
  priorityAlerts: DashboardAlert[];
  members: MemberDashboardStatus[];
  agendaEvents: AgendaEventPayload[];
  /** Conteo de alertas no triviales (para badge “prioritarias”). */
  alertCount: number;
};

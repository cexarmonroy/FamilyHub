/** Tres niveles: óptimo para UI (semáforo) y reglas simples. */
export type AlertLevel = "ok" | "warning" | "critical";

export type AlertDomain = "school" | "health";

export type DashboardActionType =
  | "complete_task"
  | "complete_event"
  | "mark_medication_taken"
  | "mark_vaccine_applied"
  | "mark_notification_read"
  | "mark_chronic_medication_taken";

export type DashboardAlertAction =
  | {
      id: string;
      type: "complete_task";
      label: string;
      entityId: string;
      entityType: "task";
      memberId: string;
    }
  | {
      id: string;
      type: "complete_event";
      label: string;
      entityId: string;
      entityType: "event";
      memberId: string;
    }
  | {
      id: string;
      type: "mark_medication_taken";
      label: string;
      entityId: string;
      entityType: "medication";
      memberId: string;
    }
  | {
      id: string;
      type: "mark_vaccine_applied";
      label: string;
      entityId: string;
      entityType: "vaccine";
      memberId: string;
    }
  | {
      id: string;
      type: "mark_notification_read";
      label: string;
      entityId: string;
      entityType: "notification";
      memberId: string;
    }
  | {
      id: string;
      type: "mark_chronic_medication_taken";
      label: string;
      entityId: string;
      entityType: "chronic_medication";
      memberId: string;
    };

/** Payload que acepta el ejecutor en servidor (serializable). */
export type DashboardExecutableAction =
  | { type: "complete_task"; entityId: string; memberId: string }
  | { type: "complete_event"; entityId: string; memberId: string }
  | { type: "mark_medication_taken"; entityId: string; memberId: string }
  | { type: "mark_vaccine_applied"; entityId: string; memberId: string }
  | { type: "mark_notification_read"; entityId: string }
  | { type: "mark_chronic_medication_taken"; entityId: string; memberId: string }
  | { type: "snooze_alert"; alertKey: string };

export type DashboardAlert = {
  id: string;
  domain: AlertDomain;
  level: AlertLevel;
  message: string;
  memberId: string | null;
  memberName: string;
  /** Ruta en la app para profundizar (escuela/salud del familiar o notificaciones). */
  detailHref: string | null;
  /** Acciones rápidas (p. ej. marcar tarea hecha). */
  actions?: DashboardAlertAction[];
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

/** Fila única o grupo por familiar + tipo (reduce ruido en el tablero). */
export type DashboardAlertDisplayRow =
  | { kind: "single"; alert: DashboardAlert }
  | {
      kind: "group";
      id: string;
      groupKind: "chronic_medications" | "visit_medications";
      memberId: string;
      memberName: string;
      count: number;
      message: string;
      detailHref: string | null;
      children: DashboardAlert[];
    };

export type DashboardState = {
  globalStatus: AlertLevel;
  summary: { school: DashboardSummaryLine; health: DashboardSummaryLine };
  /** Resumen en lenguaje natural para la cabecera del tablero. */
  naturalLanguageSummary: string;
  /** Críticas listas para la UI (pueden ir agrupadas). */
  priorityDisplayRows: DashboardAlertDisplayRow[];
  /** Avisos listos para la UI (pueden ir agrupadas). */
  warningDisplayRows: DashboardAlertDisplayRow[];
  members: MemberDashboardStatus[];
  agendaEvents: AgendaEventPayload[];
  /** Conteo de alertas no triviales (para badge). */
  alertCount: number;
};

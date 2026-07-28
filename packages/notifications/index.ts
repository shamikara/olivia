export type NotificationChannel = "email" | "sms" | "push" | "in_app";
export type Notification = { channel: NotificationChannel; subject: string; body: string };

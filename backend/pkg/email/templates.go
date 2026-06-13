package email

import "fmt"

// PasswordResetData holds data for the password reset email.
type PasswordResetData struct {
	FirstName   string
	ResetURL    string
	ExpireHours int
}

// EmailVerificationData holds data for the email verification email.
type EmailVerificationData struct {
	FirstName      string
	VerificationURL string
	ExpireHours    int
}

// PasswordResetEmail returns subject, HTML body, and text body for password reset.
func PasswordResetEmail(data PasswordResetData) (subject, html, text string) {
	subject = "Reset your XCreativs password"
	html = fmt.Sprintf(`<div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin-top:0">Password reset request</h2>
  <p>Hi %s,</p>
  <p>We received a request to reset your XCreativs account password. Click the link below to set a new password:</p>
  <p><a href="%s" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px">Reset password</a></p>
  <p style="color:#666;font-size:14px">This link expires in %d hour(s). If you did not request this, you can safely ignore this email.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#999;font-size:12px">XCreativs Platform</p>
</div>`, data.FirstName, data.ResetURL, data.ExpireHours)

	text = fmt.Sprintf("Hi %s,\n\nWe received a request to reset your XCreativs account password. Visit the link below to set a new password:\n\n%s\n\nThis link expires in %d hour(s). If you did not request this, you can safely ignore this email.\n\n— XCreativs Platform", data.FirstName, data.ResetURL, data.ExpireHours)
	return
}

// VerificationEmail returns subject, HTML body, and text body for email verification.
func VerificationEmail(data EmailVerificationData) (subject, html, text string) {
	subject = "Verify your XCreativs email address"
	html = fmt.Sprintf(`<div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin-top:0">Verify your email</h2>
  <p>Hi %s,</p>
  <p>Thanks for signing up. Please confirm your email address by clicking the link below:</p>
  <p><a href="%s" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px">Verify email</a></p>
  <p style="color:#666;font-size:14px">This link expires in %d hour(s).</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#999;font-size:12px">XCreativs Platform</p>
</div>`, data.FirstName, data.VerificationURL, data.ExpireHours)

	text = fmt.Sprintf("Hi %s,\n\nThanks for signing up. Please confirm your email address by visiting the link below:\n\n%s\n\nThis link expires in %d hour(s).\n\n— XCreativs Platform", data.FirstName, data.VerificationURL, data.ExpireHours)
	return
}

// RFPConfirmationData holds data for RFP submission emails.
type RFPConfirmationData struct {
	Name         string
	Email        string
	Organization string
	ScopeSummary string
}

// RFPConfirmationEmail returns subject, HTML body, and text body for RFP submission.
func RFPConfirmationEmail(data RFPConfirmationData) (subject, html, text string) {
	subject = "Your RFP has been received — XCreativs"
	html = fmt.Sprintf(`<div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin-top:0">RFP Received</h2>
  <p>Hi %s,</p>
  <p>Thank you for submitting an RFP on behalf of <strong>%s</strong>. We have received your request and our team will review it shortly.</p>
  <p style="color:#666;font-size:14px">We typically respond within 2–3 business days.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#999;font-size:12px">XCreativs Platform</p>
</div>`, data.Name, data.Organization)

	text = fmt.Sprintf("Hi %s,\n\nThank you for submitting an RFP on behalf of %s. We have received your request and our team will review it shortly.\n\nWe typically respond within 2–3 business days.\n\n— XCreativs Platform", data.Name, data.Organization)
	return
}

// DiagnosticConfirmationData holds data for diagnostic start emails.
type DiagnosticConfirmationData struct {
	Name         string
	Email        string
	Organization string
	DiagnosticURL string
}

// DiagnosticConfirmationEmail returns subject, HTML body, and text body for diagnostic start.
func DiagnosticConfirmationEmail(data DiagnosticConfirmationData) (subject, html, text string) {
	subject = "Your Digital Systems Diagnostic has started — XCreativs"
	html = fmt.Sprintf(`<div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin-top:0">Diagnostic Started</h2>
  <p>Hi %s,</p>
  <p>Your Digital Systems Diagnostic for <strong>%s</strong> is now underway. Our team will analyse your responses and prepare a tailored readiness report.</p>
  <p style="color:#666;font-size:14px">You will receive your report within 1–2 business days.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#999;font-size:12px">XCreativs Platform</p>
</div>`, data.Name, data.Organization)

	text = fmt.Sprintf("Hi %s,\n\nYour Digital Systems Diagnostic for %s is now underway. Our team will analyse your responses and prepare a tailored readiness report.\n\nYou will receive your report within 1–2 business days.\n\n— XCreativs Platform", data.Name, data.Organization)
	return
}

// BookingConfirmationData holds data for booking emails.
type BookingConfirmationData struct {
	Name        string
	Email       string
	Topic       string
	Date        string
	Time        string
	Status      string
	DashboardURL string
}

// BookingConfirmationEmail returns subject, HTML body, and text body for booking confirmation.
func BookingConfirmationEmail(data BookingConfirmationData) (subject, html, text string) {
	switch data.Status {
	case "confirmed":
		subject = "Your XCreativs consultation is confirmed"
		html = fmt.Sprintf(`<div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin-top:0">Consultation confirmed</h2>
  <p>Hi %s,</p>
  <p>Your <strong>%s</strong> consultation has been confirmed.</p>
  <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
    <p style="margin:0"><strong>Date:</strong> %s</p>
    <p style="margin:8px 0 0"><strong>Time:</strong> %s</p>
  </div>
  <p>We will send a calendar invite shortly. If you need to reschedule, please reply to this email.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#999;font-size:12px">XCreativs Platform</p>
</div>`, data.Name, data.Topic, data.Date, data.Time)
		text = fmt.Sprintf("Hi %s,\n\nYour %s consultation has been confirmed.\n\nDate: %s\nTime: %s\n\nWe will send a calendar invite shortly. If you need to reschedule, please reply to this email.\n\n— XCreativs Platform", data.Name, data.Topic, data.Date, data.Time)

	case "cancelled":
		subject = "Your XCreativs consultation has been cancelled"
		html = fmt.Sprintf(`<div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin-top:0">Consultation cancelled</h2>
  <p>Hi %s,</p>
  <p>Your <strong>%s</strong> consultation has been cancelled.</p>
  <p>If you would like to reschedule, please book a new time at %s</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#999;font-size:12px">XCreativs Platform</p>
</div>`, data.Name, data.Topic, data.DashboardURL)
		text = fmt.Sprintf("Hi %s,\n\nYour %s consultation has been cancelled.\n\nIf you would like to reschedule, please book a new time.\n\n— XCreativs Platform", data.Name, data.Topic)

	default:
		subject = "Your XCreativs consultation request received"
		html = fmt.Sprintf(`<div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin-top:0">Consultation request received</h2>
  <p>Hi %s,</p>
  <p>Thank you for requesting a <strong>%s</strong> consultation. We have received your request and will confirm shortly.</p>
  <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
    <p style="margin:0"><strong>Preferred date:</strong> %s</p>
    <p style="margin:8px 0 0"><strong>Preferred time:</strong> %s</p>
  </div>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#999;font-size:12px">XCreativs Platform</p>
</div>`, data.Name, data.Topic, data.Date, data.Time)
		text = fmt.Sprintf("Hi %s,\n\nThank you for requesting a %s consultation. We have received your request and will confirm shortly.\n\nPreferred date: %s\nPreferred time: %s\n\n— XCreativs Platform", data.Name, data.Topic, data.Date, data.Time)
	}
	return
}

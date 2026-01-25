package mailer

import (
	"fmt"

	resend "github.com/resend/resend-go/v3"
)

type ResendMailer struct {
	client *resend.Client
	from   string
}

func NewResendClient(apiKey, from string) Sender {
	return &ResendMailer{
		client: resend.NewClient(apiKey),
		from:   from,
	}
}

func (m *ResendMailer) SendVerificationCode(to, code string) error {
	subject := "Your verification code"
	text := fmt.Sprintf("Your verification code is: %s\n\nIf you didn’t request this, you can ignore this email.", code)

	_, err := m.client.Emails.Send(&resend.SendEmailRequest{
		From:    m.from,
		To:      []string{to},
		Subject: subject,
		Text:    text,
	})
	return err
}

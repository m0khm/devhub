package mailer

type Sender interface {
	SendVerificationCode(email, code string) error
}

type NoopMailer struct{}

func (NoopMailer) SendVerificationCode(email, code string) error {
	return nil
}

package mailer

import (
	"fmt"
	"net/smtp"
	"strings"
)

type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

type SMTPClient struct {
	host string
	addr string
	from string
	auth smtp.Auth
}

func NewSMTPClient(cfg SMTPConfig) *SMTPClient {
	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	var auth smtp.Auth
	if cfg.Username != "" || cfg.Password != "" {
		auth = smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)
	}

	return &SMTPClient{
		host: cfg.Host,
		addr: addr,
		from: cfg.From,
		auth: auth,
	}
}

func (c *SMTPClient) SendVerificationCode(email, code string) error {
	if c.from == "" {
		return fmt.Errorf("mailer from address is not configured")
	}

	subject := "DevHub verification code"
	body := fmt.Sprintf("Your verification code is: %s\n\nThis code expires in 10 minutes.", code)

	message := strings.Join([]string{
		fmt.Sprintf("From: %s", c.from),
		fmt.Sprintf("To: %s", email),
		fmt.Sprintf("Subject: %s", subject),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=\"utf-8\"",
		"",
		body,
	}, "\r\n")

	return smtp.SendMail(c.addr, c.auth, c.from, []string{email}, []byte(message))
}

func (c *SMTPClient) SendPasswordResetCode(email, code string) error {
	if c.from == "" {
		return fmt.Errorf("mailer from address is not configured")
	}

	subject := "DevHub password reset code"
	body := fmt.Sprintf("Your password reset code is: %s\n\nThis code expires in 15 minutes.", code)

	message := strings.Join([]string{
		fmt.Sprintf("From: %s", c.from),
		fmt.Sprintf("To: %s", email),
		fmt.Sprintf("Subject: %s", subject),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=\"utf-8\"",
		"",
		body,
	}, "\r\n")

	return smtp.SendMail(c.addr, c.auth, c.from, []string{email}, []byte(message))
}

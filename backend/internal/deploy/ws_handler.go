package deploy

import (
	"fmt"
	"io"
	"log"
	"time"

	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/ssh"
)

type WSHandler struct {
	service *Service
}

func NewWSHandler(service *Service) *WSHandler {
	return &WSHandler{service: service}
}

// GET /api/projects/:projectId/deploy/servers/:serverId/terminal/ws
func (h *WSHandler) HandleTerminal(c *websocket.Conn) {
	userIDStr, ok := c.Locals("userID").(string)
	if !ok {
		_ = c.Close()
		return
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		_ = c.Close()
		return
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		_ = c.Close()
		return
	}
	serverID, err := uuid.Parse(c.Params("serverId"))
	if err != nil {
		_ = c.Close()
		return
	}

	server, err := h.service.GetServerForTerminal(projectID, serverID, userID)
	if err != nil {
		_ = c.Close()
		return
	}

	client, session, stdin, stdout, stderr, err := h.openSession(server)
	if err != nil {
		log.Printf("terminal connect failed: %v", err)
		_ = c.Close()
		return
	}
	defer func() {
		_ = session.Close()
		_ = client.Close()
		_ = c.Close()
	}()

	h.service.RecordTerminalConnection(projectID, userID, server)

	go streamOutput(c, stdout)
	go streamOutput(c, stderr)

	for {
		_, msg, err := c.ReadMessage()
		if err != nil {
			break
		}
		if len(msg) == 0 {
			continue
		}
		if _, err := stdin.Write(msg); err != nil {
			break
		}
	}
}

func (h *WSHandler) openSession(server *DeployServer) (*ssh.Client, *ssh.Session, io.WriteCloser, io.Reader, io.Reader, error) {
	address := fmt.Sprintf("%s:%d", server.Host, server.Port)
	var auth ssh.AuthMethod

	switch server.AuthType {
	case "password":
		password, err := h.service.DecryptPassword(server)
		if err != nil {
			return nil, nil, nil, nil, nil, err
		}
		auth = ssh.Password(password)
	case "key":
		key, err := h.service.DecryptPrivateKey(server)
		if err != nil {
			return nil, nil, nil, nil, nil, err
		}
		signer, err := ssh.ParsePrivateKey([]byte(key))
		if err != nil {
			return nil, nil, nil, nil, nil, err
		}
		auth = ssh.PublicKeys(signer)
	default:
		return nil, nil, nil, nil, nil, fmt.Errorf("unsupported auth type")
	}

	config := &ssh.ClientConfig{
		User:            server.Username,
		Auth:            []ssh.AuthMethod{auth},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

	client, err := ssh.Dial("tcp", address, config)
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}

	session, err := client.NewSession()
	if err != nil {
		_ = client.Close()
		return nil, nil, nil, nil, nil, err
	}

	modes := ssh.TerminalModes{
		ssh.ECHO:          1,
		ssh.TTY_OP_ISPEED: 14400,
		ssh.TTY_OP_OSPEED: 14400,
	}

	if err := session.RequestPty("xterm-256color", 40, 120, modes); err != nil {
		_ = session.Close()
		_ = client.Close()
		return nil, nil, nil, nil, nil, err
	}

	stdin, err := session.StdinPipe()
	if err != nil {
		_ = session.Close()
		_ = client.Close()
		return nil, nil, nil, nil, nil, err
	}
	stdout, err := session.StdoutPipe()
	if err != nil {
		_ = session.Close()
		_ = client.Close()
		return nil, nil, nil, nil, nil, err
	}
	stderr, err := session.StderrPipe()
	if err != nil {
		_ = session.Close()
		_ = client.Close()
		return nil, nil, nil, nil, nil, err
	}

	if err := session.Shell(); err != nil {
		_ = session.Close()
		_ = client.Close()
		return nil, nil, nil, nil, nil, err
	}

	return client, session, stdin, stdout, stderr, nil
}

func streamOutput(c *websocket.Conn, reader io.Reader) {
	buf := make([]byte, 4096)
	for {
		n, err := reader.Read(buf)
		if n > 0 {
			_ = c.WriteMessage(websocket.TextMessage, buf[:n])
		}
		if err != nil {
			return
		}
	}
}
